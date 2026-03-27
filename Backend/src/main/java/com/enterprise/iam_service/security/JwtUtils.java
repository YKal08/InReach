package com.enterprise.iam_service.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.nio.charset.StandardCharsets;

@Component
public class JwtUtils {

    private final SecretKey key;
    private final long expirationMs;

    // Injected from application.properties → environment variables
    public JwtUtils(
            @Value("${app.jwt.secret:ThisIsAVeryLongJwtSecretKeyForDevelopment1234567890}") String jwtSecret,
            @Value("${app.jwt.expiration-ms:3600000}") long expirationMs) {

        if (jwtSecret == null || jwtSecret.length() < 32) {
            throw new IllegalArgumentException(
                "JWT secret must be at least 32 characters (256 bits). Check your APP_JWT_SECRET env var.");
        }

        this.key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generateToken(String email) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(email)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    public String extractEmail(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }
}