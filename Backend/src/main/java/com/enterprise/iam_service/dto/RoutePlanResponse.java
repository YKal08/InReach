package com.enterprise.iam_service.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record RoutePlanResponse(
        UUID routeId,
        String doctorEgn,
        String doctorName,
        LocalDate date,
        String status,
        LocalDateTime createdAt,
        List<RouteStopResponse> stops
) {}
