package com.enterprise.iam_service.controller;

import com.enterprise.iam_service.dto.RegisterRequest;
import com.enterprise.iam_service.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.enterprise.iam_service.dto.LoginRequest;
import com.enterprise.iam_service.dto.AuthResponse;

// ? @RestController indicates that the data returned by each method will be written straight into the response body instead of rendering a template.
// ? @RequestMapping("/api/auth") defines the base URI for all authentication-related requests.
// ? @RequiredArgsConstructor generates a constructor for the final 'authService' field, enabling Constructor Injection.
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // * Public Endpoint: Entry point for new users to create an account.
    // ? @Valid triggers the validation constraints defined in the RegisterRequest DTO (e.g., @Email, @NotBlank).
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody @Valid RegisterRequest request) {
        // * Returns a 200 OK with the AuthResponse containing the JWT upon successful registration.
        return ResponseEntity.ok(authService.register(request));
    }

    // ! SECURITY: Entry point for user authentication.
    // * Validates user credentials and generates a stateless session token (JWT).
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        // ! Calls the core authentication logic which handles password matching and account lockout checks.
        return ResponseEntity.ok(authService.authenticate(request)); // Returns the JWT
    }

}