package com.enterprise.iam_service.service;

import com.enterprise.iam_service.dto.AssignUserRoleRequest;
import com.enterprise.iam_service.dto.RoleResponse;
import com.enterprise.iam_service.dto.RoleRequest;
import com.enterprise.iam_service.dto.UserRoleUpdateResponse;
import com.enterprise.iam_service.model.Role;
import com.enterprise.iam_service.model.User;
import com.enterprise.iam_service.repository.RoleRepository;
import com.enterprise.iam_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

// ? @Service: Marks this class as a business logic component responsible for admin dashboard operations.
// ? @RequiredArgsConstructor: Injects UserRepository and RoleRepository via constructor.
@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private static final String ADMIN_ROLE_NAME = "ADMIN";
    private static final String DOCTOR_ROLE_NAME = "DOCTOR";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    // ========================== User Management ==========================

    // * Business Logic: Retrieve all users in the system.
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // * Business Logic: Retrieve all users with LOCKED status.
    public List<User> getLockedUsers() {
        return userRepository.findAllByStatus("LOCKED");
    }

    // * Business Logic: Retrieve all users with PENDING status (awaiting admin approval).
    public List<User> getPendingUsers() {
        return userRepository.findAllByStatus("PENDING");
    }

    // * Business Logic: Activate a user account (PENDING or LOCKED → ACTIVE).
    public String activateUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setStatus("ACTIVE");
        user.setFailedLoginAttempts(0);
        userRepository.save(user);

        return "User activated: " + user.getEmail();
    }

    // * Business Logic: Lock a user account manually.
    public String lockUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setStatus("LOCKED");
        userRepository.save(user);

        return "User locked: " + user.getEmail();
    }

    // * Business Logic: Delete a user account from the system.
    public void deleteUser(String userId) {
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found");
        }
        userRepository.deleteById(userId);
    }

    // ========================== Role Management ==========================

    // * Business Logic: Assign a non-admin role to a user (replaces existing roles).
    // ! SECURITY: Prevents unauthorized elevation to Admin role.
    public UserRoleUpdateResponse assignUserRole(String userId, AssignUserRoleRequest request) {
        String requestedRoleName = request.roleName().trim();

        // ! SECURITY: Block Admin role assignment via this endpoint.
        if (isAdminRole(requestedRoleName)) {
            throw new RuntimeException("Assigning Admin role from this endpoint is not allowed.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Role role = roleRepository.findByNameIgnoreCase(requestedRoleName)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        // ! SECURITY: Double-check the role lookup to ensure we're not assigning Admin.
        if (isAdminRole(role.getName())) {
            throw new RuntimeException("Assigning Admin role from this endpoint is not allowed.");
        }

        user.setRoles(new HashSet<>(List.of(role)));
        if (!isDoctorRole(role.getName())) {
            user.setDescription(null);
        }
        userRepository.save(user);

        return new UserRoleUpdateResponse(
            "Role assigned successfully",
            user.getEgn(),
            user.getRoles().stream().map(Role::getName).collect(Collectors.toList())
        );
    }

    // * Business Logic: Add a non-admin role to a user (keeps existing roles).
    // ! SECURITY: Prevents unauthorized elevation to Admin role.
    public UserRoleUpdateResponse addUserRole(String userId, AssignUserRoleRequest request) {
        String requestedRoleName = request.roleName().trim();

        // ! SECURITY: Block Admin role assignment via this endpoint.
        if (isAdminRole(requestedRoleName)) {
            throw new RuntimeException("Adding Admin role from this endpoint is not allowed.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Role role = roleRepository.findByNameIgnoreCase(requestedRoleName)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        // ! SECURITY: Double-check the role lookup to ensure we're not assigning Admin.
        if (isAdminRole(role.getName())) {
            throw new RuntimeException("Adding Admin role from this endpoint is not allowed.");
        }

        // * Check if user already has this role to prevent duplicates.
        if (user.getRoles().stream().anyMatch(r -> r.getName().equalsIgnoreCase(requestedRoleName))) {
            throw new RuntimeException("User already has this role");
        }

        user.getRoles().add(role);
        userRepository.save(user);

        return new UserRoleUpdateResponse(
            "Role added successfully",
            user.getEgn(),
            user.getRoles().stream().map(Role::getName).collect(Collectors.toList())
        );
    }

    // * Business Logic: Remove a non-admin role from a user (keeps remaining roles).
    // ! SECURITY: Prevents modifying Admin role via this endpoint.
    public UserRoleUpdateResponse removeUserRole(String userId, AssignUserRoleRequest request) {
        String requestedRoleName = request.roleName().trim();

        // ! SECURITY: Block Admin role removal via this endpoint.
        if (isAdminRole(requestedRoleName)) {
            throw new RuntimeException("Removing Admin role from this endpoint is not allowed.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Role role = roleRepository.findByNameIgnoreCase(requestedRoleName)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        // ! SECURITY: Double-check resolved role.
        if (isAdminRole(role.getName())) {
            throw new RuntimeException("Removing Admin role from this endpoint is not allowed.");
        }

        boolean removed = user.getRoles().removeIf(r -> r.getName().equalsIgnoreCase(role.getName()));
        if (!removed) {
            throw new RuntimeException("User does not have this role");
        }

        if (isDoctorRole(role.getName())) {
            user.setDescription(null);
        }

        userRepository.save(user);

        return new UserRoleUpdateResponse(
                "Role removed successfully",
                user.getEgn(),
                user.getRoles().stream().map(Role::getName).collect(Collectors.toList())
        );
    }

    // * Business Logic: Retrieve all non-admin roles for the admin dashboard.
    public List<RoleResponse> getAllNonAdminRoles() {
        return roleRepository.findAll().stream()
                .filter(role -> !isAdminRole(role.getName()))
                .map(this::toRoleResponse)
                .collect(Collectors.toList());
    }

    // * Business Logic: Create a new role (non-admin only).
    // ! SECURITY: Prevents creation of Admin role via this endpoint.
    public RoleResponse createRole(RoleRequest request) {
        String roleName = request.name().trim();
        String roleDescription = request.description().trim();

        // ! SECURITY: Block Admin role creation via this endpoint.
        if (isAdminRole(roleName)) {
            throw new RuntimeException("Creating Admin role from this endpoint is not allowed.");
        }

        // * Validation: Ensure role name is unique (case-insensitive).
        if (roleRepository.existsByNameIgnoreCase(roleName)) {
            throw new RuntimeException("Role already exists");
        }

        Role role = Role.builder()
                .name(roleName)
                .description(roleDescription)
                .build();

        return toRoleResponse(roleRepository.save(role));
    }

    private RoleResponse toRoleResponse(Role role) {
        return new RoleResponse(role.getId(), role.getName(), role.getDescription());
    }

    // ========================== Helper Methods ==========================

    // * Utility: Case-insensitive check for Admin role names to prevent privilege escalation.
    private boolean isAdminRole(String roleName) {
        return ADMIN_ROLE_NAME.equals(roleName.trim().toUpperCase(Locale.ROOT));
    }

    private boolean isDoctorRole(String roleName) {
        return DOCTOR_ROLE_NAME.equals(roleName.trim().toUpperCase(Locale.ROOT));
    }
}
