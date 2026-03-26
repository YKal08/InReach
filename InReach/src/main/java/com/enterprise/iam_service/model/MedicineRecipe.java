package com.enterprise.iam_service.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

// ? @Entity: Defines this class as a JPA entity mapped to the 'medicine_recipes' table.
@Entity
@Table(name = "medicine_recipes")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class MedicineRecipe {

    // * Primary Key: UUID aligns with the rest of the codebase for consistency and security.
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // ? @ManyToOne: Many recipes can be issued by the same doctor (User).
    // ? FetchType.LAZY: Avoids loading the full User object unless explicitly accessed.
    // ! Links to the User entity — never store a raw doctor ID string.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private User doctor;

    // ? @ManyToMany: A single recipe can contain multiple medications,
    // ? and the same medication can appear on multiple recipes.
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "recipe_medications",
        joinColumns = @JoinColumn(name = "recipe_id"),
        inverseJoinColumns = @JoinColumn(name = "medication_id")
    )
    @Builder.Default
    private Set<Medication> medications = new HashSet<>();

    // * Lifecycle status: ACTIVE → USED / EXPIRED.
    @Builder.Default
    private String status = "ACTIVE";

    // * Optional instructions or notes from the issuing doctor.
    @Column(columnDefinition = "TEXT")
    private String notes;

    // * Audit: Automatically captures when the recipe was issued.
    @CreationTimestamp
    private LocalDateTime createdAt;

    // * Automatically set to 3 months after creation on first persist.
    @Column(nullable = false)
    private LocalDateTime expiresAt;

    // ! @PrePersist fires just before the first INSERT — guarantees expiration
    // ! is always derived from creation time and can never be skipped or overridden.
    @PrePersist
    protected void onPersist() {
        this.expiresAt = LocalDateTime.now().plusMonths(3);
    }
}