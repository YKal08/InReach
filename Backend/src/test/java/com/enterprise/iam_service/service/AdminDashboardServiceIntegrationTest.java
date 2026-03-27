package com.enterprise.iam_service.service;

import com.enterprise.iam_service.dto.AssignUserRoleRequest;
import com.enterprise.iam_service.dto.UserRoleUpdateResponse;
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
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
class AdminDashboardServiceIntegrationTest {

    @Autowired
    private AdminDashboardService adminDashboardService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VisitRequestRepository visitRequestRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final String EGN = "2222222222";

    @BeforeEach
    void setupData() {
        visitRequestRepository.deleteAll();
        userRepository.deleteAll();

        Role patientRole = getOrCreateRole("Patient", "Patient role");
        getOrCreateRole("Doctor", "Doctor role");
        getOrCreateRole("Driver", "Driver role");

        User user = User.builder()
                .egn(EGN)
                .firstName("Role")
                .lastName("Tester")
                .address("Sofia")
                .telephone("+359888000111")
                .email("role.tester@enterprise.com")
                .passwordHash(passwordEncoder.encode("StrongPass1"))
                .status("ACTIVE")
                .roles(Set.of(patientRole))
                .build();

        userRepository.save(user);
    }

    @Test
    void assignUserRole_shouldReplaceRolesAndPersistInDatabase() {
        UserRoleUpdateResponse response = adminDashboardService.assignUserRole(
                EGN,
                new AssignUserRoleRequest("Doctor")
        );

        assertEquals("Role assigned successfully", response.message());
        assertEquals(1, response.roles().size());
        assertEquals("Doctor", response.roles().get(0));

        User reloaded = userRepository.findById(EGN).orElseThrow();
        Set<String> roleNames = reloaded.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
        assertEquals(Set.of("Doctor"), roleNames);
    }

    @Test
    void addUserRole_shouldAppendRoleAndPersistInDatabase() {
        UserRoleUpdateResponse response = adminDashboardService.addUserRole(
                EGN,
                new AssignUserRoleRequest("Driver")
        );

        assertEquals("Role added successfully", response.message());
        assertTrue(response.roles().contains("Patient"));
        assertTrue(response.roles().contains("Driver"));

        User reloaded = userRepository.findById(EGN).orElseThrow();
        Set<String> roleNames = reloaded.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
        assertEquals(Set.of("Patient", "Driver"), roleNames);
    }

    @Test
    void removeUserRole_shouldRemoveRoleAndPersistInDatabase() {
        adminDashboardService.addUserRole(EGN, new AssignUserRoleRequest("Doctor"));

        User userWithDoctorRole = userRepository.findById(EGN).orElseThrow();
        userWithDoctorRole.setDescription("Board-certified specialist");
        userRepository.save(userWithDoctorRole);

        UserRoleUpdateResponse response = adminDashboardService.removeUserRole(
                EGN,
                new AssignUserRoleRequest("Doctor")
        );

        assertEquals("Role removed successfully", response.message());
        assertEquals(1, response.roles().size());
        assertEquals("Patient", response.roles().get(0));

        User reloaded = userRepository.findById(EGN).orElseThrow();
        Set<String> roleNames = reloaded.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
        assertEquals(Set.of("Patient"), roleNames);
        assertNull(reloaded.getDescription());
    }

    private Role getOrCreateRole(String name, String description) {
        return roleRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name(name)
                        .description(description)
                        .build()));
    }
}
