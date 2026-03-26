package com.enterprise.iam_service.dto;

public record PasswordChangeRequest(
    String oldPassword, 
    String newPassword
) {}