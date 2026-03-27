package com.enterprise.iam_service.repository;

import com.enterprise.iam_service.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
//import java.util.UUID;
import java.util.List;

// ? JpaRepository<User, UUID>: Inherits full CRUD functionality for the User entity using UUID as the ID type.
public interface UserRepository extends JpaRepository<User, String> {

    // * Query Method: Derived by Spring Data to find a user record by their unique email address.
    // ? Optional<User>: Safely handles cases where a user might not exist without returning null.
    Optional<User> findByEmail(String email);

    // * Custom Finder: Retrieves a list of all users filtered by their account status (e.g., 'LOCKED', 'ACTIVE').
    // ! Used by Admin controllers to monitor account security across the platform.
    List<User> findAllByStatus(String status);

    // * Validation Helper: Returns a boolean to check if an email is already taken during registration.
    // ! High-performance check that avoids loading the entire User object into memory.
    boolean existsByEmail(String email);

    Optional<User> findById(String egn);

    List<User> findAllByRoles_NameIgnoreCase(String roleName);
}