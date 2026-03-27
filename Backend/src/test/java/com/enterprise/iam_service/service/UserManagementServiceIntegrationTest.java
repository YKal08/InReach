package com.enterprise.iam_service.service;

import com.enterprise.iam_service.dto.DoctorResponse;
import com.enterprise.iam_service.dto.UserProfileResponse;
import com.enterprise.iam_service.dto.UserProfileUpdateRequest;
import com.enterprise.iam_service.model.Role;
import com.enterprise.iam_service.model.User;
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
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;

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
    private DoctorScheduleRepository doctorScheduleRepository;

    @Autowired
    private DriverScheduleRepository driverScheduleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private com.enterprise.iam_service.service.GoogleGeocodingService googleGeocodingService;

    @BeforeEach
    void setupData() {
        doAnswer(invocation -> {
            User user = invocation.getArgument(0);
            String address = invocation.getArgument(1);
            if (address != null) {
                user.setRawAddress(address);
            }
            if (user.getLat() == null || user.getLng() == null) {
                user.setLat(42.0);
                user.setLng(23.0);
            }
            return null;
        }).when(googleGeocodingService).geocodeAndApplyToUser(any(User.class), anyString());

        visitRequestRepository.deleteAll();
        doctorScheduleRepository.deleteAll();
        driverScheduleRepository.deleteAll();
        userRepository.deleteAll();

        Role doctorRole = getOrCreateRole("Doctor", "Doctor role");
        Role patientRole = getOrCreateRole("Patient", "Patient role");

        userRepository.save(User.builder()
                .egn("3000000000")
                .firstName("Doc")
                .lastName("User")
            .rawAddress("Sofia")
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
            .rawAddress("Sofia")
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
        assertEquals("Burgas", reloaded.getRawAddress());
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

    @Test
    void getNearbyDoctors_shouldReturnOnlyDoctorsWithin100Km() {
        User patient = userRepository.findByEmail("patient@enterprise.com").orElseThrow();
        patient.setLat(42.6977);
        patient.setLng(23.3219);
        userRepository.save(patient);

        Role doctorRole = getOrCreateRole("Doctor", "Doctor role");

        userRepository.save(User.builder()
                .egn("3000000002")
                .firstName("Near")
                .lastName("Doctor")
                .rawAddress("Sofia")
                .telephone("+359888000003")
                .email("near-doc@enterprise.com")
                .passwordHash(passwordEncoder.encode("StrongPass1"))
                .status("ACTIVE")
                .lat(42.6977)
                .lng(23.3219)
                .roles(Set.of(doctorRole))
                .build());

        userRepository.save(User.builder()
                .egn("3000000003")
                .firstName("Far")
                .lastName("Doctor")
                .rawAddress("Varna")
                .telephone("+359888000004")
                .email("far-doc@enterprise.com")
                .passwordHash(passwordEncoder.encode("StrongPass1"))
                .status("ACTIVE")
                .lat(43.2141)
                .lng(27.9147)
                .roles(Set.of(doctorRole))
                .build());

        List<DoctorResponse> nearbyDoctors = userManagementService.getNearbyDoctors("patient@enterprise.com");

        assertEquals(1, nearbyDoctors.size());
        assertEquals("3000000002", nearbyDoctors.get(0).egn());
        assertEquals("Near", nearbyDoctors.get(0).firstName());
    }

    private Role getOrCreateRole(String name, String description) {
        return roleRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name(name)
                        .description(description)
                        .build()));
    }
}
