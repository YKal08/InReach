package com.enterprise.iam_service.model;

import lombok.*;
import jakarta.persistence.*;



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

    @Builder.Default
    private String status = "PENDING"; // PENDING → IN_PROGRESS → COMPLETED
}