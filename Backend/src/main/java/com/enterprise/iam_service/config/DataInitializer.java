package com.enterprise.iam_service.config;

import com.enterprise.iam_service.model.Role;
import com.enterprise.iam_service.model.User;
import com.enterprise.iam_service.repository.RoleRepository;
import com.enterprise.iam_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.admin.password}")
    private String adminPassword;

    @Value("${app.admin.egn}")
    private String adminEgn;

    @Override
    public void run(String... args) {
        if (roleRepository.findByName("Admin").isEmpty()) {

            Role adminRole  = createRole("Admin",    "Full system access");
            Role patientRole = createRole("Patient", "Can submit visit requests and view prescriptions");
            Role doctorRole  = createRole("Doctor",  "Can view assigned routes and issue prescriptions");
            Role driverRole  = createRole("Driver",  "Can view and complete delivery orders");

            if (userRepository.findByEmail(adminEmail).isEmpty()) {
                User admin = User.builder()
                        .egn(adminEgn)
                        .firstName("System")
                        .lastName("Administrator")
                        .address("Enterprise HQ")
                        .telephone("+359000000000")
                        .email(adminEmail)
                        .passwordHash(passwordEncoder.encode(adminPassword))
                        .status("ACTIVE")
                        .roles(Set.of(adminRole))
                        .build();

                userRepository.save(admin);
                System.out.println("Default admin account created: " + adminEmail);
            }
        }
    }

    private Role createRole(String name, String description) {
        Role role = new Role();
        role.setName(name);
        role.setDescription(description);
        return roleRepository.save(role);
    }
}