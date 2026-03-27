package com.enterprise.iam_service.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleDistanceMatrixService {

    @Value("${google.maps.api-key:}")
    private String apiKey;

    private final ObjectMapper objectMapper;

    public int[][] buildDurationMatrixInSeconds(List<GeoPoint> points) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new RuntimeException("Google Maps API key is missing");
        }
        if (points.isEmpty()) {
            return new int[0][0];
        }

        String origins = encodePoints(points);
        String destinations = encodePoints(points);

        String url = "https://maps.googleapis.com/maps/api/distancematrix/json"
                + "?origins=" + origins
                + "&destinations=" + destinations
                + "&key=" + apiKey
                + "&mode=driving";

        try {
            String body = new RestTemplate().getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(body);
            String status = root.path("status").asText();
            if (!"OK".equals(status)) {
                throw new RuntimeException("Google Distance Matrix failed: " + status);
            }

            int size = points.size();
            int[][] matrix = new int[size][size];
            JsonNode rows = root.path("rows");
            for (int i = 0; i < size; i++) {
                JsonNode elements = rows.get(i).path("elements");
                for (int j = 0; j < size; j++) {
                    JsonNode element = elements.get(j);
                    String elementStatus = element.path("status").asText();
                    if (!"OK".equals(elementStatus)) {
                        matrix[i][j] = i == j ? 0 : Integer.MAX_VALUE / 4;
                        continue;
                    }
                    matrix[i][j] = element.path("duration").path("value").asInt();
                }
            }
            return matrix;
        } catch (Exception ex) {
            log.error("Failed to build distance matrix", ex);
            throw new RuntimeException("Failed to call Google Distance Matrix", ex);
        }
    }

    private String encodePoints(List<GeoPoint> points) {
        String raw = points.stream()
                .map(p -> p.lat() + "," + p.lng())
                .collect(Collectors.joining("|"));
        return URLEncoder.encode(raw, StandardCharsets.UTF_8);
    }

    public record GeoPoint(double lat, double lng) {}
}
