package com.enterprise.iam_service.service;

import com.enterprise.iam_service.model.Role;
import com.enterprise.iam_service.model.User;
import com.enterprise.iam_service.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserManagementServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthService authService;

    @Mock
    private GoogleGeocodingService googleGeocodingService;

    @InjectMocks
    private UserManagementService userManagementService;

    @Test
    void getNearbyDoctors_shouldReturnOnlyDoctorsWithin100Km() {
        Role doctorRole = Role.builder().name("Doctor").build();
        Role patientRole = Role.builder().name("Patient").build();

        User currentUser = User.builder()
                .egn("1000000000")
                .firstName("Current")
                .lastName("User")
                .email("current@enterprise.com")
                .lat(42.6977)
                .lng(23.3219)
                .rawAddress("Sofia")
                .roles(Set.of(patientRole))
                .build();

        User nearbyDoctor = User.builder()
                .egn("2000000000")
                .firstName("Near")
                .lastName("Doctor")
                .email("near@enterprise.com")
                .rawAddress("Sofia")
                .telephone("+359888000000")
                .description("Nearby GP")
                .lat(42.6977)
                .lng(23.3219)
                .roles(Set.of(doctorRole))
                .build();

        User farDoctor = User.builder()
                .egn("2000000001")
                .firstName("Far")
                .lastName("Doctor")
                .email("far@enterprise.com")
                .rawAddress("Varna")
                .lat(43.2141)
                .lng(27.9147)
                .roles(Set.of(doctorRole))
                .build();

        User nonDoctor = User.builder()
                .egn("1000000001")
                .firstName("Not")
                .lastName("Doctor")
                .email("nondoctor@enterprise.com")
                .rawAddress("Sofia")
                .lat(42.6977)
                .lng(23.3219)
                .roles(Set.of(patientRole))
                .build();

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(currentUser));
        when(userRepository.findAll()).thenReturn(List.of(currentUser, nearbyDoctor, farDoctor, nonDoctor));

        var nearbyDoctors = userManagementService.getNearbyDoctors("current@enterprise.com");

        assertEquals(1, nearbyDoctors.size());
        assertEquals("2000000000", nearbyDoctors.get(0).egn());
        assertEquals("Near", nearbyDoctors.get(0).firstName());
        assertEquals("Nearby GP", nearbyDoctors.get(0).description());
    }

    @Test
    void getNearbyDoctors_shouldThrowWhenCallerLocationMissing() {
        User currentUser = User.builder()
                .egn("1000000002")
                .firstName("Current")
                .lastName("User")
                .email("current2@enterprise.com")
                .roles(Set.of(Role.builder().name("Patient").build()))
                .build();

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(currentUser));

        assertThrows(RuntimeException.class,
                () -> userManagementService.getNearbyDoctors("current2@enterprise.com"));
    }
}
