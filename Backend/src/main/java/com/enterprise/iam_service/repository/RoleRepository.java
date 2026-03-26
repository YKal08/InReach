package com.enterprise.iam_service.repository;

import com.enterprise.iam_service.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

// ? @Repository: Marks this interface as a Data Access Object (DAO) within the Spring context.
// ? JpaRepository<Role, Long>: Provides standard CRUD methods (Save, Delete, FindByID) for the Role entity.
@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {

    // * Query Method: Automatically generates the SQL to look up roles like "ADMIN" or "USER" by name.
    // ? Optional<Role>: Prevents NullPointerExceptions by wrapping the result in a container that might be empty.
    Optional<Role> findByName(String name);
}