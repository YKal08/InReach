package com.enterprise.iam_service.service;

import com.enterprise.iam_service.model.User;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class GoogleGeocodingService {

    private static final String GOOGLE_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";

    @Value("${google.maps.api-key:}")
    private String googleMapsApiKey;

    private final ObjectMapper objectMapper;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    public void geocodeAndApplyToUser(User user, String rawAddress) {
        user.setRawAddress(rawAddress);

        if (rawAddress == null || rawAddress.isBlank()) {
            clearCoordinates(user);
            return;
        }

        if (googleMapsApiKey == null || googleMapsApiKey.isBlank()) {
            clearCoordinates(user);
            return;
        }

        String encodedAddress = URLEncoder.encode(rawAddress, StandardCharsets.UTF_8);
        String encodedApiKey = URLEncoder.encode(googleMapsApiKey, StandardCharsets.UTF_8);
        URI uri = URI.create(GOOGLE_GEOCODE_URL + "?address=" + encodedAddress + "&key=" + encodedApiKey);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(uri)
                .timeout(Duration.ofSeconds(8))
                .GET()
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                clearCoordinates(user);
                return;
            }

            JsonNode root = objectMapper.readTree(response.body());
            if (!"OK".equals(root.path("status").asText())) {
                clearCoordinates(user);
                return;
            }

            JsonNode firstResult = root.path("results").path(0);
            JsonNode location = firstResult.path("geometry").path("location");
            if (location.isMissingNode()) {
                clearCoordinates(user);
                return;
            }

            user.setLat(location.path("lat").asDouble());
            user.setLng(location.path("lng").asDouble());
            user.setGeocodedAt(LocalDateTime.now());
        } catch (IOException | InterruptedException ex) {
            if (ex instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            clearCoordinates(user);
        }
    }

    private void clearCoordinates(User user) {
        user.setLat(null);
        user.setLng(null);
        user.setGeocodedAt(null);
    }
}
