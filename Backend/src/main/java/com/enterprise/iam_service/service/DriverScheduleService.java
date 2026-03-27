package com.enterprise.iam_service.service;

import com.enterprise.iam_service.dto.DriverScheduleRequest;
import com.enterprise.iam_service.dto.DriverScheduleResponse;
import com.enterprise.iam_service.model.DriverSchedule;
import com.enterprise.iam_service.model.User;
import com.enterprise.iam_service.repository.DriverScheduleRepository;
import com.enterprise.iam_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DriverScheduleService {

    private final DriverScheduleRepository driverScheduleRepository;
    private final UserRepository userRepository;

    // * Business Logic: Creates a new schedule entry for a driver/pharmacist.
    // ! ADMIN can specify any pharmacistEgn in the request body.
    // ! A DRIVER calling this endpoint always creates a schedule for themselves —
    // !   the pharmacistEgn field in the request is ignored for non-admins.
    public DriverScheduleResponse create(DriverScheduleRequest request) {
        User pharmacist = resolveTargetDriver(request.pharmacistEgn());

        // ! Guard: Prevent duplicate active schedule entries for the same driver + day.
        driverScheduleRepository.findByPharmacistAndDayOfWeek(pharmacist, request.dayOfWeek())
            .ifPresent(existing -> {
                if (existing.getActive()) {
                    throw new RuntimeException(
                        "An active schedule already exists for this driver on day " + request.dayOfWeek() +
                        ". Use /update to modify it."
                    );
                }
            });

        DriverSchedule schedule = DriverSchedule.builder()
            .pharmacist(pharmacist)
            .dayOfWeek(request.dayOfWeek())
            .specificDate(request.specificDate())
            .workStart(request.workStart())
            .workEnd(request.workEnd())
            .deliveryZone(request.deliveryZone())
            .maxDeliveries(request.maxDeliveries() != null ? request.maxDeliveries() : 10)
            .acceptingDeliveries(request.acceptingDeliveries() != null ? request.acceptingDeliveries() : true)
            .notes(request.notes())
            .build();

        return toResponse(driverScheduleRepository.save(schedule));
    }

    // * Business Logic: Returns all ACTIVE schedule entries from the start of the current week
    // * onward for the calling user. The "current week" is anchored to the most recent Monday.
    public List<DriverScheduleResponse> getMySchedules() {
        User caller = getCallerUser();

        LocalDate startOfWeek = LocalDate.now().with(DayOfWeek.MONDAY);

        return driverScheduleRepository.findByPharmacist(caller).stream()
            .filter(s -> s.getActive())
            // * Recurring weekly templates (no specificDate) are always included.
            // * Specific-date overrides are included only from this Monday onward.
            .filter(s -> s.getSpecificDate() == null || !s.getSpecificDate().isBefore(startOfWeek))
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    // * Business Logic: Updates mutable fields on an existing driver schedule entry.
    // ! Ownership check: a DRIVER can only update their own entries.
    // ! An ADMIN can update any entry.
    public DriverScheduleResponse update(UUID scheduleId, DriverScheduleRequest request) {
        DriverSchedule schedule = driverScheduleRepository.findById(scheduleId)
            .orElseThrow(() -> new RuntimeException("Schedule not found"));

        assertOwnershipOrAdmin(schedule.getPharmacist());

        if (request.dayOfWeek() != null)           schedule.setDayOfWeek(request.dayOfWeek());
        if (request.specificDate() != null)         schedule.setSpecificDate(request.specificDate());
        if (request.workStart() != null)            schedule.setWorkStart(request.workStart());
        if (request.workEnd() != null)              schedule.setWorkEnd(request.workEnd());
        if (request.deliveryZone() != null)         schedule.setDeliveryZone(request.deliveryZone());
        if (request.maxDeliveries() != null)        schedule.setMaxDeliveries(request.maxDeliveries());
        if (request.acceptingDeliveries() != null)  schedule.setAcceptingDeliveries(request.acceptingDeliveries());
        if (request.notes() != null)                schedule.setNotes(request.notes());

        return toResponse(driverScheduleRepository.save(schedule));
    }

    // * Business Logic: Soft-removes a schedule by flipping active → false.
    public void remove(UUID scheduleId) {
        DriverSchedule schedule = driverScheduleRepository.findById(scheduleId)
            .orElseThrow(() -> new RuntimeException("Schedule not found"));

        assertOwnershipOrAdmin(schedule.getPharmacist());

        schedule.setActive(false);
        driverScheduleRepository.save(schedule);
    }

    // ---------------------------------------------------------------------------
    // Private helpers
    // ---------------------------------------------------------------------------

    private User resolveTargetDriver(String pharmacistEgn) {
        if (isAdmin()) {
            if (pharmacistEgn == null || pharmacistEgn.isBlank()) {
                throw new RuntimeException("ADMIN must supply pharmacistEgn in the request body");
            }
            return userRepository.findById(pharmacistEgn)
                .orElseThrow(() -> new RuntimeException("Driver not found for EGN: " + pharmacistEgn));
        }
        return getCallerUser();
    }

    private User getCallerUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    private boolean isAdmin() {
        return SecurityContextHolder.getContext().getAuthentication()
            .getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"));
    }

    private void assertOwnershipOrAdmin(User scheduleOwner) {
        if (isAdmin()) return;
        User caller = getCallerUser();
        if (!caller.getEgn().equals(scheduleOwner.getEgn())) {
            throw new org.springframework.security.access.AccessDeniedException(
                "You do not have permission to modify this schedule"
            );
        }
    }

    private DriverScheduleResponse toResponse(DriverSchedule s) {
        return new DriverScheduleResponse(
            s.getId(),
            s.getPharmacist().getEgn(),
            s.getPharmacist().getFirstName() + " " + s.getPharmacist().getLastName(),
            s.getDayOfWeek(),
            s.getSpecificDate(),
            s.getWorkStart(),
            s.getWorkEnd(),
            s.getDeliveryZone(),
            s.getMaxDeliveries(),
            s.getAcceptingDeliveries(),
            s.getActive(),
            s.getNotes(),
            s.getCreatedAt(),
            s.getUpdatedAt()
        );
    }
}