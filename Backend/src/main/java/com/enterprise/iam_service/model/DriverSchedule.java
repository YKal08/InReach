package com.enterprise.iam_service.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

// ? @Entity: Defines this class as a JPA entity mapped to the 'pharmacist_schedules' table.
// ? Extends BaseSchedule for shared scheduling logic (recurring + specific date override pattern).
@Entity
@Table(
    name = "pharmacist_schedules",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"pharmacist_id", "day_of_week"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class DriverSchedule extends BaseSchedule {

    // ? @ManyToOne: One pharmacist (User) can have many schedule entries.
    // ! The User's role must be PHARMACIST — enforced at the service layer, not here.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pharmacist_id", nullable = false)
    private User pharmacist;

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
}