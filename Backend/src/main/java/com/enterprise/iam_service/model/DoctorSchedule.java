package com.enterprise.iam_service.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;


@Entity
@Table(
    name = "doctor_schedules",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"doctor_id", "day_of_week"}),
        @UniqueConstraint(columnNames = {"doctor_id", "specific_date"})
    }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class DoctorSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private User doctor;

    // * Recurring weekly template (e.g. every Monday 09:00–17:00).
    // ! Required. Every doctor must have a base schedule per day of week.
    // * Day of week: 1 = Monday, 7 = Sunday.
    // ! @Min and @Max enforce the 1–7 range at the validation layer.
    @Column(name = "day_of_week", nullable = false)
    @Min(1) @Max(7)
    private Integer dayOfWeek;

    // * Optional one-off override for a specific calendar date.
    // ! When set, this entry takes priority over the dayOfWeek template for that date.
    // ! Set workStart and workEnd to null to mark the doctor as off on that date.
    @Column(name = "specific_date")
    private LocalDate specificDate;

    // * Work hours. Nullable to support off days via specificDate override.
    @Column(name = "work_start")
    private LocalTime workStart;

    @Column(name = "work_end")
    private LocalTime workEnd;

    @Builder.Default
    private Boolean acceptingRequests = true;

    @Builder.Default
    @Column(nullable = false)
    private Integer maxRequests = 10;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // * Convenience method for the service layer to check availability without null checks scattered everywhere.
    public boolean isWorkingDay() {
        return workStart != null && workEnd != null;
    }

    @PrePersist
    @PreUpdate
    protected void validate() {
        // * If day of the week is not a part of the week days.
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