package com.enterprise.iam_service.service;

import com.enterprise.iam_service.dto.AuthResponse;
import com.enterprise.iam_service.dto.RegisterRequest;
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

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
class AuthServiceIntegrationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private VisitRequestRepository visitRequestRepository;

    @BeforeEach
    void cleanUsers() {
        visitRequestRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void register_shouldPersistUserWithHashedPasswordAndPatientRole() {
        if (roleRepository.findByName("Patient").isEmpty()) {
            roleRepository.save(Role.builder()
                    .name("Patient")
                    .description("Patient role")
                    .build());
        }

        RegisterRequest request = new RegisterRequest(
                "1234567890",
                "Jane",
                "Doe",
                "Sofia",
                "+359888111111",
                "jane@doe.com",
                "StrongPass1"
        );

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertNotNull(response.accessToken());
        assertFalse(response.accessToken().isBlank());

        User saved = userRepository.findByEmail("jane@doe.com").orElseThrow();
        assertNotEquals("StrongPass1", saved.getPasswordHash());
        assertTrue(passwordEncoder.matches("StrongPass1", saved.getPasswordHash()));
        assertTrue(saved.getRoles().stream().anyMatch(role -> role.getName().equals("Patient")));
    }

    @Test
    void register_shouldFailWhenEmailAlreadyExists() {
        Role patientRole = roleRepository.findByName("Patient")
                .orElseGet(() -> roleRepository.save(Role.builder().name("Patient").description("Patient role").build()));

        userRepository.save(User.builder()
                .egn("9876543210")
                .firstName("Existing")
                .lastName("User")
            .rawAddress("Sofia")
                .telephone("+359888222222")
                .email("existing@doe.com")
                .passwordHash(passwordEncoder.encode("StrongPass1"))
                .status("ACTIVE")
                .roles(java.util.Set.of(patientRole))
                .build());

        RegisterRequest request = new RegisterRequest(
                "1111111111",
                "John",
                "Smith",
                "Plovdiv",
                "+359888333333",
                "existing@doe.com",
                "StrongPass1"
        );

        RuntimeException ex = assertThrows(RuntimeException.class, () -> authService.register(request));
        assertTrue(ex.getMessage().contains("Email already in use"));
    }
}
