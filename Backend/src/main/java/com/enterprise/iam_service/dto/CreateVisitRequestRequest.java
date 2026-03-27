package com.enterprise.iam_service.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateVisitRequestRequest(
        @NotBlank(message = "Address is required")
        String address,

        @NotBlank(message = "Doctor type is required")
        String doctorType,

        String notes
) {
}
