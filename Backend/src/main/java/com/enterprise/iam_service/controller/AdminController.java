package com.enterprise.iam_service.controller;

import com.enterprise.iam_service.dto.AssignUserRoleRequest;
import com.enterprise.iam_service.dto.RoleResponse;
import com.enterprise.iam_service.dto.RoleRequest;
import com.enterprise.iam_service.dto.UserRoleUpdateResponse;
import com.enterprise.iam_service.model.User;
import com.enterprise.iam_service.service.AdminDashboardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
// import java.util.UUID;

// ? @RestController marks this class as a request handler for RESTful web services.
// ? @RequestMapping("/api/admin") sets the base path for all endpoints in this controller.
// ? @RequiredArgsConstructor (Lombok) generates a constructor for the final service field.
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminDashboardService adminDashboardService;

    // GET all users
    @GetMapping("/users")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(adminDashboardService.getAllUsers());
    }

    // GET all locked accounts
    @GetMapping("/users/locked")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<?> getLockedUsers() {
        return ResponseEntity.ok(adminDashboardService.getLockedUsers());
    }

    // GET all pending accounts (new registrations awaiting approval)
    @GetMapping("/users/pending")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<?> getPendingUsers() {
        return ResponseEntity.ok(adminDashboardService.getPendingUsers());
    }

    // POST activate a PENDING or LOCKED account → sets status to ACTIVE
    // ! This is the primary action for approving new user registrations.
    @PostMapping("/users/{id}/activate")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<String> activateUser(@PathVariable String id) {
        return ResponseEntity.ok(adminDashboardService.activateUser(id));
    }

    // POST lock an account manually
    @PostMapping("/users/{id}/lock")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<String> lockUser(@PathVariable String id) {
        return ResponseEntity.ok(adminDashboardService.lockUser(id));
    }

    // DELETE a user account
    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<String> deleteUser(@PathVariable String id) {
        adminDashboardService.deleteUser(id);
        return ResponseEntity.ok("User deleted.");
    }

    @PutMapping("/users/{id}/role")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<UserRoleUpdateResponse> setUserRole(@PathVariable String id, @Valid @RequestBody AssignUserRoleRequest request) {
        return ResponseEntity.ok(adminDashboardService.assignUserRole(id, request));
    }

    @PostMapping("/users/{id}/role")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<UserRoleUpdateResponse> addUserRole(@PathVariable String id, @Valid @RequestBody AssignUserRoleRequest request) {
        return ResponseEntity.ok(adminDashboardService.addUserRole(id, request));
    }

    @DeleteMapping("/users/{id}/role")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<UserRoleUpdateResponse> removeUserRole(@PathVariable String id, @Valid @RequestBody AssignUserRoleRequest request) {
        return ResponseEntity.ok(adminDashboardService.removeUserRole(id, request));
    }

    @GetMapping("/roles")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<List<RoleResponse>> getAllRolesWithoutAdmin() {
        return ResponseEntity.ok(adminDashboardService.getAllNonAdminRoles());
    }

    @PostMapping("/roles")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<RoleResponse> createRole(@Valid @RequestBody RoleRequest request) {
        return ResponseEntity.ok(adminDashboardService.createRole(request));
    }
}