package com.enterprise.iam_service.controller;

import com.enterprise.iam_service.dto.CancelVisitRequestRequest;
import com.enterprise.iam_service.dto.CreateVisitRequestRequest;
import com.enterprise.iam_service.dto.VisitRequestResponse;
import com.enterprise.iam_service.service.VisitRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/visit_request")
@RequiredArgsConstructor
public class VisitRequestController {

    private final VisitRequestService visitRequestService;

    @PostMapping("/create/{doctorEgn}")
    public ResponseEntity<VisitRequestResponse> create(
            @PathVariable String doctorEgn,
            @RequestBody @Valid CreateVisitRequestRequest request
    ) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(visitRequestService.create(email, doctorEgn, request));
    }

    @GetMapping("/get")
    public ResponseEntity<List<VisitRequestResponse>> get() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(visitRequestService.getMyRequests(email));
    }

    @PostMapping("/cancel")
    public ResponseEntity<String> cancel(@RequestBody @Valid CancelVisitRequestRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        visitRequestService.cancel(email, request.requestId());
        return ResponseEntity.ok("Visit request cancelled");
    }
}
