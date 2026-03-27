package com.enterprise.iam_service.controller;

import com.enterprise.iam_service.SecurityConfig;
import com.enterprise.iam_service.dto.DoctorScheduleRequest;
import com.enterprise.iam_service.dto.DoctorScheduleResponse;
import com.enterprise.iam_service.security.JwtAuthenticationFilter;
import com.enterprise.iam_service.service.DoctorScheduleService;
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

@WebMvcTest(controllers = DoctorScheduleController.class,
        excludeFilters = {
                @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = SecurityConfig.class),
                @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = JwtAuthenticationFilter.class)
        })
@AutoConfigureMockMvc(addFilters = false)
class DoctorScheduleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private DoctorScheduleService doctorScheduleService;

    private UUID scheduleId = UUID.randomUUID();

    @Test
    @WithMockUser(roles = "DOCTOR")
    void create_shouldReturnCreatedSchedule_whenRequestIsValid() throws Exception {
        DoctorScheduleRequest request = new DoctorScheduleRequest(
                "1234567890",
                1,
                null,
                LocalTime.of(8, 0),
                LocalTime.of(16, 0),
                10,
                true,
                "Morning shift"
        );

        DoctorScheduleResponse response = new DoctorScheduleResponse(
                scheduleId,
                "1234567890",
                "John Doe",
                1,
                null,
                LocalTime.of(8, 0),
                LocalTime.of(16, 0),
                10,
                true,
                true,
                "Morning shift",
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        when(doctorScheduleService.create(any(DoctorScheduleRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/schedule/doctor/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(scheduleId.toString()))
                .andExpect(jsonPath("$.doctorEgn").value("1234567890"))
                .andExpect(jsonPath("$.dayOfWeek").value(1))
                .andExpect(jsonPath("$.workStart").value("08:00:00"))
                .andExpect(jsonPath("$.workEnd").value("16:00:00"))
                .andExpect(jsonPath("$.maxRequests").value(10))
                .andExpect(jsonPath("$.acceptingRequests").value(true));

        verify(doctorScheduleService, times(1)).create(any(DoctorScheduleRequest.class));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_shouldReturnCreatedSchedule_whenAdminCreatesScheduleForDoctor() throws Exception {
        DoctorScheduleRequest request = new DoctorScheduleRequest(
                "0987654321",
                2,
                null,
                LocalTime.of(14, 0),
                LocalTime.of(22, 0),
                15,
                true,
                "Evening shift"
        );

        DoctorScheduleResponse response = new DoctorScheduleResponse(
                scheduleId,
                "0987654321",
                "Jane Smith",
                2,
                null,
                LocalTime.of(14, 0),
                LocalTime.of(22, 0),
                15,
                true,
                true,
                "Evening shift",
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        when(doctorScheduleService.create(any(DoctorScheduleRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/schedule/doctor/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.doctorEgn").value("0987654321"));

        verify(doctorScheduleService, times(1)).create(any(DoctorScheduleRequest.class));
    }

    @Test
    @WithMockUser(roles = "DOCTOR")
    void create_shouldReturnBadRequest_whenDayOfWeekIsInvalid() throws Exception {
        DoctorScheduleRequest request = new DoctorScheduleRequest(
                "1234567890",
                8, // Invalid: must be 1-7
                null,
                LocalTime.of(8, 0),
                LocalTime.of(16, 0),
                10,
                true,
                "Invalid day"
        );

        mockMvc.perform(post("/api/schedule/doctor/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "DOCTOR")
    void create_shouldReturnBadRequest_whenDayOfWeekIsMissing() throws Exception {
        String requestJson = "{\"doctorEgn\": \"1234567890\", \"workStart\": \"08:00\", \"workEnd\": \"16:00\"}";

        mockMvc.perform(post("/api/schedule/doctor/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "DOCTOR")
    void getMySchedules_shouldReturnListOfSchedules() throws Exception {
        DoctorScheduleResponse schedule1 = new DoctorScheduleResponse(
                UUID.randomUUID(),
                "1234567890",
                "John Doe",
                1,
                null,
                LocalTime.of(8, 0),
                LocalTime.of(16, 0),
                10,
                true,
                true,
                "Morning shift",
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        DoctorScheduleResponse schedule2 = new DoctorScheduleResponse(
                UUID.randomUUID(),
                "1234567890",
                "John Doe",
                3,
                null,
                LocalTime.of(14, 0),
                LocalTime.of(22, 0),
                10,
                true,
                true,
                "Evening shift",
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        when(doctorScheduleService.getMySchedules()).thenReturn(List.of(schedule1, schedule2));

        mockMvc.perform(get("/api/schedule/doctor/get")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].dayOfWeek").value(1))
                .andExpect(jsonPath("$[1].dayOfWeek").value(3))
                .andExpect(jsonPath("$.length()").value(2));

        verify(doctorScheduleService, times(1)).getMySchedules();
    }

    @Test
    @WithMockUser(roles = "DOCTOR")
    void getMySchedules_shouldReturnEmptyListWhenNoSchedules() throws Exception {
        when(doctorScheduleService.getMySchedules()).thenReturn(List.of());

        mockMvc.perform(get("/api/schedule/doctor/get")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        verify(doctorScheduleService, times(1)).getMySchedules();
    }

    @Test
    @WithMockUser(roles = "DOCTOR")
    void update_shouldReturnUpdatedSchedule_whenRequestIsValid() throws Exception {
        DoctorScheduleRequest request = new DoctorScheduleRequest(
                "1234567890",
                1,
                null,
                LocalTime.of(9, 0),
                LocalTime.of(17, 0),
                12,
                false,
                "Updated morning shift"
        );

        DoctorScheduleResponse response = new DoctorScheduleResponse(
                scheduleId,
                "1234567890",
                "John Doe",
                1,
                null,
                LocalTime.of(9, 0),
                LocalTime.of(17, 0),
                12,
                false,
                true,
                "Updated morning shift",
                LocalDateTime.now().minusHours(1),
                LocalDateTime.now()
        );

        when(doctorScheduleService.update(eq(scheduleId), any(DoctorScheduleRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/schedule/doctor/update/" + scheduleId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(scheduleId.toString()))
                .andExpect(jsonPath("$.workStart").value("09:00:00"))
                .andExpect(jsonPath("$.workEnd").value("17:00:00"))
                .andExpect(jsonPath("$.maxRequests").value(12))
                .andExpect(jsonPath("$.acceptingRequests").value(false));

        verify(doctorScheduleService, times(1)).update(eq(scheduleId), any(DoctorScheduleRequest.class));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void update_shouldReturnUpdatedSchedule_whenAdminUpdatesSchedule() throws Exception {
        DoctorScheduleRequest request = new DoctorScheduleRequest(
                "1234567890",
                1,
                null,
                LocalTime.of(10, 0),
                LocalTime.of(18, 0),
                8,
                true,
                "Admin update"
        );

        DoctorScheduleResponse response = new DoctorScheduleResponse(
                scheduleId,
                "1234567890",
                "John Doe",
                1,
                null,
                LocalTime.of(10, 0),
                LocalTime.of(18, 0),
                8,
                true,
                true,
                "Admin update",
                LocalDateTime.now().minusHours(1),
                LocalDateTime.now()
        );

        when(doctorScheduleService.update(eq(scheduleId), any(DoctorScheduleRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/schedule/doctor/update/" + scheduleId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.maxRequests").value(8));

        verify(doctorScheduleService, times(1)).update(eq(scheduleId), any(DoctorScheduleRequest.class));
    }

    @Test
    @WithMockUser(roles = "DOCTOR")
    void remove_shouldReturnSuccessMessage_whenScheduleExists() throws Exception {
        mockMvc.perform(delete("/api/schedule/doctor/remove/" + scheduleId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value("Schedule removed successfully"));

        verify(doctorScheduleService, times(1)).remove(scheduleId);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void remove_shouldReturnSuccessMessage_whenAdminRemovesSchedule() throws Exception {
        mockMvc.perform(delete("/api/schedule/doctor/remove/" + scheduleId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value("Schedule removed successfully"));

        verify(doctorScheduleService, times(1)).remove(scheduleId);
    }
}
