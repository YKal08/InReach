package com.enterprise.iam_service.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record DoctorResponse(
    String egn,
    String firstName,
    String lastName,
    String address,
    String telephone,
    String description,
    double distanceKm
) {}
