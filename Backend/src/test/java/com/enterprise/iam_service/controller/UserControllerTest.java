package com.enterprise.iam_service.controller;

import com.enterprise.iam_service.SecurityConfig;
import com.enterprise.iam_service.dto.DoctorDescriptionUpdateRequest;
import com.enterprise.iam_service.dto.PasswordChangeRequest;
import com.enterprise.iam_service.dto.UserProfileResponse;
import com.enterprise.iam_service.dto.UserProfileUpdateRequest;
import com.enterprise.iam_service.security.JwtAuthenticationFilter;
import com.enterprise.iam_service.service.UserManagementService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Set;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = UserController.class,
        excludeFilters = {
                @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = SecurityConfig.class),
                @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = JwtAuthenticationFilter.class)
        })
@AutoConfigureMockMvc(addFilters = false)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserManagementService userManagementService;

    @Test
    @WithMockUser(username = "user@enterprise.com")
    void getMyProfile_shouldReturnProfile() throws Exception {
        UserProfileResponse response = new UserProfileResponse(
                "1234567890",
                "Ivan",
                "Petrov",
                "Sofia",
                "+359888000111",
                "user@enterprise.com",
                null,
                null,
                false
        );

        when(userManagementService.getUserProfile(anyString())).thenReturn(response);

        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.egn").value("1234567890"))
                .andExpect(jsonPath("$.firstName").value("Ivan"))
                .andExpect(jsonPath("$.lastName").value("Petrov"))
                .andExpect(jsonPath("$.address").value("Sofia"))
                .andExpect(jsonPath("$.telephone").value("+359888000111"))
                .andExpect(jsonPath("$.email").value("user@enterprise.com"))
                .andExpect(jsonPath("$.doctor").value(false))
                .andExpect(jsonPath("$.description").doesNotExist());
    }

    @Test
    @WithMockUser(username = "user@enterprise.com")
    void updateMyProfile_shouldReturnSuccessMessage() throws Exception {
        UserProfileUpdateRequest request = new UserProfileUpdateRequest(
                "UpdatedFirst",
                "UpdatedLast",
                "Plovdiv",
                "+359888111222",
                "updated@enterprise.com",
                null
        );

        mockMvc.perform(patch("/api/users/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value("Profile updated successfully"));

        verify(userManagementService, times(1))
                .updateProfileByEmail("user@enterprise.com", request);
    }

    @Test
    @WithMockUser(username = "user@enterprise.com")
    void changePassword_shouldReturnSuccessMessage() throws Exception {
        PasswordChangeRequest request = new PasswordChangeRequest("OldPass1", "NewPass2");

        mockMvc.perform(post("/api/users/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value("Password updated successfully"));

        verify(userManagementService, times(1))
                .changePasswordByEmail("user@enterprise.com", "OldPass1", "NewPass2");
    }

    @Test
    @WithMockUser(username = "doctor@enterprise.com")
    void updateDoctorDescription_shouldReturnSuccessMessage() throws Exception {
        DoctorDescriptionUpdateRequest request = new DoctorDescriptionUpdateRequest("Specialist in internal medicine");

        mockMvc.perform(patch("/api/users/me/description")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value("Description updated successfully"));

        verify(userManagementService, times(1))
                .updateDoctorDescriptionByEmail("doctor@enterprise.com", "Specialist in internal medicine");
    }

    @Test
    @WithMockUser(username = "user@enterprise.com")
    void getNearbyDoctors_shouldReturnDoctorList() throws Exception {
        var firstDoctor = new com.enterprise.iam_service.dto.DoctorResponse(
                "2000000000",
                "Near",
                "Doctor",
                "Sofia",
                "+359888000000",
                "General practice",
                0.0
        );
        var secondDoctor = new com.enterprise.iam_service.dto.DoctorResponse(
                "2000000001",
                "Far",
                "Doctor",
                "Plovdiv",
                "+359888000001",
                "Cardiologist",
                85.0
        );

        when(userManagementService.getNearbyDoctors(anyString()))
                .thenReturn(List.of(firstDoctor, secondDoctor));

        mockMvc.perform(get("/api/users/doctors/nearby"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].egn").value("2000000000"))
                .andExpect(jsonPath("$[0].firstName").value("Near"))
                .andExpect(jsonPath("$[0].lastName").value("Doctor"))
                .andExpect(jsonPath("$[0].address").value("Sofia"))
                .andExpect(jsonPath("$[0].telephone").value("+359888000000"))
                .andExpect(jsonPath("$[0].description").value("General practice"))
                .andExpect(jsonPath("$[0].distanceKm").value(0.0))
                .andExpect(jsonPath("$[1].egn").value("2000000001"));

        verify(userManagementService, times(1)).getNearbyDoctors("user@enterprise.com");
    }
}
