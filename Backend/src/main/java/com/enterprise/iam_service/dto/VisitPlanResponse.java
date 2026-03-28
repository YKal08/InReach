package com.enterprise.iam_service.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record VisitPlanResponse(
        UUID planId,
        String doctorEgn,
        String doctorName,
        LocalDate targetDate,
        String status,
        LocalDateTime createdAt,
        List<VisitStopResponse> visits
) {}
