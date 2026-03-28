package com.enterprise.iam_service.dto;

import java.util.UUID;

public record RouteStopResponse(
        Long id,
        UUID visitRequestId,
        Integer stopOrder,
        String patientEgn,
        String patientName,
        String address,
        String status
) {}
