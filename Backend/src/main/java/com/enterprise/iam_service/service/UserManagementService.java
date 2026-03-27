package com.enterprise.iam_service.service;

import com.enterprise.iam_service.dto.UserProfileUpdateRequest;
import com.enterprise.iam_service.model.User;
import com.enterprise.iam_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.enterprise.iam_service.dto.UserProfileResponse;

// ? @Service: Defines this class as a service layer component responsible for user-specific business operations.
// ? @RequiredArgsConstructor: Injects final dependencies (UserRepository, PasswordEncoder, AuthService) via the constructor.
@Service
@RequiredArgsConstructor
public class UserManagementService {

    private static final String DOCTOR_ROLE = "DOCTOR";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    private boolean isDoctor(User user) {
        return user.getRoles().stream()
                .anyMatch(role -> DOCTOR_ROLE.equalsIgnoreCase(role.getName()));
    }

    // * Business Logic: Handles the secure rotation of user credentials.
    public void changePasswordByEmail(String email, String oldPassword, String newPassword) {
        // * Step 1: Retrieve the user entity from the database based on the authenticated email.
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // ! SECURITY: Verify the 'oldPassword' matches the current hash before allowing a change.
        // ! This prevents unauthorized password changes if a session is hijacked.
        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new RuntimeException("Existing password does not match");
        }

        // ! SECURITY: Re-validate the new password against the organization's strength requirements.
        // ? This ensures the new password meets length and complexity (8+ chars, Case, Digit).
        authService.validatePasswordStrength(newPassword);

        // * Step 2: Securely hash the new password and update the persistent state.
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    // * Business Logic: Maps internal User entity data to a secure DTO for profile viewing.
    public UserProfileResponse getUserProfile(String email) {
        // * Step 1: Fetch user data from the database.
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean doctor = isDoctor(user);

        // * Step 3: Return a clean Profile DTO (excludes sensitive fields like passwordHash).
        return new UserProfileResponse(
            user.getEgn(),
            user.getFirstName(),
            user.getLastName(),
            user.getAddress(),
            user.getTelephone(),
            user.getEmail(),
            doctor ? user.getDescription() : null,
            doctor
        );
    }

    public void updateProfileByEmail(String email, UserProfileUpdateRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.firstName() != null) {
            user.setFirstName(request.firstName());
        }
        if (request.lastName() != null) {
            user.setLastName(request.lastName());
        }
        if (request.address() != null) {
            user.setAddress(request.address());
        }
        if (request.telephone() != null) {
            user.setTelephone(request.telephone());
        }
        if (request.email() != null && !request.email().equalsIgnoreCase(user.getEmail())) {
            if (userRepository.existsByEmail(request.email())) {
                throw new RuntimeException("Email already in use");
            }
            user.setEmail(request.email());
        }

        if (request.description() != null) {
            if (!isDoctor(user)) {
                throw new RuntimeException("Only users with Doctor role can update description");
            }
            user.setDescription(request.description());
        }

        userRepository.save(user);
    }

    public void updateDoctorDescriptionByEmail(String email, String description) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!isDoctor(user)) {
            throw new RuntimeException("Only users with Doctor role can update description");
        }

        user.setDescription(description);
        userRepository.save(user);
    }
}