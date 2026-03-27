package com.enterprise.iam_service.service;

import com.enterprise.iam_service.dto.DoctorScheduleRequest;
import com.enterprise.iam_service.dto.DoctorScheduleResponse;
import com.enterprise.iam_service.model.DoctorSchedule;
import com.enterprise.iam_service.model.User;
import com.enterprise.iam_service.repository.DoctorScheduleRepository;
import com.enterprise.iam_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DoctorScheduleService {

    private final DoctorScheduleRepository doctorScheduleRepository;
    private final UserRepository userRepository;

    // * Business Logic: Creates a new schedule entry for a doctor.
    // ! ADMIN can specify any doctorEgn in the request body.
    // ! A DOCTOR calling this endpoint always creates a schedule for themselves —
    // !   the doctorEgn field in the request is ignored for non-admins.
    public DoctorScheduleResponse create(DoctorScheduleRequest request) {
        User doctor = resolveTargetDoctor(request.doctorEgn());

        // ! Guard: Prevent duplicate schedule entries for the same doctor + day combination.
        doctorScheduleRepository.findByDoctorAndDayOfWeek(doctor, request.dayOfWeek())
            .ifPresent(existing -> {
                if (existing.getActive()) {
                    throw new RuntimeException(
                        "An active schedule already exists for this doctor on day " + request.dayOfWeek() +
                        ". Use /update to modify it."
                    );
                }
            });

        DoctorSchedule schedule = DoctorSchedule.builder()
            .doctor(doctor)
            .dayOfWeek(request.dayOfWeek())
            .specificDate(request.specificDate())
            .workStart(request.workStart())
            .workEnd(request.workEnd())
            .maxRequests(request.maxRequests() != null ? request.maxRequests() : 10)
            .acceptingRequests(request.acceptingRequests() != null ? request.acceptingRequests() : true)
            .notes(request.notes())
            .build();

        return toResponse(doctorScheduleRepository.save(schedule));
    }

    // * Business Logic: Returns all ACTIVE schedule entries from the start of the current week
    // * onward for the calling user. The "current week" is anchored to the most recent Monday.
    public List<DoctorScheduleResponse> getMySchedules() {
        User caller = getCallerUser();

        // * Determine Monday of the current week as the lower-bound filter.
        LocalDate startOfWeek = LocalDate.now().with(DayOfWeek.MONDAY);

        return doctorScheduleRepository.findByDoctor(caller).stream()
            .filter(s -> s.getActive())
            // * Include entries with no specific date (recurring weekly templates always shown)
            // * OR specific-date overrides that fall on or after the start of the current week.
            .filter(s -> s.getSpecificDate() == null || !s.getSpecificDate().isBefore(startOfWeek))
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    // * Business Logic: Updates mutable fields on an existing schedule entry.
    // ! Ownership check: a DOCTOR can only update their own entries.
    // ! An ADMIN can update any entry.
    public DoctorScheduleResponse update(UUID scheduleId, DoctorScheduleRequest request) {
        DoctorSchedule schedule = doctorScheduleRepository.findById(scheduleId)
            .orElseThrow(() -> new RuntimeException("Schedule not found"));

        assertOwnershipOrAdmin(schedule.getDoctor());

        // * Apply partial updates — only overwrite fields that are present in the request.
        if (request.dayOfWeek() != null)         schedule.setDayOfWeek(request.dayOfWeek());
        if (request.specificDate() != null)       schedule.setSpecificDate(request.specificDate());
        if (request.workStart() != null)          schedule.setWorkStart(request.workStart());
        if (request.workEnd() != null)            schedule.setWorkEnd(request.workEnd());
        if (request.maxRequests() != null)        schedule.setMaxRequests(request.maxRequests());
        if (request.acceptingRequests() != null)  schedule.setAcceptingRequests(request.acceptingRequests());
        if (request.notes() != null)              schedule.setNotes(request.notes());

        return toResponse(doctorScheduleRepository.save(schedule));
    }

    // * Business Logic: Soft-removes a schedule by flipping active → false.
    // ! The record is retained in the DB for audit purposes but excluded from all active queries.
    public void remove(UUID scheduleId) {
        DoctorSchedule schedule = doctorScheduleRepository.findById(scheduleId)
            .orElseThrow(() -> new RuntimeException("Schedule not found"));

        assertOwnershipOrAdmin(schedule.getDoctor());

        schedule.setActive(false);
        doctorScheduleRepository.save(schedule);
    }

    // ---------------------------------------------------------------------------
    // Private helpers
    // ---------------------------------------------------------------------------

    // * Resolves which doctor the operation targets.
    // ! ADMIN: looks up user by the EGN supplied in the request (required for admins).
    // ! DOCTOR: always resolves to themselves — the EGN in the request is ignored.
    private User resolveTargetDoctor(String doctorEgn) {
        if (isAdmin()) {
            if (doctorEgn == null || doctorEgn.isBlank()) {
                throw new RuntimeException("ADMIN must supply doctorEgn in the request body");
            }
            return userRepository.findById(doctorEgn)
                .orElseThrow(() -> new RuntimeException("Doctor not found for EGN: " + doctorEgn));
        }
        // * Non-admin path: resolve from the authenticated session.
        return getCallerUser();
    }

    // * Fetches the full User entity for the currently authenticated principal.
    private User getCallerUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    // * Returns true if the caller holds the ADMIN role.
    private boolean isAdmin() {
        return SecurityContextHolder.getContext().getAuthentication()
            .getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"));
    }

    // ! Security: Throws 403-equivalent if a non-admin tries to touch another user's schedule.
    private void assertOwnershipOrAdmin(User scheduleOwner) {
        if (isAdmin()) return;
        User caller = getCallerUser();
        if (!caller.getEgn().equals(scheduleOwner.getEgn())) {
            throw new org.springframework.security.access.AccessDeniedException(
                "You do not have permission to modify this schedule"
            );
        }
    }

    // * Maps the JPA entity to a clean response DTO.
    private DoctorScheduleResponse toResponse(DoctorSchedule s) {
        return new DoctorScheduleResponse(
            s.getId(),
            s.getDoctor().getEgn(),
            s.getDoctor().getFirstName() + " " + s.getDoctor().getLastName(),
            s.getDayOfWeek(),
            s.getSpecificDate(),
            s.getWorkStart(),
            s.getWorkEnd(),
            s.getMaxRequests(),
            s.getAcceptingRequests(),
            s.getActive(),
            s.getNotes(),
            s.getCreatedAt(),
            s.getUpdatedAt()
        );
    }
}