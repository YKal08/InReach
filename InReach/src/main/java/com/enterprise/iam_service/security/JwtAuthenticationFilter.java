package com.enterprise.iam_service.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.enterprise.iam_service.repository.UserRepository;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import java.util.stream.Collectors;
import java.io.IOException;

// ? @Component: Registers this filter as a Spring bean so it can be injected into the Security Filter Chain.
// ? OncePerRequestFilter: Ensures this filter is only executed once for a single HTTP request, preventing redundant processing.
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        
        // * Step 1: Intercept the incoming request and check for the "Authorization" header.
        String authHeader = request.getHeader("Authorization");

        // * Step 2: Validate the header format (must start with "Bearer " followed by the token).
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            // ! Extract the raw JWT string by removing the "Bearer " prefix (7 characters).
            String token = authHeader.substring(7);
            
            // ! Step 3: Parse the token to retrieve the user's email (Subject).
            String email = jwtUtils.extractEmail(token);

            // ! Step 4: Security Check - Is the email valid and is the SecurityContext currently empty?
            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                userRepository.findByEmail(email).ifPresent(user -> {
                    
                    // * Step 5: Map internal Domain Roles to Spring Security Authorities.
                    // ? Note: "ROLE_" prefix is added here to match Spring Security's hasRole() expectations.
                    var authorities = user.getRoles().stream()
                        .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getName()))
                        .collect(Collectors.toList());

                    // * Step 6: Create an Authentication Object containing the user identity and permissions.
                    UsernamePasswordAuthenticationToken authToken = 
                        new UsernamePasswordAuthenticationToken(email, null, authorities);
                    
                    // ! Step 7: Inject the authenticated token into the SecurityContextHolder.
                    // ! This effectively "logs the user in" for the duration of this specific request.
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                });
            }
        }

        // * Step 8: Pass the request and response to the next filter in the chain.
        // ? If authentication failed, the request will likely be blocked later by the .authenticated() rule.
        filterChain.doFilter(request, response);
    }
}