package com.enterprise.iam_service.controller;

import com.enterprise.iam_service.SecurityConfig;
import com.enterprise.iam_service.dto.PasswordChangeRequest;
import com.enterprise.iam_service.dto.UserProfileResponse;
import com.enterprise.iam_service.security.JwtAuthenticationFilter;
import com.enterprise.iam_service.service.UserManagementService;
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

import java.time.LocalDateTime;
import java.util.Set;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
                "user@enterprise.com",
                "ACTIVE",
                Set.of("Patient"),
                LocalDateTime.of(2026, 3, 27, 10, 0)
        );

        when(userManagementService.getUserProfile(anyString())).thenReturn(response);

        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("user@enterprise.com"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
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
}
