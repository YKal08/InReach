package com.enterprise.iam_service.dto;

import java.util.List;

public record AdminUserResponse(
        String egn,
        String firstName,
        String lastName,
        String email,
        String status,
        List<String> roles
) {
}
