package com.enterprise.iam_service.controller;

import com.enterprise.iam_service.dto.DoctorScheduleRequest;
import com.enterprise.iam_service.dto.DoctorScheduleResponse;
import com.enterprise.iam_service.service.DoctorScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

// ? Base path: /schedule/doctor — matches the spec in hacktuesendpoint.txt.
// ? @PreAuthorize at the method level allows both ADMIN and DOCTOR roles while
// ?   the service layer enforces ownership for the non-admin path.
@RestController
@RequestMapping("api/schedule/doctor")
@RequiredArgsConstructor
public class DoctorScheduleController {

    private final DoctorScheduleService doctorScheduleService;

    // * POST /schedule/doctor/create
    // ! ADMIN: must supply doctorEgn in body to target a specific doctor.
    // ! DOCTOR: doctorEgn in body is ignored — schedule is always created for themselves.
    @PostMapping("/create")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public ResponseEntity<DoctorScheduleResponse> create(
            @RequestBody @Valid DoctorScheduleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(doctorScheduleService.create(request));
    }

    // * GET /schedule/doctor/get
    // * Returns all active schedule entries from the start of the current week onward
    // * for the currently authenticated user.
    @GetMapping("/get")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public ResponseEntity<List<DoctorScheduleResponse>> get() {
        return ResponseEntity.ok(doctorScheduleService.getMySchedules());
    }

    // * PUT /schedule/doctor/update/{id}
    // ! DOCTOR: can only update their own schedule entries (enforced in service).
    // ! ADMIN: can update any entry.
    @PutMapping("/update/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public ResponseEntity<DoctorScheduleResponse> update(
            @PathVariable UUID id,
            @RequestBody DoctorScheduleRequest request) {
        return ResponseEntity.ok(doctorScheduleService.update(id, request));
    }

    // * DELETE /schedule/doctor/remove/{id}
    // ! Soft-delete only — sets active = false, record is preserved for audit.
    // ! DOCTOR: can only remove their own schedule entries.
    // ! ADMIN: can remove any entry.
    @DeleteMapping("/remove/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public ResponseEntity<String> remove(@PathVariable UUID id) {
        doctorScheduleService.remove(id);
        return ResponseEntity.ok("Schedule removed successfully");
    }
}