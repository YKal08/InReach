package com.enterprise.iam_service.controller;

import com.enterprise.iam_service.SecurityConfig;
import com.enterprise.iam_service.dto.DriverScheduleRequest;
import com.enterprise.iam_service.dto.DriverScheduleResponse;
import com.enterprise.iam_service.security.JwtAuthenticationFilter;
import com.enterprise.iam_service.service.DriverScheduleService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

//import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = DriverScheduleController.class,
        excludeFilters = {
                @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = SecurityConfig.class),
                @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = JwtAuthenticationFilter.class)
        })
@AutoConfigureMockMvc(addFilters = false)
class DriverScheduleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private DriverScheduleService driverScheduleService;

    private UUID scheduleId = UUID.randomUUID();

    @Test
    @WithMockUser(roles = "DRIVER")
    void create_shouldReturnCreatedSchedule_whenRequestIsValid() throws Exception {
        DriverScheduleRequest request = new DriverScheduleRequest(
                "1234567890",
                1,
                null,
                LocalTime.of(8, 0),
                LocalTime.of(16, 0),
                "ZONE_A",
                10,
                true,
                "Morning deliveries"
        );

        DriverScheduleResponse response = new DriverScheduleResponse(
                scheduleId,
                "1234567890",
                "John Doe",
                1,
                null,
                LocalTime.of(8, 0),
                LocalTime.of(16, 0),
                "ZONE_A",
                10,
                true,
                true,
                "Morning deliveries",
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        when(driverScheduleService.create(any(DriverScheduleRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/schedule/delivery/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(scheduleId.toString()))
                .andExpect(jsonPath("$.pharmacistEgn").value("1234567890"))
                .andExpect(jsonPath("$.dayOfWeek").value(1))
                .andExpect(jsonPath("$.workStart").value("08:00:00"))
                .andExpect(jsonPath("$.workEnd").value("16:00:00"))
                .andExpect(jsonPath("$.deliveryZone").value("ZONE_A"))
                .andExpect(jsonPath("$.maxDeliveries").value(10))
                .andExpect(jsonPath("$.acceptingDeliveries").value(true));

        verify(driverScheduleService, times(1)).create(any(DriverScheduleRequest.class));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_shouldReturnCreatedSchedule_whenAdminCreatesScheduleForDriver() throws Exception {
        DriverScheduleRequest request = new DriverScheduleRequest(
                "0987654321",
                2,
                null,
                LocalTime.of(14, 0),
                LocalTime.of(22, 0),
                "ZONE_B",
                15,
                true,
                "Evening deliveries"
        );

        DriverScheduleResponse response = new DriverScheduleResponse(
                scheduleId,
                "0987654321",
                "Jane Smith",
                2,
                null,
                LocalTime.of(14, 0),
                LocalTime.of(22, 0),
                "ZONE_B",
                15,
                true,
                true,
                "Evening deliveries",
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        when(driverScheduleService.create(any(DriverScheduleRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/schedule/delivery/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.pharmacistEgn").value("0987654321"));

        verify(driverScheduleService, times(1)).create(any(DriverScheduleRequest.class));
    }

    @Test
    @WithMockUser(roles = "DRIVER")
    void create_shouldReturnBadRequest_whenDayOfWeekIsInvalid() throws Exception {
        DriverScheduleRequest request = new DriverScheduleRequest(
                "1234567890",
                10, // Invalid: must be 1-7
                null,
                LocalTime.of(8, 0),
                LocalTime.of(16, 0),
                "ZONE_A",
                10,
                true,
                "Invalid day"
        );

        mockMvc.perform(post("/api/schedule/delivery/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "DRIVER")
    void create_shouldReturnBadRequest_whenDayOfWeekIsMissing() throws Exception {
        String requestJson = "{\"pharmacistEgn\": \"1234567890\", \"deliveryZone\": \"ZONE_A\", \"workStart\": \"08:00\", \"workEnd\": \"16:00\"}";

        mockMvc.perform(post("/api/schedule/delivery/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "DRIVER")
    void getMySchedules_shouldReturnListOfSchedules() throws Exception {
        DriverScheduleResponse schedule1 = new DriverScheduleResponse(
                UUID.randomUUID(),
                "1234567890",
                "John Doe",
                1,
                null,
                LocalTime.of(8, 0),
                LocalTime.of(16, 0),
                "ZONE_A",
                10,
                true,
                true,
                "Morning deliveries",
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        DriverScheduleResponse schedule2 = new DriverScheduleResponse(
                UUID.randomUUID(),
                "1234567890",
                "John Doe",
                3,
                null,
                LocalTime.of(14, 0),
                LocalTime.of(22, 0),
                "ZONE_B",
                10,
                true,
                true,
                "Evening deliveries",
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        when(driverScheduleService.getMySchedules()).thenReturn(List.of(schedule1, schedule2));

        mockMvc.perform(get("/api/schedule/delivery/get")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].dayOfWeek").value(1))
                .andExpect(jsonPath("$[1].dayOfWeek").value(3))
                .andExpect(jsonPath("$.length()").value(2));

        verify(driverScheduleService, times(1)).getMySchedules();
    }

    @Test
    @WithMockUser(roles = "DRIVER")
    void getMySchedules_shouldReturnEmptyListWhenNoSchedules() throws Exception {
        when(driverScheduleService.getMySchedules()).thenReturn(List.of());

        mockMvc.perform(get("/api/schedule/delivery/get")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        verify(driverScheduleService, times(1)).getMySchedules();
    }

    @Test
    @WithMockUser(roles = "DRIVER")
    void update_shouldReturnUpdatedSchedule_whenRequestIsValid() throws Exception {
        DriverScheduleRequest request = new DriverScheduleRequest(
                "1234567890",
                1,
                null,
                LocalTime.of(9, 0),
                LocalTime.of(17, 0),
                "ZONE_C",
                12,
                false,
                "Updated morning deliveries"
        );

        DriverScheduleResponse response = new DriverScheduleResponse(
                scheduleId,
                "1234567890",
                "John Doe",
                1,
                null,
                LocalTime.of(9, 0),
                LocalTime.of(17, 0),
                "ZONE_C",
                12,
                false,
                true,
                "Updated morning deliveries",
                LocalDateTime.now().minusHours(1),
                LocalDateTime.now()
        );

        when(driverScheduleService.update(eq(scheduleId), any(DriverScheduleRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/schedule/delivery/update/" + scheduleId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(scheduleId.toString()))
                .andExpect(jsonPath("$.workStart").value("09:00:00"))
                .andExpect(jsonPath("$.workEnd").value("17:00:00"))
                .andExpect(jsonPath("$.deliveryZone").value("ZONE_C"))
                .andExpect(jsonPath("$.maxDeliveries").value(12))
                .andExpect(jsonPath("$.acceptingDeliveries").value(false));

        verify(driverScheduleService, times(1)).update(eq(scheduleId), any(DriverScheduleRequest.class));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void update_shouldReturnUpdatedSchedule_whenAdminUpdatesSchedule() throws Exception {
        DriverScheduleRequest request = new DriverScheduleRequest(
                "1234567890",
                1,
                null,
                LocalTime.of(10, 0),
                LocalTime.of(18, 0),
                "ZONE_A",
                8,
                true,
                "Admin update"
        );

        DriverScheduleResponse response = new DriverScheduleResponse(
                scheduleId,
                "1234567890",
                "John Doe",
                1,
                null,
                LocalTime.of(10, 0),
                LocalTime.of(18, 0),
                "ZONE_A",
                8,
                true,
                true,
                "Admin update",
                LocalDateTime.now().minusHours(1),
                LocalDateTime.now()
        );

        when(driverScheduleService.update(eq(scheduleId), any(DriverScheduleRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/schedule/delivery/update/" + scheduleId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.maxDeliveries").value(8));

        verify(driverScheduleService, times(1)).update(eq(scheduleId), any(DriverScheduleRequest.class));
    }

    @Test
    @WithMockUser(roles = "DRIVER")
    void remove_shouldReturnSuccessMessage_whenScheduleExists() throws Exception {
        mockMvc.perform(delete("/api/schedule/delivery/remove/" + scheduleId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value("Schedule removed successfully"));

        verify(driverScheduleService, times(1)).remove(scheduleId);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void remove_shouldReturnSuccessMessage_whenAdminRemovesSchedule() throws Exception {
        mockMvc.perform(delete("/api/schedule/delivery/remove/" + scheduleId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value("Schedule removed successfully"));

        verify(driverScheduleService, times(1)).remove(scheduleId);
    }
}
