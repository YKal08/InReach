package com.enterprise.iam_service.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

public record DriverScheduleResponse(
    UUID id,
    String pharmacistEgn,
    String pharmacistFullName,
    Integer dayOfWeek,
    LocalDate specificDate,
    LocalTime workStart,
    LocalTime workEnd,
    String deliveryZone,
    Integer maxDeliveries,
    Boolean acceptingDeliveries,
    Boolean active,
    String notes,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}