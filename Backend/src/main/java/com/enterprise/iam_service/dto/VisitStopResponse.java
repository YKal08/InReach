package com.enterprise.iam_service.dto;

import java.util.UUID;

public record VisitStopResponse(
        Long id,
        UUID visitRequestId,
        Integer stopOrder,
        String patientEgn,
        String patientName,
        String patientAddress,
        Double latitude,
        Double longitude,
        String arrivalTime24h,
        String arrivalWindowStart24h,
        String arrivalWindowEnd24h,
        Integer travelMinutesFromPrevious,
        Integer timeToNextStopMinutes,
        String status
) {}
