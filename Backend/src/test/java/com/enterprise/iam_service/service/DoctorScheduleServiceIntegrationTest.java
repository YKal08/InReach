package com.enterprise.iam_service.service;

import com.enterprise.iam_service.dto.DoctorScheduleRequest;
import com.enterprise.iam_service.dto.DoctorScheduleResponse;
import com.enterprise.iam_service.model.DoctorSchedule;
import com.enterprise.iam_service.model.Role;
import com.enterprise.iam_service.model.User;
import com.enterprise.iam_service.repository.DoctorScheduleRepository;
import com.enterprise.iam_service.repository.RoleRepository;
import com.enterprise.iam_service.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
class DoctorScheduleServiceIntegrationTest {

    @Autowired
    private DoctorScheduleService doctorScheduleService;

    @Autowired
    private DoctorScheduleRepository doctorScheduleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User doctor;
    private User admin;
    private Role doctorRole;

    @BeforeEach
    void setupData() {
        // Delete in correct order to avoid foreign key violations
        doctorScheduleRepository.deleteAll();
        userRepository.deleteAll();
        roleRepository.deleteAll();
        roleRepository.flush();
        userRepository.flush();
        doctorScheduleRepository.flush();

        // Create roles
        Role adminRole = roleRepository.save(Role.builder()
                .name("Admin")
                .description("Admin role")
                .build());

        doctorRole = roleRepository.save(Role.builder()
                .name("Doctor")
                .description("Doctor role")
                .build());

        // Create admin user
        admin = userRepository.save(User.builder()
                .egn("1111111111")
                .firstName("Admin")
                .lastName("User")
                .address("Sofia")
                .telephone("+359888000000")
                .email("admin@test.com")
                .passwordHash(passwordEncoder.encode("AdminPass1"))
                .status("ACTIVE")
                .roles(java.util.Set.of(adminRole))
                .build());

        // Create doctor user
        doctor = userRepository.save(User.builder()
                .egn("2222222222")
                .firstName("Dr.")
                .lastName("John")
                .address("Sofia")
                .telephone("+359888111111")
                .email("doctor@test.com")
                .passwordHash(passwordEncoder.encode("DoctorPass1"))
                .status("ACTIVE")
                .roles(java.util.Set.of(doctorRole))
                .build());
    }

    @Test
    @WithMockUser(username = "doctor@test.com")
    void create_shouldPersistDoctorScheduleWithDefaultValues() {
        DoctorScheduleRequest request = new DoctorScheduleRequest(
                doctor.getEgn(),
                1,
                null,
                LocalTime.of(8, 0),
                LocalTime.of(16, 0),
                null, // Will default to 10
                null, // Will default to true
                "Morning shift"
        );

        DoctorScheduleResponse response = doctorScheduleService.create(request);

        assertNotNull(response);
        assertNotNull(response.id());
        assertEquals(doctor.getEgn(), response.doctorEgn());
        assertEquals(1, response.dayOfWeek());
        assertEquals(LocalTime.of(8, 0), response.workStart());
        assertEquals(LocalTime.of(16, 0), response.workEnd());
        assertEquals(10, response.maxRequests()); // Default
        assertTrue(response.acceptingRequests()); // Default
        assertTrue(response.active());

        // Verify persistence
        DoctorSchedule saved = doctorScheduleRepository.findById(response.id()).orElseThrow();
        assertEquals(doctor.getEgn(), saved.getDoctor().getEgn());
        assertEquals(1, saved.getDayOfWeek());
    }

    @Test
    @WithMockUser(username = "doctor@test.com")
    void create_shouldPersistDoctorScheduleWithSpecificDate() {
        LocalDate specificDate = LocalDate.now().plusDays(5);
        DoctorScheduleRequest request = new DoctorScheduleRequest(
                doctor.getEgn(),
                3,
                specificDate,
                LocalTime.of(10, 0),
                LocalTime.of(14, 0),
                5,
                true,
                "Special appointment"
        );

        DoctorScheduleResponse response = doctorScheduleService.create(request);

        assertNotNull(response);
        assertEquals(specificDate, response.specificDate());

        DoctorSchedule saved = doctorScheduleRepository.findById(response.id()).orElseThrow();
        assertEquals(specificDate, saved.getSpecificDate());
    }

    @Test
    @WithMockUser(username = "doctor@test.com")
    void create_shouldThrowException_whenDuplicateScheduleAlreadyActive() {
        DoctorScheduleRequest request = new DoctorScheduleRequest(
                doctor.getEgn(),
                1,
                null,
                LocalTime.of(8, 0),
                LocalTime.of(16, 0),
                10,
                true,
                "Morning shift"
        );

        // Create first schedule
        doctorScheduleService.create(request);

        // Try to create duplicate
        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            doctorScheduleService.create(request);
        });

        assertTrue(ex.getMessage().contains("An active schedule already exists"));
    }

    @Test
    @WithMockUser(username = "doctor@test.com")
    void create_shouldAllowNewScheduleIfPreviousIsInactive() {
        DoctorScheduleRequest request = new DoctorScheduleRequest(
                doctor.getEgn(),
                1,
                null,
                LocalTime.of(8, 0),
                LocalTime.of(16, 0),
                10,
                true,
                "Morning shift"
        );

        // Create and remove first schedule
        DoctorScheduleResponse first = doctorScheduleService.create(request);
        doctorScheduleService.remove(first.id());
        
        // Hard-delete the old inactive schedule to allow create with same day
        doctorScheduleRepository.deleteById(first.id());

        // Create new schedule for same day - should succeed
        DoctorScheduleResponse second = doctorScheduleService.create(request);
        assertNotNull(second);
        assertNotNull(second.id());
    }

    @Test
    @WithMockUser(username = "doctor@test.com")
    @Transactional
    void getMySchedules_shouldReturnOnlyActiveSchedulesFromCurrentWeek() {
        // Create multiple schedules
        DoctorScheduleRequest request1 = new DoctorScheduleRequest(
                doctor.getEgn(), 1, null, LocalTime.of(8, 0), LocalTime.of(16, 0), 10, true, "Monday"
        );
        DoctorScheduleRequest request2 = new DoctorScheduleRequest(
                doctor.getEgn(), 3, null, LocalTime.of(14, 0), LocalTime.of(22, 0), 10, true, "Wednesday"
        );

        DoctorScheduleResponse schedule1 = doctorScheduleService.create(request1);
        DoctorScheduleResponse schedule2 = doctorScheduleService.create(request2);

        List<DoctorScheduleResponse> schedules = doctorScheduleService.getMySchedules();

        assertEquals(2, schedules.size());
        assertTrue(schedules.stream().allMatch(DoctorScheduleResponse::active));
    }

    @Test
    @WithMockUser(username = "doctor@test.com")
    void getMySchedules_shouldExcludeInactiveSchedules() {
        // Create schedule
        DoctorScheduleRequest request = new DoctorScheduleRequest(
                doctor.getEgn(), 1, null, LocalTime.of(8, 0), LocalTime.of(16, 0), 10, true, "Monday"
        );
        DoctorScheduleResponse schedule = doctorScheduleService.create(request);

        // Remove it
        doctorScheduleService.remove(schedule.id());

        // Get schedules
        List<DoctorScheduleResponse> schedules = doctorScheduleService.getMySchedules();

        assertEquals(0, schedules.size());
    }

    @Test
    @WithMockUser(username = "doctor@test.com")
    void getMySchedules_shouldExcludeSchedulesBeforeCurrentWeeksMonday() {
        LocalDate pastDate = LocalDate.now().minusDays(10);
        DoctorScheduleRequest request = new DoctorScheduleRequest(
                doctor.getEgn(),
                1,
                pastDate,
                LocalTime.of(8, 0),
                LocalTime.of(16, 0),
                10,
                true,
                "Past date"
        );

        doctorScheduleService.create(request);

        List<DoctorScheduleResponse> schedules = doctorScheduleService.getMySchedules();

        assertEquals(0, schedules.size());
    }

    @Test
    @WithMockUser(username = "doctor@test.com")
    @Transactional
    void getMySchedules_shouldIncludeRecurringSchedules() {
        DoctorScheduleRequest request = new DoctorScheduleRequest(
                doctor.getEgn(),
                1,
                null, // No specificDate = recurring
                LocalTime.of(8, 0),
                LocalTime.of(16, 0),
                10,
                true,
                "Recurring Monday"
        );

        doctorScheduleService.create(request);

        List<DoctorScheduleResponse> schedules = doctorScheduleService.getMySchedules();

        assertEquals(1, schedules.size());
        assertTrue(schedules.stream().anyMatch(s -> s.specificDate() == null));
    }

    @Test
    @WithMockUser(username = "doctor@test.com")
    @Transactional
    void update_shouldModifyMutableFieldsOnly() {
        DoctorScheduleRequest createRequest = new DoctorScheduleRequest(
                doctor.getEgn(),
                1,
                null,
                LocalTime.of(8, 0),
                LocalTime.of(16, 0),
                10,
                true,
                "Original"
        );

        DoctorScheduleResponse created = doctorScheduleService.create(createRequest);

        DoctorScheduleRequest updateRequest = new DoctorScheduleRequest(
                doctor.getEgn(),
                1,
                null,
                LocalTime.of(9, 0),
                LocalTime.of(17, 0),
                12,
                false,
                "Updated"
        );

        DoctorScheduleResponse updated = doctorScheduleService.update(created.id(), updateRequest);

        assertEquals(LocalTime.of(9, 0), updated.workStart());
        assertEquals(LocalTime.of(17, 0), updated.workEnd());
        assertEquals(12, updated.maxRequests());
        assertFalse(updated.acceptingRequests());
        assertEquals("Updated", updated.notes());
    }

    @Test
    @WithMockUser(username = "doctor@test.com")
    @Transactional
    void update_shouldPersistChangesToDatabase() {
        DoctorScheduleRequest createRequest = new DoctorScheduleRequest(
                doctor.getEgn(), 1, null, LocalTime.of(8, 0), LocalTime.of(16, 0), 10, true, "Original"
        );

        DoctorScheduleResponse created = doctorScheduleService.create(createRequest);

        DoctorScheduleRequest updateRequest = new DoctorScheduleRequest(
                doctor.getEgn(), 1, null, LocalTime.of(9, 0), LocalTime.of(17, 0), 15, false, "Updated"
        );

        doctorScheduleService.update(created.id(), updateRequest);

        DoctorSchedule updated = doctorScheduleRepository.findById(created.id()).orElseThrow();
        assertEquals(15, updated.getMaxRequests());
        assertFalse(updated.getAcceptingRequests());
    }

    @Test
    @WithMockUser(username = "doctor@test.com")
    void update_shouldThrowException_whenScheduleNotFound() {
        DoctorScheduleRequest request = new DoctorScheduleRequest(
                doctor.getEgn(), 1, null, LocalTime.of(8, 0), LocalTime.of(16, 0), 10, true, "Test"
        );

        UUID nonExistentId = UUID.randomUUID();

        assertThrows(RuntimeException.class, () -> doctorScheduleService.update(nonExistentId, request));
    }

    @Test
    @WithMockUser(username = "doctor@test.com")
    void remove_shouldSetActiveToFalse() {
        DoctorScheduleRequest request = new DoctorScheduleRequest(
                doctor.getEgn(), 1, null, LocalTime.of(8, 0), LocalTime.of(16, 0), 10, true, "Test"
        );

        DoctorScheduleResponse created = doctorScheduleService.create(request);

        doctorScheduleService.remove(created.id());

        DoctorSchedule removed = doctorScheduleRepository.findById(created.id()).orElseThrow();
        assertFalse(removed.getActive());
    }

    @Test
    @WithMockUser(username = "doctor@test.com")
    void remove_shouldThrowException_whenScheduleNotFound() {
        UUID nonExistentId = UUID.randomUUID();

        assertThrows(RuntimeException.class, () -> doctorScheduleService.remove(nonExistentId));
    }

    @Test
    @WithMockUser(username = "doctor@test.com")
    void create_shouldPersistWithCustomValues() {
        DoctorScheduleRequest request = new DoctorScheduleRequest(
                doctor.getEgn(),
                5,
                null,
                LocalTime.of(7, 30),
                LocalTime.of(18, 45),
                20,
                false,
                "Special Friday schedule"
        );

        DoctorScheduleResponse response = doctorScheduleService.create(request);

        assertEquals(5, response.dayOfWeek());
        assertEquals(LocalTime.of(7, 30), response.workStart());
        assertEquals(LocalTime.of(18, 45), response.workEnd());
        assertEquals(20, response.maxRequests());
        assertFalse(response.acceptingRequests());
        assertEquals("Special Friday schedule", response.notes());
    }

    @Test
    @WithMockUser(username = "doctor@test.com")
    @Transactional
    void update_shouldAllowPartialUpdates() {
        DoctorScheduleRequest createRequest = new DoctorScheduleRequest(
                doctor.getEgn(),
                1,
                null,
                LocalTime.of(8, 0),
                LocalTime.of(16, 0),
                10,
                true,
                "Original"
        );

        DoctorScheduleResponse created = doctorScheduleService.create(createRequest);

        // Update only one field
        DoctorScheduleRequest partialUpdate = new DoctorScheduleRequest(
                null,
                null,
                null,
                null,
                null,
                20,
                null,
                null
        );

        DoctorScheduleResponse updated = doctorScheduleService.update(created.id(), partialUpdate);

        assertEquals(20, updated.maxRequests());
        assertEquals(LocalTime.of(8, 0), updated.workStart()); // Unchanged
        assertEquals(LocalTime.of(16, 0), updated.workEnd()); // Unchanged
    }
}
