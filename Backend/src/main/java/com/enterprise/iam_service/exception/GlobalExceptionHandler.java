package com.enterprise.iam_service.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

// ? @RestControllerAdvice intercepts exceptions thrown anywhere in
// ? the controller layer and converts them to clean JSON responses
// ! instead of leaking stack traces to the client.
@RestControllerAdvice
public class GlobalExceptionHandler {

    // * Catches all unhandled RuntimeExceptions (our main application errors).
    // ! Returns 400 Bad Request with the exception message as the error body.
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntimeException(RuntimeException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(
                        HttpStatus.BAD_REQUEST.value(),
                        ex.getMessage(),
                        LocalDateTime.now()
                ));
    }

    // * Catches @Valid validation failures (e.g. @Email, @NotBlank on DTOs).
    // ! Returns 400 with a map of field → error message so the frontend
    // ! can highlight exactly which fields are wrong.
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationException(
            MethodArgumentNotValidException ex) {

        Map<String, String> errors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            errors.put(error.getField(), error.getDefaultMessage());
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
    }

    // * Catches @PreAuthorize failures — user is authenticated but lacks the role.
    // ! Returns 403 Forbidden instead of leaking a stack trace.
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDeniedException(
            AccessDeniedException ex) {
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(new ErrorResponse(
                        HttpStatus.FORBIDDEN.value(),
                        "You do not have permission to perform this action.",
                        LocalDateTime.now()
                ));
    }

    // * Catch-all safety net for anything unexpected.
    // ! Returns 500 but hides internal details from the client.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse(
                        HttpStatus.INTERNAL_SERVER_ERROR.value(),
                        "An unexpected error occurred. Please try again later.",
                        LocalDateTime.now()
                ));
    }

    // * Clean error envelope returned in every error response.
    public record ErrorResponse(int status, String message, LocalDateTime timestamp) {}
}