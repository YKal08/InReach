package com.enterprise.iam_service.service;

import com.enterprise.iam_service.model.User;
import com.enterprise.iam_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.enterprise.iam_service.dto.UserProfileResponse;
import java.util.Set;

// ? @Service: Defines this class as a service layer component responsible for user-specific business operations.
// ? @RequiredArgsConstructor: Injects final dependencies (UserRepository, PasswordEncoder, AuthService) via the constructor.
@Service
@RequiredArgsConstructor
public class UserManagementService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

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

        // * Step 2: Transform Role entities into a simple Set of Strings.
        // ? This simplifies the JSON response for the frontend and hides internal DB IDs.
        Set<String> roles = user.getRoles().stream()
                .map(role -> role.getName())
                .collect(java.util.stream.Collectors.toSet());

        // * Step 3: Return a clean Profile DTO (excludes sensitive fields like passwordHash).
        return new UserProfileResponse(
            user.getEmail(),
            user.getStatus(),
            roles,
            user.getCreatedAt()
        );
    }
}