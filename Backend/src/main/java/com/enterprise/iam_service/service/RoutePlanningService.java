package com.enterprise.iam_service.service;

import com.enterprise.iam_service.dto.VisitPlanResponse;
import com.enterprise.iam_service.dto.VisitStopResponse;
import com.enterprise.iam_service.model.DoctorSchedule;
import com.enterprise.iam_service.model.Route;
import com.enterprise.iam_service.model.RouteStop;
import com.enterprise.iam_service.model.User;
import com.enterprise.iam_service.model.VisitRequest;
import com.enterprise.iam_service.repository.DoctorScheduleRepository;
import com.enterprise.iam_service.repository.RouteRepository;
import com.enterprise.iam_service.repository.UserRepository;
import com.enterprise.iam_service.repository.VisitRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoutePlanningService {

    private static final String ROLE_DOCTOR = "ROLE_DOCTOR";
    private static final String ROLE_DRIVER = "ROLE_DRIVER";
    private static final String STATUS_PENDING = "PENDING";
    private static final String STATUS_SCHEDULED = "SCHEDULED";
    private static final String PLAN_STATUS_DRAFT = "DRAFT";
    private static final String PLAN_STATUS_CONFIRMED = "CONFIRMED";
    private static final String PLAN_STATUS_CANCELLED = "CANCELLED";
    private static final int VISIT_DURATION_MINUTES = 30;
    private static final DateTimeFormatter TIME_24H = DateTimeFormatter.ofPattern("HH:mm");

    private final UserRepository userRepository;
    private final DoctorScheduleRepository doctorScheduleRepository;
    private final VisitRequestRepository visitRequestRepository;
    private final RouteRepository routeRepository;
    private final GoogleDistanceMatrixService distanceMatrixService;
    private final OrToolsRouteOptimizerService optimizerService;
    private final EmailService emailService;

    @Scheduled(cron = "${planning.cron:0 0 12 * * *}")
    @Transactional
    public void generateTomorrowDraftPlans() {
        LocalDate targetDate = LocalDate.now().plusDays(1);
        List<User> doctors = userRepository.findAllByRoles_NameIgnoreCase("DOCTOR");

        for (User doctor : doctors) {
            planForDoctorOnDate(doctor, targetDate, false);
        }
    }

    @Transactional
    public VisitPlanResponse generateMyDraftPlan(LocalDate targetDate, boolean force) {
        if (!hasRole(ROLE_DOCTOR)) {
            throw new AccessDeniedException("Only DOCTOR can trigger manual planning.");
        }

        LocalDate effectiveDate = targetDate == null ? LocalDate.now().plusDays(1) : targetDate;
        User doctor = getCallerUser();
        Route route = planForDoctorOnDate(doctor, effectiveDate, force)
                .orElseThrow(() -> new RuntimeException("No plan generated. Check schedule, requests, and coordinates."));
        return toDailyVisitPlanResponse(route);
    }

    @Transactional(readOnly = true)
    public List<VisitPlanResponse> getMyPlans(LocalDate date) {
        if (!hasRole(ROLE_DOCTOR) && !hasRole(ROLE_DRIVER)) {
            throw new AccessDeniedException("Only DOCTOR or DRIVER can access plans.");
        }

        User caller = getCallerUser();
        List<Route> routes;

        if (hasRole(ROLE_DOCTOR)) {
            routes = date == null
                    ? routeRepository.findByDoctorOrderByDateDescCreatedAtDesc(caller)
                    : routeRepository.findByDoctorAndDateOrderByCreatedAtDesc(caller, date);
        } else {
            LocalDate target = date == null ? LocalDate.now() : date;
            routes = routeRepository.findByDateOrderByCreatedAtDesc(target);
        }

        return routes.stream().map(this::toDailyVisitPlanResponse).toList();
    }

    @Transactional(readOnly = true)
    public VisitPlanResponse getRouteWithStops(UUID routeId) {
        if (!hasRole(ROLE_DOCTOR) && !hasRole(ROLE_DRIVER)) {
            throw new AccessDeniedException("Only DOCTOR or DRIVER can access routes.");
        }

        Route route = routeRepository.findById(routeId)
                .orElseThrow(() -> new RuntimeException("Route not found"));

        if (hasRole(ROLE_DOCTOR)) {
            User caller = getCallerUser();
            if (!route.getDoctor().getEgn().equals(caller.getEgn())) {
                throw new AccessDeniedException("You cannot view another doctor's route.");
            }
        }

        return toDailyVisitPlanResponse(route);
    }

    @Transactional
    public VisitPlanResponse confirmMyPlan(UUID routeId) {
        User caller = getCallerUser();
        if (!hasRole(ROLE_DOCTOR)) {
            throw new AccessDeniedException("Only DOCTOR can confirm plans.");
        }

        Route route = routeRepository.findById(routeId)
                .orElseThrow(() -> new RuntimeException("Route not found"));

        if (!route.getDoctor().getEgn().equals(caller.getEgn())) {
            throw new AccessDeniedException("You cannot confirm another doctor's plan.");
        }

        route.setStatus(PLAN_STATUS_CONFIRMED);
        for (RouteStop stop : route.getStops()) {
            stop.getVisitRequest().setStatus(STATUS_SCHEDULED);
        }

        Route saved = routeRepository.save(route);
        sendConfirmationEmails(saved);
        return toDailyVisitPlanResponse(saved);
    }

    @Transactional
    public VisitPlanResponse cancelMyPlan(UUID routeId) {
        User caller = getCallerUser();
        if (!hasRole(ROLE_DOCTOR)) {
            throw new AccessDeniedException("Only DOCTOR can cancel plans.");
        }

        Route route = routeRepository.findById(routeId)
                .orElseThrow(() -> new RuntimeException("Route not found"));

        if (!route.getDoctor().getEgn().equals(caller.getEgn())) {
            throw new AccessDeniedException("You cannot cancel another doctor's plan.");
        }

        route.setStatus(PLAN_STATUS_CANCELLED);
        for (RouteStop stop : route.getStops()) {
            stop.getVisitRequest().setStatus(STATUS_PENDING);
        }

        return toDailyVisitPlanResponse(routeRepository.save(route));
    }

    private DoctorSchedule resolveActiveScheduleForDate(User doctor, LocalDate date) {
        return doctorScheduleRepository
                .findByDoctorAndSpecificDateAndActiveTrue(doctor, date)
                .orElseGet(() -> doctorScheduleRepository
                        .findByDoctorAndDayOfWeekAndSpecificDateIsNullAndActiveTrue(doctor, date.getDayOfWeek().getValue())
                        .orElse(null));
    }

    private Optional<Route> planForDoctorOnDate(User doctor, LocalDate targetDate, boolean force) {
        Optional<Route> existing = routeRepository.findByDoctorAndDate(doctor, targetDate);
        if (existing.isPresent()) {
            if (!force) {
                return existing;
            }
            routeRepository.delete(existing.get());
            routeRepository.flush();
        }

        DoctorSchedule schedule = resolveActiveScheduleForDate(doctor, targetDate);
        if (schedule == null || !schedule.isWorkingDay() || Boolean.FALSE.equals(schedule.getAcceptingRequests())) {
            return Optional.empty();
        }

        if (doctor.getLat() == null || doctor.getLng() == null) {
            log.warn("Skipping doctor {} planning because doctor coordinates are missing", doctor.getEgn());
            return Optional.empty();
        }

        List<VisitRequest> pendingRequests = visitRequestRepository
            .findByDoctorEgnAndStatusOrderByCreatedAtAsc(doctor.getEgn(), STATUS_PENDING)
                .stream()
                .filter(r -> r.getUser() != null && r.getUser().getLat() != null && r.getUser().getLng() != null)
                .toList();

        if (pendingRequests.isEmpty()) {
            return Optional.empty();
        }

        int capacity = schedule.getMaxRequests() == null ? pendingRequests.size() : Math.max(0, schedule.getMaxRequests());
        if (capacity == 0) {
            return Optional.empty();
        }

        List<VisitRequest> candidates = pendingRequests.subList(0, Math.min(capacity, pendingRequests.size()));

        List<GoogleDistanceMatrixService.GeoPoint> points = new ArrayList<>();
        points.add(new GoogleDistanceMatrixService.GeoPoint(doctor.getLat(), doctor.getLng()));
        for (VisitRequest request : candidates) {
            points.add(new GoogleDistanceMatrixService.GeoPoint(request.getUser().getLat(), request.getUser().getLng()));
        }

        int[][] matrix = distanceMatrixService.buildDurationMatrixInSeconds(points);
        int[] dropPenalties = buildDropPenalties(candidates.size());

        OrToolsRouteOptimizerService.OptimizationResult optimized = optimizerService.optimize(
                matrix,
                schedule.getWorkStart(),
                schedule.getWorkEnd(),
                VISIT_DURATION_MINUTES,
                dropPenalties
        );

        if (optimized.orderedNodes().isEmpty()) {
            log.info("No feasible visits for doctor {} on {}", doctor.getEgn(), targetDate);
            return Optional.empty();
        }

        Route route = Route.builder()
                .doctor(doctor)
                .date(targetDate)
                .status(PLAN_STATUS_DRAFT)
                .stops(new ArrayList<>())
                .build();

        List<Integer> orderedNodes = optimized.orderedNodes();
        List<LocalTime> arrivals = optimized.arrivals();
        for (int i = 0; i < orderedNodes.size(); i++) {
            int node = orderedNodes.get(i);
            VisitRequest request = candidates.get(node - 1); // node 0 is depot
            LocalTime arrival = arrivals.get(i);
            LocalTime departure = arrival.plusMinutes(VISIT_DURATION_MINUTES);

            int previousNode = i == 0 ? 0 : orderedNodes.get(i - 1);
            int nextNode = i < orderedNodes.size() - 1 ? orderedNodes.get(i + 1) : -1;
            int travelFromPrevMin = Math.max(0, matrix[previousNode][node] / 60);
            Integer travelToNextMin = nextNode == -1 ? null : Math.max(0, matrix[node][nextNode] / 60);

            RouteStop stop = RouteStop.builder()
                    .route(route)
                    .visitRequest(request)
                    .stopOrder(i + 1)
                    .latitude(request.getUser().getLat())
                    .longitude(request.getUser().getLng())
                    .arrivalTime(arrival)
                    .windowStart(arrival.minusMinutes(15))
                    .windowEnd(arrival.plusMinutes(15))
                    .departureTime(departure)
                    .travelMinutesFromPrevious(travelFromPrevMin)
                    .travelMinutesToNext(travelToNextMin)
                    .status("PENDING")
                    .build();
            route.getStops().add(stop);
        }

        Route saved = routeRepository.save(route);
        log.info("Generated DailyVisitPlan for doctor {} on {} with {} visits", doctor.getEgn(), targetDate, saved.getStops().size());
        return Optional.of(saved);
    }

    private int[] buildDropPenalties(int size) {
        int[] penalties = new int[size];
        int base = 500_000;
        int step = 1_000;
        for (int i = 0; i < size; i++) {
            penalties[i] = base + (size - i) * step;
        }
        return penalties;
    }

    private void sendConfirmationEmails(Route route) {
        String doctorName = route.getDoctor().getFirstName() + " " + route.getDoctor().getLastName();

        StringBuilder doctorBody = new StringBuilder();
        doctorBody.append("Your DailyVisitPlan for ").append(route.getDate()).append(" is confirmed.\n\n");
        for (RouteStop stop : route.getStops()) {
            String time = format24h(stop.getArrivalTime());
            Integer next = stop.getTravelMinutesToNext();
            doctorBody
                    .append(stop.getStopOrder())
                    .append(". ")
                    .append(stop.getVisitRequest().getUser().getFirstName())
                    .append(" ")
                    .append(stop.getVisitRequest().getUser().getLastName())
                    .append(" at ")
                    .append(time)
                    .append(" (next stop: ")
                    .append(next == null ? "-" : next + " min")
                    .append(")\n");
        }

        sendEmailWithRetry(
                route.getDoctor().getEmail(),
                "DailyVisitPlan confirmed for " + route.getDate(),
                doctorBody.toString()
        );

        for (RouteStop stop : route.getStops()) {
            String patientEmail = stop.getVisitRequest().getUser().getEmail();
            String window = format24h(stop.getWindowStart()) + "-" + format24h(stop.getWindowEnd());
            String body = "Hello " + stop.getVisitRequest().getUser().getFirstName() + ",\n\n"
                    + "Your visit is scheduled on " + route.getDate() + " with " + doctorName + ".\n"
                    + "Expected arrival window: " + window + " (24-hour clock).\n\n"
                    + "Address: " + stop.getVisitRequest().getAddress() + "\n";

            sendEmailWithRetry(
                    patientEmail,
                    "Visit schedule for " + route.getDate(),
                    body
            );
        }
    }

    private void sendEmailWithRetry(String to, String subject, String body) {
        int maxAttempts = 3;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                emailService.sendSimpleEmail(to, subject, body);
                return;
            } catch (Exception ex) {
                log.warn("Email send failed attempt {}/{} to {}", attempt, maxAttempts, to, ex);
                if (attempt == maxAttempts) {
                    log.error("Email delivery failed permanently to {}", to, ex);
                }
            }
        }
    }

    private User getCallerUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    private boolean hasRole(String role) {
        return SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
            .anyMatch(auth -> auth.getAuthority() != null && auth.getAuthority().equalsIgnoreCase(role));
    }

    private String format24h(LocalTime time) {
        if (time == null) {
            return null;
        }
        return time.format(TIME_24H.withLocale(Locale.ROOT));
    }

    private VisitPlanResponse toDailyVisitPlanResponse(Route route) {
        List<VisitStopResponse> stops = route.getStops().stream()
                .map(stop -> new VisitStopResponse(
                        stop.getId(),
                        stop.getVisitRequest().getId(),
                        stop.getStopOrder(),
                        stop.getVisitRequest().getUser().getEgn(),
                        stop.getVisitRequest().getUser().getFirstName() + " " + stop.getVisitRequest().getUser().getLastName(),
                        stop.getVisitRequest().getAddress(),
                        stop.getLatitude(),
                        stop.getLongitude(),
                        format24h(stop.getArrivalTime()),
                        format24h(stop.getWindowStart()),
                        format24h(stop.getWindowEnd()),
                        stop.getTravelMinutesFromPrevious(),
                        stop.getTravelMinutesToNext(),
                        stop.getStatus()
                ))
                .toList();

        return new VisitPlanResponse(
                route.getId(),
                route.getDoctor().getEgn(),
                route.getDoctor().getFirstName() + " " + route.getDoctor().getLastName(),
                route.getDate(),
                route.getStatus(),
                route.getCreatedAt(),
                stops
        );
    }
}
