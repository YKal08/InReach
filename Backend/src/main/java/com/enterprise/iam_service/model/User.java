package com.enterprise.iam_service.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

// ? @Entity: Defines this class as a JPA entity mapped to the database.
// ? @Table(name = "users"): Specifies the table name in the RDBMS.
// ? @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder: Lombok annotations for boilerplate-free code.
@Entity
@Table(name = "users")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class User {

    // * ID: Uses EGN as the primary key.
    @Id
    @Column(nullable = false, unique = true)
    private String egn;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    private String address;

    private String telephone;

    @Column(columnDefinition = "TEXT")
    private String description;

    // ! SECURITY: unique=true prevents duplicate accounts with the same email.
    @Column(unique = true, nullable = false)
    private String email;

    // ! SECURITY: Stores the salted BCrypt hash, never the plaintext password.
    @Column(nullable = false)
    private String passwordHash;

    // * Status: Controls account lifecycle (e.g., ACTIVE, PENDING, LOCKED).
    @Builder.Default
    private String status = "PENDING"; 

    @Builder.Default
    private Boolean emailVerified = false;

    // ! SECURITY: Tracks failed attempts to trigger the Account Lockout logic.
    @Builder.Default
    private Integer failedLoginAttempts = 0;

    // * Audit: Records the most recent successful authentication event.
    private LocalDateTime lastLoginAt;

    // * Audit: Automatically captures the record creation timestamp via Hibernate.
    @CreationTimestamp
    private LocalDateTime createdAt;

    // * Audit: Automatically updates whenever the entity state is modified.
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // ? @ManyToMany: Defines the relationship between users and roles.
    // ? fetch = FetchType.EAGER: Ensures roles are loaded immediately with the user for security checks.
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    @Builder.Default
    private Set<Role> roles = new HashSet<>();
    
}