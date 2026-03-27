package com.enterprise.iam_service.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CancelVisitRequestRequest(
        @NotNull(message = "requestId is required")
        UUID requestId
) {
}
