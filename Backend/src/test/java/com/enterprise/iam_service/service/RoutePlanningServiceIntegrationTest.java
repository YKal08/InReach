package com.enterprise.iam_service.service;

import com.enterprise.iam_service.model.DoctorSchedule;
import com.enterprise.iam_service.model.Role;
import com.enterprise.iam_service.model.Route;
import com.enterprise.iam_service.model.User;
import com.enterprise.iam_service.model.VisitRequest;
import com.enterprise.iam_service.repository.DoctorScheduleRepository;
import com.enterprise.iam_service.repository.DriverScheduleRepository;
import com.enterprise.iam_service.repository.RoleRepository;
import com.enterprise.iam_service.repository.RouteRepository;
import com.enterprise.iam_service.repository.UserRepository;
import com.enterprise.iam_service.repository.VisitRequestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
class RoutePlanningServiceIntegrationTest {

    @Autowired
    private RoutePlanningService routePlanningService;

    @Autowired
    private RouteRepository routeRepository;

    @Autowired
    private VisitRequestRepository visitRequestRepository;

    @Autowired
    private DoctorScheduleRepository doctorScheduleRepository;

    @Autowired
    private DriverScheduleRepository driverScheduleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private GoogleDistanceMatrixService distanceMatrixService;

    @MockBean
    private OrToolsRouteOptimizerService optimizerService;

    @MockBean
    private EmailService emailService;

    private User doctor;
    private VisitRequest olderRequest;
    private VisitRequest newerRequest;

    @BeforeEach
    void setupData() throws Exception {
        routeRepository.deleteAll();
        visitRequestRepository.deleteAll();
        doctorScheduleRepository.deleteAll();
        driverScheduleRepository.deleteAll();
        userRepository.deleteAll();
        roleRepository.deleteAll();
        roleRepository.flush();
        userRepository.flush();
        driverScheduleRepository.flush();
        doctorScheduleRepository.flush();
        visitRequestRepository.flush();
        routeRepository.flush();

        Role doctorRole = roleRepository.save(Role.builder().name("Doctor").description("Doctor role").build());
        Role patientRole = roleRepository.save(Role.builder().name("Patient").description("Patient role").build());

        doctor = userRepository.save(User.builder()
                .egn("9000000001")
                .firstName("House")
                .lastName("MD")
                .rawAddress("Sofia")
                .lat(42.6977)
                .lng(23.3219)
                .telephone("+359888000001")
                .email("doctor.route@test.com")
                .passwordHash(passwordEncoder.encode("StrongPass1"))
                .status("ACTIVE")
                .roles(Set.of(doctorRole))
                .build());

        User patient1 = userRepository.save(User.builder()
                .egn("9000000002")
                .firstName("Anna")
                .lastName("Patient")
                .rawAddress("Addr 1")
                .lat(42.7000)
                .lng(23.3300)
                .telephone("+359888000002")
                .email("patient1.route@test.com")
                .passwordHash(passwordEncoder.encode("StrongPass1"))
                .status("ACTIVE")
                .roles(Set.of(patientRole))
                .build());

        User patient2 = userRepository.save(User.builder()
                .egn("9000000003")
                .firstName("Boris")
                .lastName("Patient")
                .rawAddress("Addr 2")
                .lat(42.7100)
                .lng(23.3400)
                .telephone("+359888000003")
                .email("patient2.route@test.com")
                .passwordHash(passwordEncoder.encode("StrongPass1"))
                .status("ACTIVE")
                .roles(Set.of(patientRole))
                .build());

        LocalDate tomorrow = LocalDate.now().plusDays(1);
        doctorScheduleRepository.save(DoctorSchedule.builder()
                .doctor(doctor)
                .dayOfWeek(tomorrow.getDayOfWeek().getValue())
                .specificDate(null)
                .workStart(LocalTime.of(8, 0))
                .workEnd(LocalTime.of(12, 0))
                .maxRequests(1)
                .acceptingRequests(true)
                .active(true)
                .notes("Morning")
                .build());

        olderRequest = visitRequestRepository.save(VisitRequest.builder()
                .user(patient1)
                .address("Addr 1")
                .doctorType("GP")
                .doctorEgn(doctor.getEgn())
                .status("PENDING")
                .notes("older")
                .build());

        Thread.sleep(5);

        newerRequest = visitRequestRepository.save(VisitRequest.builder()
                .user(patient2)
                .address("Addr 2")
                .doctorType("GP")
                .doctorEgn(doctor.getEgn())
                .status("PENDING")
                .notes("newer")
                .build());

        when(distanceMatrixService.buildDurationMatrixInSeconds(any())).thenReturn(new int[][]{
                {0, 600},
                {600, 0}
        });

        when(optimizerService.optimize(any(), eq(LocalTime.of(8, 0)), eq(LocalTime.of(12, 0)), eq(30), ArgumentMatchers.any(int[].class)))
                .thenReturn(new OrToolsRouteOptimizerService.OptimizationResult(
                        List.of(1),
                        List.of(LocalTime.of(9, 0))
                ));
    }

    @Test
        @Transactional
    void generateTomorrowDraftPlans_shouldPersistRouteUsingOldestPendingWithinCapacityAndScheduleWindow() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);

        routePlanningService.generateTomorrowDraftPlans();

        Optional<Route> routeOpt = routeRepository.findByDoctorAndDate(doctor, tomorrow);
        assertTrue(routeOpt.isPresent());

        Route route = routeOpt.get();
        assertEquals("DRAFT", route.getStatus());
        assertEquals(1, route.getStops().size());
        assertEquals(olderRequest.getId(), route.getStops().get(0).getVisitRequest().getId());
        assertEquals(LocalTime.of(9, 0), route.getStops().get(0).getArrivalTime());

        verify(optimizerService).optimize(any(), eq(LocalTime.of(8, 0)), eq(LocalTime.of(12, 0)), eq(30), ArgumentMatchers.any(int[].class));

        // Second request remains pending because maxRequests=1.
        VisitRequest persistedNewer = visitRequestRepository.findById(newerRequest.getId()).orElseThrow();
        assertEquals("PENDING", persistedNewer.getStatus());
    }
}
