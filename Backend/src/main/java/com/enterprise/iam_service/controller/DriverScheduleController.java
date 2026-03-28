package com.enterprise.iam_service.controller;

import com.enterprise.iam_service.dto.DriverScheduleRequest;
import com.enterprise.iam_service.dto.DriverScheduleResponse;
import com.enterprise.iam_service.service.DriverScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

// ? Base path: /schedule/delivery — matches the spec in hacktuesendpoint.txt.
@RestController
@RequestMapping("api/schedule/delivery")
@RequiredArgsConstructor
public class DriverScheduleController {

    private final DriverScheduleService driverScheduleService;

    // * POST /schedule/delivery/create
    // ! ADMIN: must supply pharmacistEgn in body to target a specific driver.
    // ! DRIVER: pharmacistEgn in body is ignored — schedule is always created for themselves.
    @PostMapping("/create")
    @PreAuthorize("hasRole('Driver')")
    public ResponseEntity<DriverScheduleResponse> create(
            @RequestBody @Valid DriverScheduleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(driverScheduleService.create(request));
    }

    // * GET /schedule/delivery/get
    // * Returns all active schedule entries from the start of the current week onward
    // * for the currently authenticated user.
    @GetMapping("/get")
    @PreAuthorize("hasRole('Driver')")
    public ResponseEntity<List<DriverScheduleResponse>> get() {
        return ResponseEntity.ok(driverScheduleService.getMySchedules());
    }

    // * PUT /schedule/delivery/update/{id}
    // ! DRIVER: can only update their own schedule entries (enforced in service).
    // ! ADMIN: can update any entry.
    @PutMapping("/update/{id}")
    @PreAuthorize("hasRole('Driver')")
    public ResponseEntity<DriverScheduleResponse> update(
            @PathVariable UUID id,
            @RequestBody DriverScheduleRequest request) {
        return ResponseEntity.ok(driverScheduleService.update(id, request));
    }

    // * DELETE /schedule/delivery/remove/{id}
    // ! Soft-delete only — sets active = false, record is preserved for audit.
    // ! DRIVER: can only remove their own schedule entries.
    // ! ADMIN: can remove any entry.
    @DeleteMapping("/remove/{id}")
    @PreAuthorize("hasRole('Driver')")
    public ResponseEntity<String> remove(@PathVariable UUID id) {
        driverScheduleService.remove(id);
        return ResponseEntity.ok("Schedule removed successfully");
    }
}