package com.enterprise.iam_service.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record UserProfileUpdateRequest(
    @Size(max = 255, message = "First name must be at most 255 characters")
    String firstName,

    @Size(max = 255, message = "Last name must be at most 255 characters")
    String lastName,

    @Size(max = 255, message = "Address must be at most 255 characters")
    String address,

    @Size(max = 50, message = "Telephone must be at most 50 characters")
    String telephone,

    @Email(message = "Invalid email format")
    @Size(max = 255, message = "Email must be at most 255 characters")
    String email,

    @Size(max = 3000, message = "Description must be at most 3000 characters")
    String description
) {}
