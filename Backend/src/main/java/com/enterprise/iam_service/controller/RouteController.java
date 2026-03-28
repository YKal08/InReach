package com.enterprise.iam_service.controller;

import com.enterprise.iam_service.dto.VisitPlanResponse;
import com.enterprise.iam_service.service.RoutePlanningService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/routes")
@RequiredArgsConstructor
public class RouteController {

    private final RoutePlanningService routePlanningService;

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('Doctor','Driver')")
    public ResponseEntity<List<VisitPlanResponse>> getMyPlans(@RequestParam(required = false) LocalDate date) {
        return ResponseEntity.ok(routePlanningService.getMyPlans(date));
    }

    @PostMapping("/my/generate-draft")
    @PreAuthorize("hasRole('Doctor')")
    public ResponseEntity<VisitPlanResponse> generateMyDraftPlan(
            @RequestParam(required = false) LocalDate date,
            @RequestParam(defaultValue = "false") boolean force
    ) {
        return ResponseEntity.ok(routePlanningService.generateMyDraftPlan(date, force));
    }

    @GetMapping("/{routeId}")
    @PreAuthorize("hasAnyRole('Doctor','Driver')")
    public ResponseEntity<VisitPlanResponse> getRoute(@PathVariable UUID routeId) {
        return ResponseEntity.ok(routePlanningService.getRouteWithStops(routeId));
    }

    @PostMapping("/{routeId}/confirm")
    @PreAuthorize("hasRole('Doctor')")
    public ResponseEntity<VisitPlanResponse> confirmMyPlan(@PathVariable UUID routeId) {
        return ResponseEntity.ok(routePlanningService.confirmMyPlan(routeId));
    }

    @PostMapping("/{routeId}/cancel")
    @PreAuthorize("hasRole('Doctor')")
    public ResponseEntity<VisitPlanResponse> cancelMyPlan(@PathVariable UUID routeId) {
        return ResponseEntity.ok(routePlanningService.cancelMyPlan(routeId));
    }
}
