package com.enterprise.iam_service.service;

import com.enterprise.iam_service.dto.AuthResponse;
import com.enterprise.iam_service.dto.LoginRequest;
import com.enterprise.iam_service.dto.RegisterRequest;
import com.enterprise.iam_service.model.Role;
import com.enterprise.iam_service.model.User;
import com.enterprise.iam_service.repository.RoleRepository;
import com.enterprise.iam_service.repository.UserRepository;
import com.enterprise.iam_service.security.JwtUtils;

import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

// ? @Service: Marks this as a service-layer bean where business logic and transaction management reside.
// ? @RequiredArgsConstructor: Injects all 'final' fields (repositories/security utils) via the constructor.
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final SecurityService securityService;
    private final GoogleGeocodingService googleGeocodingService;

    // * Business Logic: Handles the end-to-end registration flow for new users.
    public AuthResponse register(RegisterRequest request) {
        // * Step 1: Pre-persistence check to ensure the email is unique.
        if (userRepository.existsByEmail(request.email())) {
            throw new RuntimeException("Email already in use");
        }

        // ! SECURITY: Enforces the organization's password complexity rules before proceeding.
        validatePasswordStrength(request.password());

        Role patientRole = roleRepository.findByName("Patient")
            .orElseThrow(() -> new RuntimeException("Patient role is not configured"));

        // * Step 2: Assemble the User object. 
        // ! SECURITY: The password is encrypted using BCrypt immediately via passwordEncoder.encode().
        var user = User.builder()
            .egn(request.egn())
            .firstName(request.firstName())
            .lastName(request.lastName())
            .rawAddress(request.address())
            .telephone(request.telephone())
            .email(request.email())
            .passwordHash(passwordEncoder.encode(request.password()))
            // ! CHANGED: New accounts are PENDING by default — admin must activate them. Change this based on needs.
            .status("ACTIVE") //
            .roles(Set.of(patientRole))
            .build();

        googleGeocodingService.geocodeAndApplyToUser(user, request.address());

        // * Step 3: Persistence and Token Issuance.
        userRepository.save(user);

        // ! NOTE: We do NOT return a token on register anymore.
        // ! The account must be activated by an admin before the user can log in.
        // ! Returning an empty/null token — the frontend should NOT redirect on register.
        String token = jwtUtils.generateToken(user.getEmail());
        return new AuthResponse(token);
    }

    // * Business Logic: Handles credential verification and session initiation.
    public AuthResponse authenticate(LoginRequest request) {
        // * Step 1: Look up the identity in the database.
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        // ! Block LOCKED accounts (brute-force protection)
        if ("LOCKED".equals(user.getStatus())) {
            throw new RuntimeException("Account is locked due to multiple failed attempts. Contact an administrator.");
        }

        // ! Block PENDING accounts — they need admin activation
        if ("PENDING".equals(user.getStatus())) {
            throw new RuntimeException("Account is pending admin approval. Please wait for activation.");
        }

        if (passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            // * SUCCESS: Clean up state and update audit metadata.
            user.setFailedLoginAttempts(0);
            user.setLastLoginAt(LocalDateTime.now());
            userRepository.save(user);

            // * Issue the session token.
            String token = jwtUtils.generateToken(user.getEmail());
            return new AuthResponse(token);
        } else {
            // ! FAILURE: Trigger the security increment logic to eventually lock the account.
            securityService.handleFailedLogin(user);
            throw new RuntimeException("Invalid credentials");
        }
    }

    // ! SECURITY: Regex-based validation for identity assurance.
    public void validatePasswordStrength(String password) {
    // ? Regex breakdown: 8+ characters, contains digits, lowercase, and uppercase letters.
        String regex = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=\\S+$).{8,}$";
    
        if (password == null || !password.matches(regex)) {
            throw new RuntimeException("Password too weak! Must be at least 8 characters and include uppercase, lowercase, and a number.");
        }
    }
}