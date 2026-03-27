package com.enterprise.iam_service.controller;

import com.enterprise.iam_service.SecurityConfig;
import com.enterprise.iam_service.dto.AuthResponse;
import com.enterprise.iam_service.dto.LoginRequest;
import com.enterprise.iam_service.dto.RegisterRequest;
import com.enterprise.iam_service.security.JwtAuthenticationFilter;
import com.enterprise.iam_service.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AuthController.class,
        excludeFilters = {
                @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = SecurityConfig.class),
                @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = JwtAuthenticationFilter.class)
        })
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @Test
    void register_shouldReturnAccessToken_whenRequestIsValid() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "0882345690",
                "John",
                "Doe",
                "Some address",
                "+359888111222",
                "john@doe.com",
                "StrongPass1"
        );

        when(authService.register(any(RegisterRequest.class))).thenReturn(new AuthResponse("token-123"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("token-123"));

        verify(authService, times(1)).register(any(RegisterRequest.class));
    }

    @Test
    void register_shouldReturnBadRequest_whenEmailIsInvalid() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "0882345690",
                "John",
                "Doe",
                "Some address",
                "+359888111222",
                "not-an-email",
                "StrongPass1"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_shouldReturnAccessToken_whenCredentialsAreValid() throws Exception {
        LoginRequest request = new LoginRequest("john@doe.com", "StrongPass1");

        when(authService.authenticate(any(LoginRequest.class))).thenReturn(new AuthResponse("jwt-token"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("jwt-token"));

        verify(authService, times(1)).authenticate(any(LoginRequest.class));
    }
}
