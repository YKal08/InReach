package com.enterprise.iam_service.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(
    name = "doctor_schedules",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"doctor_id", "day_of_week"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorSchedule extends BaseSchedule {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private User doctor;

    // * Maximum number of patient requests this doctor can handle per shift.
    // ? Feeds appointment booking logic to cap workload per time slot.
    @Builder.Default
    @Column(nullable = false)
    private Integer maxRequests = 10;

    // * Whether this doctor is currently accepting new appointment requests.
    @Builder.Default
    private Boolean acceptingRequests = true;
}   