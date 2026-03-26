package com.enterprise.iam_service.service;

import com.enterprise.iam_service.model.User;
import com.enterprise.iam_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

// ? @Service: Defines this class as a specialized security utility bean within the Spring context.
// ? @RequiredArgsConstructor: Facilitates constructor-based dependency injection for the password encoder and repository.
@Service
@RequiredArgsConstructor
public class SecurityService {

    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;

    // * Business Logic: Transforms a plaintext password into a secure one-way cryptographic hash.
    public String hashPassword(String password) {
        // ! SECURITY: Utilizes the configured BCrypt algorithm to salt and hash credentials before storage.
        return passwordEncoder.encode(password);
    }

    // * Business Logic: Validates a raw password against a stored hash during the login process.
    public boolean verifyPassword(String password, String hash) {
        // ! SECURITY: Prevents timing attacks by using a secure comparison method provided by Spring Security.
        return passwordEncoder.matches(password, hash);
    }

    // ! SECURITY: Brute-Force Protection Logic.
    // * Increments failure counters and triggers automated account suspension.
    public void handleFailedLogin(User user) {
        // * Step 1: Increment the persistent counter for failed attempts.
        user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);
        
        // ! Step 2: Threshold Check. 
        // ? If the user reaches 5 attempts, the 'status' is flipped to "LOCKED".
        // ? This prevents further authentication attempts until an admin intervenes.
        if (user.getFailedLoginAttempts() >= 5) {
            user.setStatus("LOCKED");
        }
        
        // * Step 3: Synchronize the security state with the database.
        userRepository.save(user);
    }
}