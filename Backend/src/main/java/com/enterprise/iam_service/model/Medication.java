package com.enterprise.iam_service.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

// ? @Entity: Defines this class as a JPA entity mapped to the 'medications' table.
@Entity
@Table(name = "medications")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Medication {

    // * Primary Key: Auto-incrementing Long — medications are a stable reference/lookup table,
    // * so a simple identity ID is appropriate here (same pattern as Role in your codebase).
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ! 'unique = true' prevents duplicate medication entries in the reference table.
    @Column(unique = true, nullable = false)
    private String name;

    // * The active chemical compound (e.g., "Ibuprofen" for a brand like "Advil").
    @Column(nullable = false)
    private String activeIngredient;

    // * Dosage strength including unit (e.g., "500mg", "10ml").
    @Column(nullable = false)
    private String dosage;

    // * Delivery method (e.g., "TABLET", "CAPSULE", "INJECTION", "SYRUP").
    @Column(nullable = false)
    private String form;

    // * Whether this medication requires a prescription to dispense.
    @Builder.Default
    private Boolean requiresPrescription = true;

    // * Optional notes for pharmacists or doctors (e.g., contraindications, storage).
    @Column(columnDefinition = "TEXT")
    private String notes;

    // ? mappedBy = "medications": The MedicineRecipe entity owns the join table,
    // ? so this is the inverse side of the relationship — mirrors Role ↔ User pattern.
    @ManyToMany(mappedBy = "medications")
    @Builder.Default
    private Set<MedicineRecipe> recipes = new HashSet<>();

    // * Audit timestamps.
    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}