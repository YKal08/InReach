package com.enterprise.iam_service.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank(message = "EGN is required")
    String egn,

    @NotBlank(message = "First name is required")
    String firstName,

    @NotBlank(message = "Last name is required")
    String lastName,

    @NotBlank(message = "Address is required")
    String address,

    @NotBlank(message = "Telephone is required")
    String telephone,

    @Email(message = "Invalid email format")
    @NotBlank(message = "Email is required")
    String email,

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    String password
) {}