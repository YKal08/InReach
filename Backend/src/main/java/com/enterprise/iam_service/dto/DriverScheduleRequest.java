package com.enterprise.iam_service.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record DriverScheduleRequest(

    // * The EGN of the driver/pharmacist this schedule belongs to.
    // ! Required for ADMIN — when a Driver calls create/update, the service ignores this
    // ! and uses the email from the SecurityContext instead.
    String pharmacistEgn,

    @NotNull(message = "Day of week is required")
    @Min(value = 1, message = "Day of week must be between 1 (Monday) and 7 (Sunday)")
    @Max(value = 7, message = "Day of week must be between 1 (Monday) and 7 (Sunday)")
    Integer dayOfWeek,

    // * Optional one-off date override — when set, takes priority over dayOfWeek for that date.
    LocalDate specificDate,

    // * Work hours — both must be provided together, or both null (marks as off-day).
    LocalTime workStart,
    LocalTime workEnd,

    // * Geographic zone this driver covers on this shift (e.g. "ZONE_A", "NORTH").
    String deliveryZone,

    // * Caps the number of deliveries for this shift.
    Integer maxDeliveries,

    // * Controls whether the driver accepts new delivery assignments on this entry.
    Boolean acceptingDeliveries,

    String notes
) {}