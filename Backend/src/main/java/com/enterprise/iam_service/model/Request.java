package com.enterprise.iam_service.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

// ? @Entity: Defines this class as a JPA entity mapped to the 'requests' table.
// ? @Builder, @Getter, @Setter etc. reduce boilerplate via Lombok.
@Entity
@Table(name = "requests")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Request {

    // * Primary Key: UUID aligns with the User model for consistency and distributed-system safety.
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // ? @ManyToOne: A single user can have many requests.
    // ? FetchType.LAZY: Avoids loading the full User object unless explicitly accessed.
    // ! SECURITY: Links to the authenticated User entity — never accept a raw EGN string from the client.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // * The physical delivery address for this request.
    @Column(nullable = false)
    private String address;

    // * The type of doctor/specialist being requested (e.g., "CARDIOLOGIST", "GP").
    @Column(name = "doctor_type", nullable = false)
    private String doctorType;

    // * Priority tier for route optimization (e.g., 1 = Critical, 2 = Urgent, 3 = Routine).
    @Column(nullable = false)
    @Builder.Default
     @Min(1) @Max(3)
    private Integer priority = 3;

    // * Lifecycle status: PENDING → IN_PROGRESS → COMPLETED / CANCELLED.
    @Builder.Default
    private String status = "PENDING";

    // * Optional notes from the patient or referring doctor.
    @Column(columnDefinition = "TEXT")
    private String notes;

    // * Audit: Automatically captures when the request was submitted.
    @CreationTimestamp
    private LocalDateTime createdAt;

    // * Audit: Automatically updates whenever the request state changes.
    @UpdateTimestamp
    private LocalDateTime updatedAt;

}
