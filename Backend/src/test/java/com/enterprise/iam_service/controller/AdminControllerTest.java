package com.enterprise.iam_service.controller;

import com.enterprise.iam_service.SecurityConfig;
import com.enterprise.iam_service.dto.AssignUserRoleRequest;
import com.enterprise.iam_service.dto.RoleRequest;
import com.enterprise.iam_service.dto.RoleResponse;
import com.enterprise.iam_service.dto.UserRoleUpdateResponse;
import com.enterprise.iam_service.model.User;
import com.enterprise.iam_service.security.JwtAuthenticationFilter;
import com.enterprise.iam_service.service.AdminDashboardService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.http.MediaType;
import org.springframework.context.annotation.FilterType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

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

@WebMvcTest(controllers = AdminController.class,
        excludeFilters = {
                @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = SecurityConfig.class),
                @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = JwtAuthenticationFilter.class)
        })
@AutoConfigureMockMvc(addFilters = false)
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

        @MockBean
    private AdminDashboardService adminDashboardService;

    @Test
    void getAllUsers_shouldReturnUsers() throws Exception {
        User user = new User();
        user.setEgn("0882345690");
        user.setEmail("user@enterprise.com");

        when(adminDashboardService.getAllUsers()).thenReturn(List.of(user));

        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].egn").value("0882345690"));
    }

    @Test
    void getLockedUsers_shouldReturnLockedUsers() throws Exception {
        User user = new User();
        user.setEgn("0882345690");
        user.setStatus("LOCKED");

        when(adminDashboardService.getLockedUsers()).thenReturn(List.of(user));

        mockMvc.perform(get("/api/admin/users/locked"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("LOCKED"));
    }

    @Test
    void getPendingUsers_shouldReturnPendingUsers() throws Exception {
        User user = new User();
        user.setEgn("0882345690");
        user.setStatus("PENDING");

        when(adminDashboardService.getPendingUsers()).thenReturn(List.of(user));

        mockMvc.perform(get("/api/admin/users/pending"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("PENDING"));
    }

    @Test
    void activateUser_shouldReturnSuccessMessage() throws Exception {
        when(adminDashboardService.activateUser("0882345690")).thenReturn("User activated: user@enterprise.com");

        mockMvc.perform(post("/api/admin/users/0882345690/activate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value("User activated: user@enterprise.com"));
    }

    @Test
    void lockUser_shouldReturnSuccessMessage() throws Exception {
        when(adminDashboardService.lockUser("0882345690")).thenReturn("User locked: user@enterprise.com");

        mockMvc.perform(post("/api/admin/users/0882345690/lock"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value("User locked: user@enterprise.com"));
    }

    @Test
    void deleteUser_shouldReturnSuccessMessage() throws Exception {
        mockMvc.perform(delete("/api/admin/users/0882345690"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value("User deleted."));

        verify(adminDashboardService, times(1)).deleteUser("0882345690");
    }

    @Test
    void setUserRole_shouldReturnUpdatedRoles() throws Exception {
        AssignUserRoleRequest request = new AssignUserRoleRequest("Doctor");

        when(adminDashboardService.assignUserRole(eq("0882345690"), any(AssignUserRoleRequest.class)))
                .thenReturn(new UserRoleUpdateResponse("Role assigned successfully", "0882345690", List.of("Doctor")));

        mockMvc.perform(put("/api/admin/users/0882345690/role")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roles[0]").value("Doctor"));
    }

    @Test
    void addUserRole_shouldReturnUpdatedRoles() throws Exception {
        AssignUserRoleRequest request = new AssignUserRoleRequest("Doctor");

        when(adminDashboardService.addUserRole(eq("0882345690"), any(AssignUserRoleRequest.class)))
                .thenReturn(new UserRoleUpdateResponse("Role added successfully", "0882345690", List.of("Patient", "Doctor")));

        mockMvc.perform(post("/api/admin/users/0882345690/role")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roles[1]").value("Doctor"));
    }

    @Test
    void removeUserRole_shouldReturnUpdatedRoles() throws Exception {
        AssignUserRoleRequest request = new AssignUserRoleRequest("Doctor");

        when(adminDashboardService.removeUserRole(eq("0882345690"), any(AssignUserRoleRequest.class)))
                .thenReturn(new UserRoleUpdateResponse("Role removed successfully", "0882345690", List.of("Patient")));

        mockMvc.perform(delete("/api/admin/users/0882345690/role")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roles[0]").value("Patient"));
    }

    @Test
    void getAllRolesWithoutAdmin_shouldReturnRoles() throws Exception {
        when(adminDashboardService.getAllNonAdminRoles())
                .thenReturn(List.of(new RoleResponse(2L, "Doctor", "Doctor role")));

        mockMvc.perform(get("/api/admin/roles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Doctor"));
    }

    @Test
    void createRole_shouldReturnCreatedRole() throws Exception {
        RoleRequest request = new RoleRequest("Nurse", "Nurse role");

        when(adminDashboardService.createRole(any(RoleRequest.class)))
                .thenReturn(new RoleResponse(3L, "Nurse", "Nurse role"));

        mockMvc.perform(post("/api/admin/roles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Nurse"));
    }

    @Test
    void createRole_shouldReturnBadRequest_whenBodyIsMissing() throws Exception {
        mockMvc.perform(post("/api/admin/roles")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }
}
