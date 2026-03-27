package com.enterprise.iam_service.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record VisitRequestResponse(
        UUID id,
        String address,
        String doctorType,
        String doctorEgn,
        String status,
        String notes
) {
}
