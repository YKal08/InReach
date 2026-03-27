package com.enterprise.iam_service.model;

import lombok.*;
import jakarta.persistence.*;

import java.time.LocalTime;



@Entity
@Table(name = "route_stops")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RouteStop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "route_id", nullable = false)
    private Route route;

    @ManyToOne
    @JoinColumn(name = "visit_request_id", nullable = false)
    private VisitRequest visitRequest;

    @Column(nullable = false)
    private Integer stopOrder;

    // * Coordinates used by frontend map rendering.
    private Double latitude;

    private Double longitude;

    // * 24-hour time fields for timeline rendering.
    private LocalTime arrivalTime;

    private LocalTime windowStart;

    private LocalTime windowEnd;

    private LocalTime departureTime;

    // * Informative travel durations around this stop.
    private Integer travelMinutesFromPrevious;

    private Integer travelMinutesToNext;

    @Builder.Default
    private String status = "PENDING"; // PENDING → IN_PROGRESS → COMPLETED
}