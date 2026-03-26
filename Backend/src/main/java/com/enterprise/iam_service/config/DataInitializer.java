package com.enterprise.iam_service.config;

import com.enterprise.iam_service.model.Role;
import com.enterprise.iam_service.model.User;
import com.enterprise.iam_service.repository.RoleRepository;
import com.enterprise.iam_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.util.Set;

// ? @Component ensures this class is picked up by Spring's component scanning.
// ? CommandLineRunner is an interface used to run a specific block of code once the application context has loaded.
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        Role adminRole = ensureRole("ADMIN");
        ensureRole("PATIENT");
        ensureRole("DOCTOR");
        ensureRole("DRIVER");

        if (userRepository.findByEmail("admin@enterprise.com").isEmpty()) {
            User admin = User.builder()
                    .egn("0000000000")
                    .firstName("System")
                    .lastName("Administrator")
                    .address("Enterprise HQ")
                    .telephone("+359000000000")
                    .email("admin@enterprise.com")
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .status("ACTIVE")
                    .roles(Set.of(adminRole))
                    .build();

            userRepository.save(admin);
            System.out.println("Default Admin account created: admin@enterprise.com / admin123");
        }
    }

    private Role ensureRole(String roleName) {
        return roleRepository.findByName(roleName)
                .orElseGet(() -> {
                    Role role = new Role();
                    role.setName(roleName);
                    return roleRepository.save(role);
                });
    }
}