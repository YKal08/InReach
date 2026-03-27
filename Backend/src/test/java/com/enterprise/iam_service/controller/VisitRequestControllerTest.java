package com.enterprise.iam_service.controller;

import com.enterprise.iam_service.SecurityConfig;
import com.enterprise.iam_service.dto.CancelVisitRequestRequest;
import com.enterprise.iam_service.dto.CreateVisitRequestRequest;
import com.enterprise.iam_service.dto.VisitRequestResponse;
import com.enterprise.iam_service.security.JwtAuthenticationFilter;
import com.enterprise.iam_service.service.VisitRequestService;
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

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = VisitRequestController.class,
        excludeFilters = {
                @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = SecurityConfig.class),
                @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = JwtAuthenticationFilter.class)
        })
@AutoConfigureMockMvc(addFilters = false)
class VisitRequestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

        @MockBean
    private VisitRequestService visitRequestService;

    @Test
    @WithMockUser(username = "user@enterprise.com")
    void create_shouldReturnCreatedVisitRequest() throws Exception {
        CreateVisitRequestRequest request = new CreateVisitRequestRequest("Sofia, Center", "GP", "Needs checkup");
        UUID requestId = UUID.randomUUID();

        VisitRequestResponse response = new VisitRequestResponse(
                requestId,
                "Sofia, Center",
                "GP",
                "1111111111",
                "PENDING",
                "Needs checkup"
        );

        when(visitRequestService.create(anyString(), eq("1111111111"), any(CreateVisitRequestRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/visit_request/create/1111111111")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(requestId.toString()))
                .andExpect(jsonPath("$.doctorEgn").value("1111111111"))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    @WithMockUser(username = "user@enterprise.com")
    void create_shouldReturnBadRequest_whenAddressIsBlank() throws Exception {
        String invalidBody = """
                {
                  "address": "",
                  "doctorType": "GP",
                  "notes": "x"
                }
                """;

        mockMvc.perform(post("/api/visit_request/create/1111111111")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidBody))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "user@enterprise.com")
    void get_shouldReturnUserVisitRequests() throws Exception {
        when(visitRequestService.getMyRequests("user@enterprise.com")).thenReturn(List.of(
                new VisitRequestResponse(UUID.randomUUID(), "Address 1", "GP", "1111111111", "PENDING", "Note 1")
        ));

        mockMvc.perform(get("/api/visit_request/get"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].doctorType").value("GP"));
    }

    @Test
    @WithMockUser(username = "user@enterprise.com")
    void cancel_shouldReturnSuccessMessage() throws Exception {
        UUID requestId = UUID.randomUUID();
        CancelVisitRequestRequest request = new CancelVisitRequestRequest(requestId);

        mockMvc.perform(post("/api/visit_request/cancel")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value("Visit request cancelled"));

        verify(visitRequestService, times(1)).cancel(eq("user@enterprise.com"), eq(requestId));
    }
}
