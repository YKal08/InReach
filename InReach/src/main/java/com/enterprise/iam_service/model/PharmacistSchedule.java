package com.enterprise.iam_service.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

// ? @Entity: Defines this class as a JPA entity mapped to the 'pharmacist_schedules' table.
// ? Mirrors DoctorSchedule exactly — same dual-mode pattern (recurring + specific date override).
@Entity
@Table(
    name = "pharmacist_schedules",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"pharmacist_id", "day_of_week"}),
        @UniqueConstraint(columnNames = {"pharmacist_id", "specific_date"})
    }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class PharmacistSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // ? @ManyToOne: One pharmacist (User) can have many schedule entries.
    // ! The User's role must be PHARMACIST — enforced at the service layer, not here.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pharmacist_id", nullable = false)
    private User pharmacist;

    // * Recurring weekly template. 1 = Monday, 7 = Sunday.
    @Column(name = "day_of_week", nullable = false)
    @Min(1) @Max(7)
    private Integer dayOfWeek;

    // * Optional one-off override. When set, takes priority over dayOfWeek for that date.
    // ! Null hours on a specific date = day off (same pattern as DoctorSchedule).
    @Column(name = "specific_date")
    private LocalDate specificDate;

    @Column(name = "work_start")
    private LocalTime workStart;

    @Column(name = "work_end")
    private LocalTime workEnd;

    // * Delivery-specific: the geographic zone(s) this pharmacist covers on this day.
    // ? Stored as a simple string (e.g. "ZONE_A", "NORTH") — adapt to an enum or FK as needed.
    @Column(name = "delivery_zone")
    private String deliveryZone;

    // * Maximum number of deliveries this pharmacist can handle in this shift.
    // ? Feeds the route optimization logic to cap workload per deliverer.
    @Builder.Default
    @Column(nullable = false)
    private Integer maxDeliveries = 10;

    // * Whether this pharmacist is currently accepting new delivery assignments.
    @Builder.Default
    private Boolean acceptingDeliveries = true;

    // * Optional shift notes (e.g. "Morning route only", "Cold-chain meds only").
    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // * Convenience method — mirrors DoctorSchedule.isWorkingDay() for consistent service-layer checks.
    public boolean isWorkingDay() {
        return workStart != null && workEnd != null;
    }

    @PrePersist
    @PreUpdate
    protected void validate() {
        if (dayOfWeek < 1 || dayOfWeek > 7) {
            throw new IllegalStateException("dayOfWeek must be between 1 (Monday) and 7 (Sunday).");
        }
        if (workStart != null && workEnd != null && !workStart.isBefore(workEnd)) {
            throw new IllegalStateException("workStart must be before workEnd.");
        }
        if ((workStart == null) != (workEnd == null)) {
            throw new IllegalStateException("workStart and workEnd must both be set or both be null.");
        }
    }
}