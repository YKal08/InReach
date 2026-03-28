package com.enterprise.iam_service.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record DoctorVisitRequestResponse(
        UUID id,
        String patientEgn,
        String patientName,
        String patientAddress,
        Double latitude,
        Double longitude,
        String status,
        String notes,
        LocalDateTime createdAt
) {}
