package com.enterprise.iam_service.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.Set;
import java.util.HashSet;

// ? @Entity marks this class as a JPA entity that maps to a database table.
// ? @Table(name = "roles") explicitly names the table in PostgreSQL.
// ? @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder (Lombok) reduce boilerplate code for data access and object construction.
@Entity
@Table(name = "roles")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Role {
    
    // * Primary Key: Uses Identity strategy for auto-incrementing IDs in the database.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ! SECURITY: 'unique = true' ensures role names (like ADMIN) cannot be duplicated.
    // ! 'nullable = false' enforces database-level integrity.
    @Column(unique = true, nullable = false)
    private String name;

    // * Metadata: Provides context for what permissions this role grants.
    private String description;

    // ? @ManyToMany(mappedBy = "roles") defines the inverse side of the relationship.
    // ? The 'mappedBy' attribute tells JPA that the 'User' entity owns the relationship configuration.
    @ManyToMany(mappedBy = "roles")
    @Builder.Default
    private Set<User> users = new HashSet<>();
    
}