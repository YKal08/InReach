package com.enterprise.iam_service.service;

import com.enterprise.iam_service.dto.VisitPlanResponse;
import com.enterprise.iam_service.model.DoctorSchedule;
import com.enterprise.iam_service.model.Route;
import com.enterprise.iam_service.model.RouteStop;
import com.enterprise.iam_service.model.User;
import com.enterprise.iam_service.model.VisitRequest;
import com.enterprise.iam_service.repository.DoctorScheduleRepository;
import com.enterprise.iam_service.repository.RouteRepository;
import com.enterprise.iam_service.repository.UserRepository;
import com.enterprise.iam_service.repository.VisitRequestRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RoutePlanningServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private DoctorScheduleRepository doctorScheduleRepository;

    @Mock
    private VisitRequestRepository visitRequestRepository;

    @Mock
    private RouteRepository routeRepository;

    @Mock
    private GoogleDistanceMatrixService distanceMatrixService;

    @Mock
    private OrToolsRouteOptimizerService optimizerService;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private RoutePlanningService routePlanningService;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void generateTomorrowDraftPlans_shouldCreateDraftRouteWithOptimizedStops() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        User doctor = doctor("1111111111", "doctor@test.com");

        DoctorSchedule schedule = DoctorSchedule.builder()
                .doctor(doctor)
                .dayOfWeek(tomorrow.getDayOfWeek().getValue())
                .workStart(LocalTime.of(8, 0))
                .workEnd(LocalTime.of(16, 0))
                .acceptingRequests(true)
                .maxRequests(2)
                .active(true)
                .build();

        VisitRequest first = pendingRequest("Addr-1", patient("2000000001", "p1@test.com", "Anna", "Ivanova"), doctor.getEgn());
        VisitRequest second = pendingRequest("Addr-2", patient("2000000002", "p2@test.com", "Boris", "Petrov"), doctor.getEgn());

        when(userRepository.findAllByRoles_NameIgnoreCase("DOCTOR")).thenReturn(List.of(doctor));
        when(routeRepository.findByDoctorAndDate(doctor, tomorrow)).thenReturn(Optional.empty());
        when(doctorScheduleRepository.findByDoctorAndSpecificDateAndActiveTrue(doctor, tomorrow)).thenReturn(Optional.empty());
        when(doctorScheduleRepository.findByDoctorAndDayOfWeekAndSpecificDateIsNullAndActiveTrue(doctor, tomorrow.getDayOfWeek().getValue()))
                .thenReturn(Optional.of(schedule));
        when(visitRequestRepository.findByDoctorEgnAndStatusOrderByCreatedAtAsc(doctor.getEgn(), "PENDING"))
                .thenReturn(List.of(first, second));

        int[][] matrix = new int[][]{
                {0, 600, 1200},
                {600, 0, 900},
                {1200, 900, 0}
        };
        when(distanceMatrixService.buildDurationMatrixInSeconds(any())).thenReturn(matrix);
        when(optimizerService.optimize(eq(matrix), eq(LocalTime.of(8, 0)), eq(LocalTime.of(16, 0)), eq(30), any()))
                .thenReturn(new OrToolsRouteOptimizerService.OptimizationResult(
                        List.of(1, 2),
                        List.of(LocalTime.of(9, 0), LocalTime.of(10, 0))
                ));
        when(routeRepository.save(any(Route.class))).thenAnswer(invocation -> invocation.getArgument(0));

        routePlanningService.generateTomorrowDraftPlans();

        ArgumentCaptor<Route> routeCaptor = ArgumentCaptor.forClass(Route.class);
        verify(routeRepository, times(1)).save(routeCaptor.capture());
        Route saved = routeCaptor.getValue();

        assertEquals("DRAFT", saved.getStatus());
        assertEquals(tomorrow, saved.getDate());
        assertEquals(2, saved.getStops().size());

        RouteStop stop1 = saved.getStops().get(0);
        RouteStop stop2 = saved.getStops().get(1);
        assertEquals(first.getUser().getEgn(), stop1.getVisitRequest().getUser().getEgn());
        assertEquals(second.getUser().getEgn(), stop2.getVisitRequest().getUser().getEgn());
        assertEquals(LocalTime.of(9, 0), stop1.getArrivalTime());
        assertEquals(LocalTime.of(10, 0), stop2.getArrivalTime());
    }

    @Test
    void generateTomorrowDraftPlans_shouldSkipWhenScheduleMissing() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        User doctor = doctor("1111111111", "doctor@test.com");

        when(userRepository.findAllByRoles_NameIgnoreCase("DOCTOR")).thenReturn(List.of(doctor));
        when(routeRepository.findByDoctorAndDate(doctor, tomorrow)).thenReturn(Optional.empty());
        when(doctorScheduleRepository.findByDoctorAndSpecificDateAndActiveTrue(doctor, tomorrow)).thenReturn(Optional.empty());
        when(doctorScheduleRepository.findByDoctorAndDayOfWeekAndSpecificDateIsNullAndActiveTrue(doctor, tomorrow.getDayOfWeek().getValue()))
                .thenReturn(Optional.empty());

        routePlanningService.generateTomorrowDraftPlans();

        verify(routeRepository, never()).save(any(Route.class));
        verify(visitRequestRepository, never()).findByDoctorEgnAndStatusOrderByCreatedAtAsc(any(), any());
    }

    @Test
    void confirmMyPlan_shouldMarkRouteAndRequestsAndSendEmails() {
        User doctor = doctor("1111111111", "doctor@test.com");
        User patient = patient("2000000001", "patient@test.com", "Anna", "Ivanova");
        setDoctorAuth(doctor.getEmail());

        VisitRequest req = pendingRequest("Sofia", patient, doctor.getEgn());
        Route route = Route.builder()
                .id(UUID.randomUUID())
                .doctor(doctor)
                .date(LocalDate.now().plusDays(1))
                .status("DRAFT")
                .stops(new ArrayList<>())
                .build();

        RouteStop stop = RouteStop.builder()
                .route(route)
                .visitRequest(req)
                .stopOrder(1)
                .arrivalTime(LocalTime.of(9, 0))
                .windowStart(LocalTime.of(8, 45))
                .windowEnd(LocalTime.of(9, 15))
                .travelMinutesToNext(null)
                .status("PENDING")
                .build();
        route.getStops().add(stop);

        when(userRepository.findByEmail(doctor.getEmail())).thenReturn(Optional.of(doctor));
        when(routeRepository.findById(route.getId())).thenReturn(Optional.of(route));
        when(routeRepository.save(any(Route.class))).thenAnswer(invocation -> invocation.getArgument(0));

        VisitPlanResponse response = routePlanningService.confirmMyPlan(route.getId());

        assertEquals("CONFIRMED", route.getStatus());
        assertEquals("SCHEDULED", req.getStatus());
        assertNotNull(response);
        assertEquals(route.getId(), response.planId());

        verify(emailService, times(2)).sendSimpleEmail(any(), any(), any());
    }

    @Test
    void generateMyDraftPlan_shouldReturnExistingRouteWhenForceFalse() {
        User doctor = doctor("1111111111", "doctor@test.com");
        setDoctorAuth(doctor.getEmail());

        Route existing = Route.builder()
                .id(UUID.randomUUID())
                .doctor(doctor)
                .date(LocalDate.now().plusDays(1))
                .status("DRAFT")
                .stops(new ArrayList<>())
                .build();

        when(userRepository.findByEmail(doctor.getEmail())).thenReturn(Optional.of(doctor));
        when(routeRepository.findByDoctorAndDate(eq(doctor), any(LocalDate.class))).thenReturn(Optional.of(existing));

        VisitPlanResponse response = routePlanningService.generateMyDraftPlan(null, false);

        assertEquals(existing.getId(), response.planId());
        assertTrue(response.visits().isEmpty());
        verify(routeRepository, never()).delete(any(Route.class));
    }

    private void setDoctorAuth(String email) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        email,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_DOCTOR"))
                )
        );
    }

    private User doctor(String egn, String email) {
        return User.builder()
                .egn(egn)
                .firstName("Doc")
                .lastName("Tor")
                .email(email)
                .passwordHash("hash")
                .rawAddress("Sofia")
                .lat(42.6977)
                .lng(23.3219)
                .status("ACTIVE")
                .build();
    }

    private User patient(String egn, String email, String firstName, String lastName) {
        return User.builder()
                .egn(egn)
                .firstName(firstName)
                .lastName(lastName)
                .email(email)
                .passwordHash("hash")
                .rawAddress("Sofia")
                .lat(42.70)
                .lng(23.33)
                .status("ACTIVE")
                .build();
    }

    private VisitRequest pendingRequest(String address, User patient, String doctorEgn) {
        return VisitRequest.builder()
                .id(UUID.randomUUID())
                .user(patient)
                .address(address)
                .doctorType("GP")
                .doctorEgn(doctorEgn)
                .status("PENDING")
                .notes("n")
                .build();
    }
}
