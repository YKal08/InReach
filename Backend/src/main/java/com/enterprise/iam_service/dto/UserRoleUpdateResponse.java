package com.enterprise.iam_service.dto;

import java.util.List;

public record UserRoleUpdateResponse(
        String message,
        String userId,
        List<String> roles
) {
}
