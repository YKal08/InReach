package com.enterprise.iam_service.config;

import com.enterprise.iam_service.model.Role;
import com.enterprise.iam_service.model.User;
import com.enterprise.iam_service.repository.RoleRepository;
import com.enterprise.iam_service.repository.UserRepository;
import com.enterprise.iam_service.service.GoogleGeocodingService;
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
    private final GoogleGeocodingService googleGeocodingService;

    @Value("${ADMIN_EMAIL}")
    private String adminEmail;

    @Value("${ADMIN_PASSWORD}")
    private String adminPassword;

    @Value("${ADMIN_EGN}")
    private String adminEgn;

    @Value("${ADMIN_FIRST_NAME}")
    private String adminFirstName;

    @Value("${ADMIN_LAST_NAME}")
    private String adminLastName;

    @Value("${ADMIN_ADDRESS}")
    private String adminAddress;

    @Value("${ADMIN_TELEPHONE}")
    private String adminTelephone;

    @Value("${ADMIN_STATUS}")
    private String adminStatus;

    @Override
    public void run(String... args) {
        if (roleRepository.findByName("Admin").isEmpty()) {

            // * Initialize the system's core Administrative Role.
             Role adminRole = new Role();
            adminRole.setName("Admin");
            adminRole.setDescription("Full system access");
            roleRepository.save(adminRole);

            Role patientRole = new Role();
            patientRole.setName("Patient");
            patientRole.setDescription("Can submit visit requests and view prescriptions");
            roleRepository.save(patientRole);

            Role doctorRole = new Role();
            doctorRole.setName("Doctor");
            doctorRole.setDescription("Can view assigned routes and issue prescriptions");
            roleRepository.save(doctorRole);

            Role driverRole = new Role();
            driverRole.setName("Driver");
            driverRole.setDescription("Can view and complete delivery orders");
            roleRepository.save(driverRole);

            // * Seed the initial system administrator if they don't exist.
            if (userRepository.findByEmail(adminEmail).isEmpty()) {

                // ! SECURITY ALERT: Default credentials used for first-time setup.
                // ! Change password immediately after first login.
                User admin = User.builder()
                    .egn(adminEgn)
                    .firstName(adminFirstName)
                    .lastName(adminLastName)
                    .rawAddress(adminAddress)
                    .telephone(adminTelephone)
                    .email(adminEmail)
                    .passwordHash(passwordEncoder.encode(adminPassword))
                    .status(adminStatus)
                    .roles(Set.of(adminRole))
                    .build();
                googleGeocodingService.geocodeAndApplyToUser(admin, admin.getRawAddress());
                userRepository.save(admin);

                // * Audit: Log initial setup to the console.
                System.out.println("Default Admin account created: " + adminEmail);
            }
        }
    }
}