package com.enterprise.iam_service.service;

import com.enterprise.iam_service.dto.DoctorResponse;
import com.enterprise.iam_service.dto.UserProfileUpdateRequest;
import com.enterprise.iam_service.model.User;
import com.enterprise.iam_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.enterprise.iam_service.dto.UserProfileResponse;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

// ? @Service: Defines this class as a service layer component responsible for user-specific business operations.
// ? @RequiredArgsConstructor: Injects final dependencies (UserRepository, PasswordEncoder, AuthService) via the constructor.
@Service
@RequiredArgsConstructor
public class UserManagementService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;
    private final GoogleGeocodingService googleGeocodingService;

    private static final String DOCTOR_ROLE = "Doctor";
    private static final double MAX_NEARBY_DISTANCE_KM = 100.0;

    private boolean isDoctor(User user) {
        return user.getRoles().stream()
                .anyMatch(role -> DOCTOR_ROLE.equalsIgnoreCase(role.getName()));
    }

    private static double calculateDistanceKm(double lat1, double lng1, double lat2, double lng2) {
        final double earthRadiusKm = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusKm * c;
    }

    public List<DoctorResponse> getNearbyDoctors(String email) {
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (currentUser.getLat() == null || currentUser.getLng() == null) {
            throw new RuntimeException("Current location is unavailable. Update your address first.");
        }

        double userLat = currentUser.getLat();
        double userLng = currentUser.getLng();

        return userRepository.findAll().stream()
                .filter(this::isDoctor)
                .filter(doctor -> doctor.getLat() != null && doctor.getLng() != null)
                .filter(doctor -> !doctor.getEgn().equals(currentUser.getEgn()))
                .map(doctor -> new DoctorResponse(
                        doctor.getEgn(),
                        doctor.getFirstName(),
                        doctor.getLastName(),
                        doctor.getRawAddress(),
                        doctor.getTelephone(),
                        doctor.getDescription(),
                        calculateDistanceKm(userLat, userLng, doctor.getLat(), doctor.getLng())
                ))
                .filter(response -> response.distanceKm() <= MAX_NEARBY_DISTANCE_KM)
                .sorted(Comparator.comparingDouble(DoctorResponse::distanceKm))
                .collect(Collectors.toList());
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
            user.getRawAddress(),
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
            googleGeocodingService.geocodeAndApplyToUser(user, request.address());
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