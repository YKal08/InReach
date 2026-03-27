package com.enterprise.iam_service.dto;

import jakarta.validation.constraints.Size;

public record DoctorDescriptionUpdateRequest(
    @Size(max = 3000, message = "Description must be at most 3000 characters")
    String description
) {}
