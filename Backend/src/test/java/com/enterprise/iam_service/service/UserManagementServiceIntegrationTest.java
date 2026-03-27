package com.enterprise.iam_service.service;

import com.enterprise.iam_service.dto.UserProfileResponse;
import com.enterprise.iam_service.dto.UserProfileUpdateRequest;
import com.enterprise.iam_service.model.Role;
import com.enterprise.iam_service.model.User;
import com.enterprise.iam_service.repository.RoleRepository;
import com.enterprise.iam_service.repository.UserRepository;
import com.enterprise.iam_service.repository.VisitRequestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
class UserManagementServiceIntegrationTest {

    @Autowired
    private UserManagementService userManagementService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private VisitRequestRepository visitRequestRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setupData() {
        visitRequestRepository.deleteAll();
        userRepository.deleteAll();

        Role doctorRole = getOrCreateRole("Doctor", "Doctor role");
        Role patientRole = getOrCreateRole("Patient", "Patient role");

        userRepository.save(User.builder()
                .egn("3000000000")
                .firstName("Doc")
                .lastName("User")
                .address("Sofia")
                .telephone("+359000000001")
                .email("doc@enterprise.com")
                .passwordHash(passwordEncoder.encode("StrongPass1"))
                .status("ACTIVE")
                .roles(Set.of(doctorRole))
                .build());

        userRepository.save(User.builder()
                .egn("3000000001")
                .firstName("Patient")
                .lastName("User")
                .address("Sofia")
                .telephone("+359000000002")
                .email("patient@enterprise.com")
                .passwordHash(passwordEncoder.encode("StrongPass1"))
                .status("ACTIVE")
                .roles(Set.of(patientRole))
                .build());
    }

    @Test
    void updateDoctorDescriptionByEmail_shouldPersistDescriptionForDoctor() {
        userManagementService.updateDoctorDescriptionByEmail(
                "doc@enterprise.com",
                "Cardiologist with 12 years of hospital practice"
        );

        User reloaded = userRepository.findByEmail("doc@enterprise.com").orElseThrow();
        assertEquals("Cardiologist with 12 years of hospital practice", reloaded.getDescription());
    }

        @Test
        void getUserProfile_shouldHideDescriptionForPatient() {
        User patient = userRepository.findByEmail("patient@enterprise.com").orElseThrow();
        patient.setDescription("This should never be exposed for patient");
        userRepository.save(patient);

        UserProfileResponse response = userManagementService.getUserProfile("patient@enterprise.com");

        assertEquals("3000000001", response.egn());
        assertEquals("Patient", response.firstName());
        assertEquals("User", response.lastName());
        assertEquals("Sofia", response.address());
        assertEquals("+359000000002", response.telephone());
        assertEquals("patient@enterprise.com", response.email());
        assertNull(response.description());
        assertEquals(false, response.doctor());
        }

        @Test
        void getUserProfile_shouldShowDescriptionForDoctor() {
        userManagementService.updateDoctorDescriptionByEmail("doc@enterprise.com", "Internal medicine specialist");

        UserProfileResponse response = userManagementService.getUserProfile("doc@enterprise.com");

        assertEquals("3000000000", response.egn());
        assertEquals("Doc", response.firstName());
        assertEquals("User", response.lastName());
        assertEquals("Sofia", response.address());
        assertEquals("+359000000001", response.telephone());
        assertEquals("doc@enterprise.com", response.email());
        assertEquals("Internal medicine specialist", response.description());
        assertTrue(response.doctor());
        }

        @Test
        void updateProfileByEmail_shouldUpdateCommonFieldsForPatientAndRejectDescription() {
        RuntimeException ex = assertThrows(RuntimeException.class, () ->
            userManagementService.updateProfileByEmail(
                "patient@enterprise.com",
                new UserProfileUpdateRequest(
                    "PatientUpdated",
                    "UserUpdated",
                    "Varna",
                    "+359000000099",
                    "patient-updated@enterprise.com",
                    "Not allowed"
                )
            )
        );

        assertEquals("Only users with Doctor role can update description", ex.getMessage());

        User reloaded = userRepository.findByEmail("patient@enterprise.com").orElseThrow();
        assertEquals("Patient", reloaded.getFirstName());
        }

        @Test
        void updateProfileByEmail_shouldUpdateAllAllowedFieldsForDoctorIncludingDescription() {
        userManagementService.updateProfileByEmail(
            "doc@enterprise.com",
            new UserProfileUpdateRequest(
                "DoctorUpdated",
                "UserUpdated",
                "Burgas",
                "+359000000088",
                "doc-updated@enterprise.com",
                "Updated doctor description"
            )
        );

        User reloaded = userRepository.findByEmail("doc-updated@enterprise.com").orElseThrow();
        assertEquals("DoctorUpdated", reloaded.getFirstName());
        assertEquals("UserUpdated", reloaded.getLastName());
        assertEquals("Burgas", reloaded.getAddress());
        assertEquals("+359000000088", reloaded.getTelephone());
        assertEquals("Updated doctor description", reloaded.getDescription());
        }

    @Test
    void updateDoctorDescriptionByEmail_shouldAllowNullForDoctor() {
        userManagementService.updateDoctorDescriptionByEmail("doc@enterprise.com", "Temporary text");
        userManagementService.updateDoctorDescriptionByEmail("doc@enterprise.com", null);

        User reloaded = userRepository.findByEmail("doc@enterprise.com").orElseThrow();
        assertNull(reloaded.getDescription());
    }

    @Test
    void updateDoctorDescriptionByEmail_shouldRejectNonDoctorUsers() {
        RuntimeException ex = assertThrows(
                RuntimeException.class,
                () -> userManagementService.updateDoctorDescriptionByEmail("patient@enterprise.com", "Should fail")
        );

        assertEquals("Only users with Doctor role can update description", ex.getMessage());
    }

    private Role getOrCreateRole(String name, String description) {
        return roleRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name(name)
                        .description(description)
                        .build()));
    }
}
