package com.enterprise.iam_service.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.*;
import lombok.experimental.SuperBuilder;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

// * Abstract base class for schedule entities (DoctorSchedule, PharmacistSchedule).
// ! Handles all common scheduling logic: recurring weekly templates, specific-date overrides, and validation.
@MappedSuperclass
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public abstract class BaseSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    protected UUID id;

    // * Recurring weekly template (e.g. every Monday 09:00–17:00).
    // ! Required. Every schedule entry must have a base day of week.
    // * Day of week: 1 = Monday, 7 = Sunday.
    // ! @Min and @Max enforce the 1–7 range at the validation layer.
    @Column(name = "day_of_week", nullable = false)
    @Min(1)
    @Max(7)
    protected Integer dayOfWeek;

    // * Optional one-off override for a specific calendar date.
    // ! When set, this entry takes priority over the dayOfWeek template for that date.
    // ! Set workStart and workEnd to null to mark the role as off on that date.
    @Column(name = "specific_date")
    protected LocalDate specificDate;

    // * Work hours. Nullable to support off days via specificDate override.
    @Column(name = "work_start")
    protected LocalTime workStart;

    @Column(name = "work_end")
    protected LocalTime workEnd;

    // * Optional notes (e.g. "Morning shift only", "Cold-chain medications only").
    @Column(columnDefinition = "TEXT")
    protected String notes;

    @CreationTimestamp
    protected LocalDateTime createdAt;

    @UpdateTimestamp
    protected LocalDateTime updatedAt;

    @Column(name = "active")
    @Builder.Default
    protected Boolean active = true;

    // * Convenience method for the service layer to check availability without null checks scattered everywhere.
    public boolean isWorkingDay() {
        return workStart != null && workEnd != null;
    }

    @PrePersist
    @PreUpdate
    protected void validate() {
        // * Validate day of week is in valid range.
        if (dayOfWeek < 1 || dayOfWeek > 7) {
            throw new IllegalStateException("dayOfWeek must be between 1 (Monday) and 7 (Sunday).");
        }
        // * If both hours are provided they must be logically ordered.
        if (workStart != null && workEnd != null && !workStart.isBefore(workEnd)) {
            throw new IllegalStateException("workStart must be before workEnd.");
        }
        // * Partial hour entry is invalid — must be both or neither.
        if ((workStart == null) != (workEnd == null)) {
            throw new IllegalStateException("workStart and workEnd must both be set or both be null.");
        }
    }
}
