package com.enterprise.iam_service.controller;

import com.enterprise.iam_service.SecurityConfig;
import com.enterprise.iam_service.dto.VisitPlanResponse;
import com.enterprise.iam_service.security.JwtAuthenticationFilter;
import com.enterprise.iam_service.service.RoutePlanningService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = RouteController.class,
        excludeFilters = {
                @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = SecurityConfig.class),
                @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = JwtAuthenticationFilter.class)
        })
@AutoConfigureMockMvc(addFilters = false)
class RouteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RoutePlanningService routePlanningService;

    @Test
    @WithMockUser(roles = "DOCTOR")
    void getMyPlans_shouldReturnDoctorPlans() throws Exception {
        UUID routeId = UUID.randomUUID();
        VisitPlanResponse response = new VisitPlanResponse(
                routeId,
                "1111111111",
                "Doc Tor",
                LocalDate.of(2026, 3, 29),
                "DRAFT",
                LocalDateTime.of(2026, 3, 28, 12, 0),
                List.of()
        );

        when(routePlanningService.getMyPlans(LocalDate.of(2026, 3, 29))).thenReturn(List.of(response));

        mockMvc.perform(get("/api/routes/my").param("date", "2026-03-29"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].planId").value(routeId.toString()))
                .andExpect(jsonPath("$[0].doctorEgn").value("1111111111"))
                .andExpect(jsonPath("$[0].status").value("DRAFT"));

        verify(routePlanningService).getMyPlans(LocalDate.of(2026, 3, 29));
    }

    @Test
    @WithMockUser(roles = "DOCTOR")
    void generateMyDraftPlan_shouldPassDateAndForceFlag() throws Exception {
        UUID routeId = UUID.randomUUID();
        VisitPlanResponse response = new VisitPlanResponse(
                routeId,
                "1111111111",
                "Doc Tor",
                LocalDate.of(2026, 3, 29),
                "DRAFT",
                LocalDateTime.of(2026, 3, 28, 12, 0),
                List.of()
        );

        when(routePlanningService.generateMyDraftPlan(LocalDate.of(2026, 3, 29), true)).thenReturn(response);

        mockMvc.perform(post("/api/routes/my/generate-draft")
                        .param("date", "2026-03-29")
                        .param("force", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.planId").value(routeId.toString()))
                .andExpect(jsonPath("$.targetDate").value("2026-03-29"));

        verify(routePlanningService).generateMyDraftPlan(LocalDate.of(2026, 3, 29), true);
    }

    @Test
    @WithMockUser(roles = "DOCTOR")
    void confirmMyPlan_shouldReturnConfirmedPlan() throws Exception {
        UUID routeId = UUID.randomUUID();
        VisitPlanResponse response = new VisitPlanResponse(
                routeId,
                "1111111111",
                "Doc Tor",
                LocalDate.of(2026, 3, 29),
                "CONFIRMED",
                LocalDateTime.of(2026, 3, 28, 12, 0),
                List.of()
        );

        when(routePlanningService.confirmMyPlan(routeId)).thenReturn(response);

        mockMvc.perform(post("/api/routes/{routeId}/confirm", routeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));

        verify(routePlanningService).confirmMyPlan(eq(routeId));
    }
}
