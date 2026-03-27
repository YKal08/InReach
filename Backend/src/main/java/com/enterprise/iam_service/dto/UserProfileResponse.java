package com.enterprise.iam_service.dto;

import java.time.LocalDateTime;
import java.util.Set;


public record UserProfileResponse(
    String email, 
    String status,
    Set<String> roles,
    LocalDateTime createdAt
) {}