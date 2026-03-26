package com.enterprise.iam_service.controller;

import com.enterprise.iam_service.model.User;
import com.enterprise.iam_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

// ? @RestController marks this class as a request handler for RESTful web services.
// ? @RequestMapping("/api/admin") sets the base path for all endpoints in this controller.
// ? @RequiredArgsConstructor (Lombok) generates a constructor for the 'final' UserRepository field.
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;

    // GET all users
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    // GET all locked accounts
    @GetMapping("/users/locked")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getLockedUsers() {
        return ResponseEntity.ok(userRepository.findAllByStatus("LOCKED"));
    }

    // GET all pending accounts (new registrations awaiting approval)
    @GetMapping("/users/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getPendingUsers() {
        return ResponseEntity.ok(userRepository.findAllByStatus("PENDING"));
    }

    // POST activate a PENDING or LOCKED account → sets status to ACTIVE
    // ! This is the primary action for approving new user registrations.
    @PostMapping("/users/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> activateUser(@PathVariable UUID id) {
        return userRepository.findById(id).map(user -> {
            user.setStatus("ACTIVE");
            user.setFailedLoginAttempts(0);
            userRepository.save(user);
            return ResponseEntity.ok("User activated: " + user.getEmail());
        }).orElse(ResponseEntity.notFound().build());
    }

    // POST lock an account manually
    @PostMapping("/users/{id}/lock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> lockUser(@PathVariable UUID id) {
        return userRepository.findById(id).map(user -> {
            user.setStatus("LOCKED");
            userRepository.save(user);
            return ResponseEntity.ok("User locked: " + user.getEmail());
        }).orElse(ResponseEntity.notFound().build());
    }

    // DELETE a user account
    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteUser(@PathVariable UUID id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok("User deleted.");
    }
}