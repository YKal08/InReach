package com.enterprise.iam_service.dto;

import jakarta.validation.constraints.NotBlank;

public record AssignUserRoleRequest(
    @NotBlank(message = "Role name is required")
    String roleName
) {}