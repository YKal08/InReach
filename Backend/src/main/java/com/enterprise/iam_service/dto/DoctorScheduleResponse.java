package com.enterprise.iam_service.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

public record DoctorScheduleResponse(
    UUID id,
    String doctorEgn,
    String doctorFullName,
    Integer dayOfWeek,
    LocalDate specificDate,
    LocalTime workStart,
    LocalTime workEnd,
    Integer maxRequests,
    Boolean acceptingRequests,
    Boolean active,
    String notes,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}