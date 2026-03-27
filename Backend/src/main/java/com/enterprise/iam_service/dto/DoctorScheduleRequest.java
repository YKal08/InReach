package com.enterprise.iam_service.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record DoctorScheduleRequest(

    // * The EGN of the doctor this schedule belongs to.
    // ! Required for ADMIN — when a Doctor calls create/update, the service ignores this
    // ! and uses the email from the SecurityContext instead.
    String doctorEgn,

    @NotNull(message = "Day of week is required")
    @Min(value = 1, message = "Day of week must be between 1 (Monday) and 7 (Sunday)")
    @Max(value = 7, message = "Day of week must be between 1 (Monday) and 7 (Sunday)")
    Integer dayOfWeek,

    // * Optional one-off date override — when set, takes priority over dayOfWeek for that date.
    LocalDate specificDate,

    // * Work hours — both must be provided together, or both null (marks as off-day).
    LocalTime workStart,
    LocalTime workEnd,

    // * Caps the number of patient appointments for this shift.
    Integer maxRequests,

    // * Controls whether the doctor accepts new bookings on this schedule entry.
    Boolean acceptingRequests,

    String notes
) {}