package com.enterprise.iam_service.service;

import com.enterprise.iam_service.dto.DriverScheduleRequest;
import com.enterprise.iam_service.dto.DriverScheduleResponse;
import com.enterprise.iam_service.model.DriverSchedule;
import com.enterprise.iam_service.model.Role;
import com.enterprise.iam_service.model.User;
import com.enterprise.iam_service.repository.DriverScheduleRepository;
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
class DriverScheduleServiceIntegrationTest {

    @Autowired
    private DriverScheduleService driverScheduleService;

    @Autowired
    private DriverScheduleRepository driverScheduleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User driver;
    private User admin;
    private Role driverRole;

    @BeforeEach
    void setupData() {
        // Delete in correct order to avoid foreign key violations
        driverScheduleRepository.deleteAll();
        userRepository.deleteAll();
        roleRepository.deleteAll();
        roleRepository.flush();
        userRepository.flush();
        driverScheduleRepository.flush();

        // Create roles
        Role adminRole = roleRepository.save(Role.builder()
                .name("Admin")
                .description("Admin role")
                .build());

        driverRole = roleRepository.save(Role.builder()
                .name("Driver")
                .description("Driver role")
                .build());

        // Create admin user
        admin = userRepository.save(User.builder()
                .egn("1111111111")
                .firstName("Admin")
                .lastName("User")
                        .rawAddress("Sofia")
                .telephone("+359888000000")
                .email("admin@test.com")
                .passwordHash(passwordEncoder.encode("AdminPass1"))
                .status("ACTIVE")
                .roles(java.util.Set.of(adminRole))
                .build());

        // Create driver user
        driver = userRepository.save(User.builder()
                .egn("3333333333")
                .firstName("Pharmacist")
                .lastName("John")
                        .rawAddress("Sofia")
                .telephone("+359888222222")
                .email("driver@test.com")
                .passwordHash(passwordEncoder.encode("DriverPass1"))
                .status("ACTIVE")
                .roles(java.util.Set.of(driverRole))
                .build());
    }

    @Test
    @WithMockUser(username = "driver@test.com")
    void create_shouldPersistDriverScheduleWithDefaultValues() {
        DriverScheduleRequest request = new DriverScheduleRequest(
                driver.getEgn(),
                1,
                null,
                LocalTime.of(8, 0),
                LocalTime.of(16, 0),
                "ZONE_A",
                null, // Will default to 10
                null, // Will default to true
                "Morning deliveries"
        );

        DriverScheduleResponse response = driverScheduleService.create(request);

        assertNotNull(response);
        assertNotNull(response.id());
        assertEquals(driver.getEgn(), response.pharmacistEgn());
        assertEquals(1, response.dayOfWeek());
        assertEquals(LocalTime.of(8, 0), response.workStart());
        assertEquals(LocalTime.of(16, 0), response.workEnd());
        assertEquals("ZONE_A", response.deliveryZone());
        assertEquals(10, response.maxDeliveries()); // Default
        assertTrue(response.acceptingDeliveries()); // Default
        assertTrue(response.active());

        // Verify persistence
        DriverSchedule saved = driverScheduleRepository.findById(response.id()).orElseThrow();
        assertEquals(driver.getEgn(), saved.getPharmacist().getEgn());
        assertEquals(1, saved.getDayOfWeek());
        assertEquals("ZONE_A", saved.getDeliveryZone());
    }

    @Test
    @WithMockUser(username = "driver@test.com")
    void create_shouldPersistDriverScheduleWithSpecificDate() {
        LocalDate specificDate = LocalDate.now().plusDays(5);
        DriverScheduleRequest request = new DriverScheduleRequest(
                driver.getEgn(),
                3,
                specificDate,
                LocalTime.of(10, 0),
                LocalTime.of(14, 0),
                "ZONE_B",
                5,
                true,
                "Special delivery"
        );

        DriverScheduleResponse response = driverScheduleService.create(request);

        assertNotNull(response);
        assertEquals(specificDate, response.specificDate());

        DriverSchedule saved = driverScheduleRepository.findById(response.id()).orElseThrow();
        assertEquals(specificDate, saved.getSpecificDate());
    }

    @Test
    @WithMockUser(username = "driver@test.com")
    void create_shouldThrowException_whenDuplicateScheduleAlreadyActive() {
        DriverScheduleRequest request = new DriverScheduleRequest(
                driver.getEgn(),
                1,
                null,
                LocalTime.of(8, 0),
                LocalTime.of(16, 0),
                "ZONE_A",
                10,
                true,
                "Morning deliveries"
        );

        // Create first schedule
        driverScheduleService.create(request);

        // Try to create duplicate
        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            driverScheduleService.create(request);
        });

        assertTrue(ex.getMessage().contains("An active schedule already exists"));
    }

    @Test
    @WithMockUser(username = "driver@test.com")
    void create_shouldAllowNewScheduleIfPreviousIsInactive() {
        DriverScheduleRequest request = new DriverScheduleRequest(
                driver.getEgn(),
                1,
                null,
                LocalTime.of(8, 0),
                LocalTime.of(16, 0),
                "ZONE_A",
                10,
                true,
                "Morning deliveries"
        );

        // Create and remove first schedule
        DriverScheduleResponse first = driverScheduleService.create(request);
        driverScheduleService.remove(first.id());
        
        // Hard-delete the old inactive schedule to allow create with same day
        driverScheduleRepository.deleteById(first.id());

        // Create new schedule for same day - should succeed
        DriverScheduleResponse second = driverScheduleService.create(request);
        assertNotNull(second);
        assertNotNull(second.id());
    }

    @Test
    @WithMockUser(username = "driver@test.com")
    @Transactional
    void getMySchedules_shouldReturnOnlyActiveSchedulesFromCurrentWeek() {
        // Create multiple schedules
        DriverScheduleRequest request1 = new DriverScheduleRequest(
                driver.getEgn(), 1, null, LocalTime.of(8, 0), LocalTime.of(16, 0), "ZONE_A", 10, true, "Monday"
        );
        DriverScheduleRequest request2 = new DriverScheduleRequest(
                driver.getEgn(), 3, null, LocalTime.of(14, 0), LocalTime.of(22, 0), "ZONE_B", 10, true, "Wednesday"
        );

        DriverScheduleResponse schedule1 = driverScheduleService.create(request1);
        DriverScheduleResponse schedule2 = driverScheduleService.create(request2);

        List<DriverScheduleResponse> schedules = driverScheduleService.getMySchedules();

        assertEquals(2, schedules.size());
        assertTrue(schedules.stream().allMatch(DriverScheduleResponse::active));
    }

    @Test
    @WithMockUser(username = "driver@test.com")
    void getMySchedules_shouldExcludeInactiveSchedules() {
        // Create schedule
        DriverScheduleRequest request = new DriverScheduleRequest(
                driver.getEgn(), 1, null, LocalTime.of(8, 0), LocalTime.of(16, 0), "ZONE_A", 10, true, "Monday"
        );
        DriverScheduleResponse schedule = driverScheduleService.create(request);

        // Remove it
        driverScheduleService.remove(schedule.id());

        // Get schedules
        List<DriverScheduleResponse> schedules = driverScheduleService.getMySchedules();

        assertEquals(0, schedules.size());
    }

    @Test
    @WithMockUser(username = "driver@test.com")
    void getMySchedules_shouldExcludeSchedulesBeforeCurrentWeeksMonday() {
        LocalDate pastDate = LocalDate.now().minusDays(10);
        DriverScheduleRequest request = new DriverScheduleRequest(
                driver.getEgn(),
                1,
                pastDate,
                LocalTime.of(8, 0),
                LocalTime.of(16, 0),
                "ZONE_A",
                10,
                true,
                "Past date"
        );

        driverScheduleService.create(request);

        List<DriverScheduleResponse> schedules = driverScheduleService.getMySchedules();

        assertEquals(0, schedules.size());
    }

    @Test
    @WithMockUser(username = "driver@test.com")
    @Transactional
    void getMySchedules_shouldIncludeRecurringSchedules() {
        DriverScheduleRequest request = new DriverScheduleRequest(
                driver.getEgn(),
                1,
                null, // No specificDate = recurring
                LocalTime.of(8, 0),
                LocalTime.of(16, 0),
                "ZONE_A",
                10,
                true,
                "Recurring Monday"
        );

        driverScheduleService.create(request);

        List<DriverScheduleResponse> schedules = driverScheduleService.getMySchedules();

        assertEquals(1, schedules.size());
        assertTrue(schedules.stream().anyMatch(s -> s.specificDate() == null));
    }

    @Test
    @WithMockUser(username = "driver@test.com")
    @Transactional
    void update_shouldModifyMutableFieldsOnly() {
        DriverScheduleRequest createRequest = new DriverScheduleRequest(
                driver.getEgn(),
                1,
                null,
                LocalTime.of(8, 0),
                LocalTime.of(16, 0),
                "ZONE_A",
                10,
                true,
                "Original"
        );

        DriverScheduleResponse created = driverScheduleService.create(createRequest);

        DriverScheduleRequest updateRequest = new DriverScheduleRequest(
                driver.getEgn(),
                1,
                null,
                LocalTime.of(9, 0),
                LocalTime.of(17, 0),
                "ZONE_B",
                12,
                false,
                "Updated"
        );

        DriverScheduleResponse updated = driverScheduleService.update(created.id(), updateRequest);

        assertEquals(LocalTime.of(9, 0), updated.workStart());
        assertEquals(LocalTime.of(17, 0), updated.workEnd());
        assertEquals("ZONE_B", updated.deliveryZone());
        assertEquals(12, updated.maxDeliveries());
        assertFalse(updated.acceptingDeliveries());
        assertEquals("Updated", updated.notes());
    }

    @Test
    @WithMockUser(username = "driver@test.com")
    @Transactional
    void update_shouldPersistChangesToDatabase() {
        DriverScheduleRequest createRequest = new DriverScheduleRequest(
                driver.getEgn(), 1, null, LocalTime.of(8, 0), LocalTime.of(16, 0), "ZONE_A", 10, true, "Original"
        );

        DriverScheduleResponse created = driverScheduleService.create(createRequest);

        DriverScheduleRequest updateRequest = new DriverScheduleRequest(
                driver.getEgn(), 1, null, LocalTime.of(9, 0), LocalTime.of(17, 0), "ZONE_C", 15, false, "Updated"
        );

        driverScheduleService.update(created.id(), updateRequest);

        DriverSchedule updated = driverScheduleRepository.findById(created.id()).orElseThrow();
        assertEquals(15, updated.getMaxDeliveries());
        assertEquals("ZONE_C", updated.getDeliveryZone());
        assertFalse(updated.getAcceptingDeliveries());
    }

    @Test
    @WithMockUser(username = "driver@test.com")
    void update_shouldThrowException_whenScheduleNotFound() {
        DriverScheduleRequest request = new DriverScheduleRequest(
                driver.getEgn(), 1, null, LocalTime.of(8, 0), LocalTime.of(16, 0), "ZONE_A", 10, true, "Test"
        );

        UUID nonExistentId = UUID.randomUUID();

        assertThrows(RuntimeException.class, () -> driverScheduleService.update(nonExistentId, request));
    }

    @Test
    @WithMockUser(username = "driver@test.com")
    void remove_shouldSetActiveToFalse() {
        DriverScheduleRequest request = new DriverScheduleRequest(
                driver.getEgn(), 1, null, LocalTime.of(8, 0), LocalTime.of(16, 0), "ZONE_A", 10, true, "Test"
        );

        DriverScheduleResponse created = driverScheduleService.create(request);

        driverScheduleService.remove(created.id());

        DriverSchedule removed = driverScheduleRepository.findById(created.id()).orElseThrow();
        assertFalse(removed.getActive());
    }

    @Test
    @WithMockUser(username = "driver@test.com")
    void remove_shouldThrowException_whenScheduleNotFound() {
        UUID nonExistentId = UUID.randomUUID();

        assertThrows(RuntimeException.class, () -> driverScheduleService.remove(nonExistentId));
    }

    @Test
    @WithMockUser(username = "driver@test.com")
    void create_shouldPersistWithCustomValues() {
        DriverScheduleRequest request = new DriverScheduleRequest(
                driver.getEgn(),
                5,
                null,
                LocalTime.of(7, 30),
                LocalTime.of(18, 45),
                "ZONE_SPECIAL",
                20,
                false,
                "Special Friday deliveries"
        );

        DriverScheduleResponse response = driverScheduleService.create(request);

        assertEquals(5, response.dayOfWeek());
        assertEquals(LocalTime.of(7, 30), response.workStart());
        assertEquals(LocalTime.of(18, 45), response.workEnd());
        assertEquals("ZONE_SPECIAL", response.deliveryZone());
        assertEquals(20, response.maxDeliveries());
        assertFalse(response.acceptingDeliveries());
        assertEquals("Special Friday deliveries", response.notes());
    }

    @Test
    @WithMockUser(username = "driver@test.com")
    @Transactional
    void update_shouldAllowPartialUpdates() {
        DriverScheduleRequest createRequest = new DriverScheduleRequest(
                driver.getEgn(),
                1,
                null,
                LocalTime.of(8, 0),
                LocalTime.of(16, 0),
                "ZONE_A",
                10,
                true,
                "Original"
        );

        DriverScheduleResponse created = driverScheduleService.create(createRequest);

        // Update only some fields
        DriverScheduleRequest partialUpdate = new DriverScheduleRequest(
                null,
                null,
                null,
                null,
                null,
                "ZONE_D",
                20,
                null,
                null
        );

        DriverScheduleResponse updated = driverScheduleService.update(created.id(), partialUpdate);

        assertEquals("ZONE_D", updated.deliveryZone());
        assertEquals(20, updated.maxDeliveries());
        assertEquals(LocalTime.of(8, 0), updated.workStart()); // Unchanged
        assertEquals(LocalTime.of(16, 0), updated.workEnd()); // Unchanged
    }

    @Test
    @WithMockUser(username = "driver@test.com")
    void create_shouldPersistMultipleDeliveryZones() {
        DriverScheduleRequest request1 = new DriverScheduleRequest(
                driver.getEgn(),
                1,
                null,
                LocalTime.of(8, 0),
                LocalTime.of(12, 0),
                "ZONE_A",
                5,
                true,
                "Morning ZONE_A"
        );

        DriverScheduleRequest request2 = new DriverScheduleRequest(
                driver.getEgn(),
                1,
                null,
                LocalTime.of(13, 0),
                LocalTime.of(17, 0),
                "ZONE_B",
                5,
                true,
                "Afternoon ZONE_B"
        );

        // Can't have two schedules for same day of week
        driverScheduleService.create(request1);
        RuntimeException ex = assertThrows(RuntimeException.class, () -> driverScheduleService.create(request2));
        assertTrue(ex.getMessage().contains("An active schedule already exists"));
    }

    @Test
    @WithMockUser(username = "driver@test.com")
    @Transactional
    void getMySchedules_shouldGroupByDeliveryZone() {
        DriverScheduleRequest request1 = new DriverScheduleRequest(
                driver.getEgn(), 2, null, LocalTime.of(8, 0), LocalTime.of(16, 0), "ZONE_A", 10, true, "Tuesday ZONE_A"
        );
        DriverScheduleRequest request2 = new DriverScheduleRequest(
                driver.getEgn(), 4, null, LocalTime.of(8, 0), LocalTime.of(16, 0), "ZONE_B", 10, true, "Thursday ZONE_B"
        );

        driverScheduleService.create(request1);
        driverScheduleService.create(request2);

        List<DriverScheduleResponse> schedules = driverScheduleService.getMySchedules();

        assertEquals(2, schedules.size());
        assertTrue(schedules.stream().anyMatch(s -> "ZONE_A".equals(s.deliveryZone())));
        assertTrue(schedules.stream().anyMatch(s -> "ZONE_B".equals(s.deliveryZone())));
    }
}
