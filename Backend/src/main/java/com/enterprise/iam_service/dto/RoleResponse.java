package com.enterprise.iam_service.dto;

public record RoleResponse(
        Long id,
        String name,
        String description
) {
}
