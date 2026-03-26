package com.enterprise.iam_service.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.nio.charset.StandardCharsets;

// ? @Component: Allows Spring to manage this class as a bean, making it injectable into Services and Filters.
@Component
public class JwtUtils {
    
    // ! SECURITY ALERT: The secret key must be at least 256-bits (32 characters) for HS256 algorithm.
    // ! TODO: In a production environment, pull this value from an environment variable or HashiCorp Vault.
    private final String jwtSecret = "your-very-secure-and-very-long-secret-key-here-12345";
    
    // * Cryptography: Generates a secure HMAC-SHA signing key from the secret string.
    private final SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    
    // * Configuration: Defines the token TTL (Time To Live). Current setting: 3,600,000ms = 60 minutes.
    private final long expirationMs = 3600000; 

    // * Business Logic: Constructs a signed JWT for an authenticated user.
    public String generateToken(String email) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationMs);

        // ? Jwts.builder() uses the fluent API to assemble the JWT parts.
        return Jwts.builder()
                .subject(email)                 // ! Subject: The unique identifier for the user (email).
                .issuedAt(now)                  // * IAT: Issued At timestamp (used to prevent replay attacks).
                .expiration(expiryDate)         // ! EXP: Expiration timestamp (token becomes invalid after this).
                .signWith(key)                  // ! Digital Signature: Ensures the token hasn't been tampered with.
                .compact();                     // * Finalizes the build and returns a URL-safe Base64 string.
    }

    // * Business Logic: Reverses the process to identify the user from a provided token string.
    public String extractEmail(String token) {
    // ! Verification: The parser checks the signature against our 'key' before reading the payload.
    return Jwts.parser()
            .verifyWith(key)                    // ? verifyWith ensures only tokens we signed are accepted.
            .build()
            .parseSignedClaims(token)           // * If the signature is invalid or expired, this line throws an Exception.
            .getPayload()
            .getSubject();                      // * Returns the email stored in the "sub" claim.
    }
}