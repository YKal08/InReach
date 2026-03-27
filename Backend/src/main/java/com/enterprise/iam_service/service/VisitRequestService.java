package com.enterprise.iam_service.service;

import com.enterprise.iam_service.dto.CreateVisitRequestRequest;
import com.enterprise.iam_service.dto.VisitRequestResponse;
import com.enterprise.iam_service.model.User;
import com.enterprise.iam_service.model.VisitRequest;
import com.enterprise.iam_service.repository.UserRepository;
import com.enterprise.iam_service.repository.VisitRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VisitRequestService {

    private final VisitRequestRepository visitRequestRepository;
    private final UserRepository userRepository;

    public VisitRequestResponse create(String patientEmail, String doctorEgn, CreateVisitRequestRequest request) {
        User patient = getUserByEmail(patientEmail);
        User doctor = getDoctorByEgn(doctorEgn);

        VisitRequest visitRequest = VisitRequest.builder()
                .user(patient)
                .address(request.address())
                .doctorType(request.doctorType())
                .notes(request.notes())
                .doctorEgn(doctor.getEgn())
                .status("PENDING")
                .build();

        VisitRequest saved = visitRequestRepository.save(visitRequest);
        return toResponse(saved);
    }

    public List<VisitRequestResponse> getMyRequests(String email) {
        User user = getUserByEmail(email);
        return visitRequestRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public void cancel(String email, UUID requestId) {
        User user = getUserByEmail(email);

        VisitRequest visitRequest = visitRequestRepository.findByIdAndUser(requestId, user)
                .orElseThrow(() -> new RuntimeException("Visit request not found"));

        visitRequest.setStatus("CANCELLED");
        visitRequestRepository.save(visitRequest);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private User getDoctorByEgn(String doctorEgn) {
        User doctor = userRepository.findById(doctorEgn)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        boolean hasDoctorRole = doctor.getRoles().stream()
                .anyMatch(role -> "DOCTOR".equals(role.getName().toUpperCase(Locale.ROOT)));

        if (!hasDoctorRole) {
            throw new RuntimeException("Selected user is not a doctor");
        }

        return doctor;
    }

    private VisitRequestResponse toResponse(VisitRequest visitRequest) {
        return new VisitRequestResponse(
                visitRequest.getId(),
                visitRequest.getAddress(),
                visitRequest.getDoctorType(),
            visitRequest.getDoctorEgn(),
                visitRequest.getStatus(),
                visitRequest.getNotes()
        );
    }
}
