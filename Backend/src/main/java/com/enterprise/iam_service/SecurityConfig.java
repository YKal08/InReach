package com.enterprise.iam_service;

import com.enterprise.iam_service.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;
// ? @Configuration: Marks this class as a source of bean definitions for the application context.
// ? @EnableWebSecurity: Switches on Spring Security's web security support.
// ? @EnableMethodSecurity: Enables the use of @PreAuthorize annotations in your controllers.
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    // * Bean: Defines the encryption algorithm used across the entire system.
    // * Security Pipeline: Defines how HTTP requests are secured and filtered.
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Enable CORS using the bean below
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public: login and register
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/schedule/**").authenticated()
                .requestMatchers("/error").permitAll()
                // Admin endpoints: require JWT authentication; @PreAuthorize enforces Admin role
                .requestMatchers("/api/admin/**").authenticated()
                // User endpoints: require JWT authentication
                .requestMatchers("/api/user/**").authenticated()
                // Everything else requires a valid JWT
                .anyRequest().authenticated()
            )
            
            // ! Filter Ordering: Inserts the JWT filter BEFORE the standard Username/Password filter.
            // ! This ensures the token is validated first on every incoming request.
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // ! CORS: Allows the frontend to call the IAM API.
    // ! Update allowedOrigins to match your actual frontend URL in production.
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOrigins(List.of(
            "http://localhost:8085",   // Some service of your choice
            "http://localhost:3000",   // If you run frontend standalone
            "http://localhost:5500",   // VS Code Live Server
            "http://127.0.0.1:5500"
        ));

        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}