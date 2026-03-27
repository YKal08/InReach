package com.enterprise.iam_service.controller;

import com.enterprise.iam_service.dto.DoctorDescriptionUpdateRequest;
import com.enterprise.iam_service.dto.PasswordChangeRequest;
import com.enterprise.iam_service.dto.UserProfileResponse;
import com.enterprise.iam_service.dto.UserProfileUpdateRequest;
import com.enterprise.iam_service.service.UserManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

// ? @RestController indicates that this class handles HTTP requests and returns data directly in the response body.
// ? @RequestMapping("/api/users") ensures all endpoints in this class are prefixed with /api/users.
// ? @RequiredArgsConstructor automates the injection of the UserManagementService via the constructor.
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserManagementService userManagementService;

    // * Endpoint: Retrieves the profile of the currently logged-in user.
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getMyProfile() {
        // ! SECURITY: Extracts the unique identifier (email) directly from the SecurityContext.
        // ! This ensures the user can only access their own data, not other users' profiles.
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        
        // * Returns a specialized DTO to ensure sensitive internal fields are not exposed to the client.
        return ResponseEntity.ok(userManagementService.getUserProfile(email));
    }

    @PatchMapping("/me")
    public ResponseEntity<String> updateMyProfile(@RequestBody @Valid UserProfileUpdateRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        userManagementService.updateProfileByEmail(email, request);
        return ResponseEntity.ok("Profile updated successfully");
    }

    // * Endpoint: Allows users to rotate their credentials while logged in.
    @PostMapping("/change-password")
    public ResponseEntity<String> changePassword(@RequestBody PasswordChangeRequest request) {
        // ! SECURITY: Identity is verified via the JWT token stored in the SecurityContext.
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        
        // ! Calls service logic to validate the old password before applying the new one.
        userManagementService.changePasswordByEmail(email, request.oldPassword(), request.newPassword());
        
        return ResponseEntity.ok("Password updated successfully");
    }

    @PatchMapping("/me/description")
    public ResponseEntity<String> updateDoctorDescription(@RequestBody @Valid DoctorDescriptionUpdateRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        userManagementService.updateDoctorDescriptionByEmail(email, request.description());
        return ResponseEntity.ok("Description updated successfully");
    }

}