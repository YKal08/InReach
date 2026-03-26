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
        // * Logic check: Prevent duplicate roles by verifying if "ADMIN" already exists in the DB.
        if (roleRepository.findByName("ADMIN").isEmpty()) {
            
            // * Initialize the system's core Administrative Role.
            Role adminRole = new Role();
            adminRole.setName("ADMIN");
            roleRepository.save(adminRole);

            Role patientRole = new Role();
            patientRole.setName("PATIENT");
            roleRepository.save(patientRole);

            Role doctorRole = new Role();
            doctorRole.setName("DOCTOR");
            roleRepository.save(doctorRole);

            Role driverRole = new Role();
            driverRole.setName("DRIVER");
            roleRepository.save(driverRole);

            // * Seed the initial system administrator if they don't exist.
            if (userRepository.findByEmail("admin@enterprise.com").isEmpty()) {
                
                // ! SECURITY ALERT: Default credentials used for first-time setup. 
                // ! Change password immediately after first login.
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
                
                // * Audit: Log initial setup to the console.
                System.out.println("Default Admin account created: admin@enterprise.com / admin123");
            }
        }
        
    }
}