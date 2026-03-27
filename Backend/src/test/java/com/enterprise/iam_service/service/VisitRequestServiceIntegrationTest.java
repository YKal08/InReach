package com.enterprise.iam_service.service;

import com.enterprise.iam_service.dto.CreateVisitRequestRequest;
import com.enterprise.iam_service.dto.VisitRequestResponse;
import com.enterprise.iam_service.model.Role;
import com.enterprise.iam_service.model.User;
import com.enterprise.iam_service.model.VisitRequest;
import com.enterprise.iam_service.repository.DoctorScheduleRepository;
import com.enterprise.iam_service.repository.DriverScheduleRepository;
import com.enterprise.iam_service.repository.RoleRepository;
import com.enterprise.iam_service.repository.UserRepository;
import com.enterprise.iam_service.repository.VisitRequestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
class VisitRequestServiceIntegrationTest {

    @Autowired
    private VisitRequestService visitRequestService;

    @Autowired
    private VisitRequestRepository visitRequestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private DoctorScheduleRepository doctorScheduleRepository;

    @Autowired
    private DriverScheduleRepository driverScheduleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final String EMAIL = "patient@enterprise.com";
    private static final String DOCTOR_EGN = "6666666666";

    @BeforeEach
    void setupData() {
        // Delete in correct order to avoid foreign key violations
        visitRequestRepository.deleteAll();
        doctorScheduleRepository.deleteAll();
        driverScheduleRepository.deleteAll();
        userRepository.deleteAll();
        roleRepository.deleteAll();
        roleRepository.flush();
        userRepository.flush();
        driverScheduleRepository.flush();
        doctorScheduleRepository.flush();

        Role patientRole = roleRepository.findByName("Patient")
                .orElseGet(() -> roleRepository.save(Role.builder().name("Patient").description("Patient role").build()));
        Role doctorRole = roleRepository.findByName("Doctor")
            .orElseGet(() -> roleRepository.save(Role.builder().name("Doctor").description("Doctor role").build()));

        User user = User.builder()
                .egn("5555555555")
                .firstName("Test")
                .lastName("Patient")
                   .rawAddress("Sofia")
                .telephone("+359899999999")
                .email(EMAIL)
                .passwordHash(passwordEncoder.encode("StrongPass1"))
                .status("ACTIVE")
                .roles(Set.of(patientRole))
                .build();

        userRepository.save(user);

        User doctor = User.builder()
            .egn(DOCTOR_EGN)
            .firstName("Test")
            .lastName("Doctor")
               .rawAddress("Sofia")
            .telephone("+359877777777")
            .email("doctor@enterprise.com")
            .passwordHash(passwordEncoder.encode("StrongPass1"))
            .status("ACTIVE")
            .roles(Set.of(doctorRole))
            .build();

        userRepository.save(doctor);
    }

    @Test
    @WithMockUser(username = "patient@enterprise.com")
    @Transactional
    void createAndGetMyRequests_shouldPersistAndReturnRequest() {
        CreateVisitRequestRequest request = new CreateVisitRequestRequest("Sofia Center", "GP", "Need review");

        VisitRequestResponse created = visitRequestService.create(EMAIL, DOCTOR_EGN, request);

        assertNotNull(created.id());
        assertEquals("PENDING", created.status());

        List<VisitRequestResponse> myRequests = visitRequestService.getMyRequests(EMAIL);
        assertEquals(1, myRequests.size());
        assertEquals(created.id(), myRequests.get(0).id());
        assertEquals("Sofia Center", myRequests.get(0).address());
        assertEquals(DOCTOR_EGN, myRequests.get(0).doctorEgn());
    }

    @Test
    @WithMockUser(username = "patient@enterprise.com")
    @Transactional
    void cancel_shouldUpdateVisitRequestStatusInDatabase() {
        VisitRequestResponse created = visitRequestService.create(
                EMAIL,
            DOCTOR_EGN,
                new CreateVisitRequestRequest("Sofia Center", "Cardiology", "Urgent")
        );

        UUID requestId = created.id();
        visitRequestService.cancel(EMAIL, requestId);

        VisitRequest saved = visitRequestRepository.findById(requestId).orElseThrow();
        assertEquals("CANCELLED", saved.getStatus());
        assertEquals(DOCTOR_EGN, saved.getDoctorEgn());

        assertTrue(
                visitRequestService.getMyRequests(EMAIL)
                        .stream()
                        .anyMatch(r -> r.id().equals(requestId) && "CANCELLED".equals(r.status()))
        );
    }
}
