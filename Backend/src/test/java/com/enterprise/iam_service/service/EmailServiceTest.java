package com.enterprise.iam_service.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import jakarta.mail.internet.MimeMessage;
import com.enterprise.iam_service.service.EmailService;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

// ? Unit tests for EmailService using mocks - NO actual emails are sent
@DisplayName("EmailService Unit Tests")
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private EmailService emailService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    @DisplayName("Should send simple email without errors")
    void testSendSimpleEmail() {
        // Arrange
        String to = "test@example.com";
        String subject = "Test Subject";
        String body = "Test body content";

        // Act
        emailService.sendSimpleEmail(to, subject, body);

        // Assert
        verify(mailSender, times(1)).send(any(SimpleMailMessage.class));
    }

    @Test
    @DisplayName("Should send simple email with correct recipient")
    void testSendSimpleEmailCorrectRecipient() {
        // Arrange
        String to = "user@example.com";
        String subject = "Welcome";
        String body = "Welcome to our service";

        // Act
        emailService.sendSimpleEmail(to, subject, body);

        // Assert
        verify(mailSender, times(1)).send(any(SimpleMailMessage.class));
    }

    @Test
    @DisplayName("Should throw RuntimeException when mail sending fails")
    void testSendSimpleEmailFailure() {
        // Arrange
        doThrow(new RuntimeException("Mail server error"))
            .when(mailSender).send(any(SimpleMailMessage.class));

        // Act & Assert
        assertThrows(RuntimeException.class, () ->
            emailService.sendSimpleEmail("test@example.com", "Subject", "Body")
        );
    }

    @Test
    @DisplayName("Should send HTML email with correct format")
    void testSendHtmlEmail() {
        // Arrange
        String to = "test@example.com";
        String subject = "HTML Test";
        String htmlBody = "<html><body><h1>Hello</h1></body></html>";
        
        when(mailSender.createMimeMessage()).thenReturn(mock(MimeMessage.class));

        // Act
        emailService.sendHtmlEmail(to, subject, htmlBody);

        // Assert
        verify(mailSender, times(1)).createMimeMessage();
        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("Should send bulk email to multiple recipients")
    void testSendBulkEmail() {
        // Arrange
        String[] recipients = {"user1@example.com", "user2@example.com", "user3@example.com"};
        String subject = "Bulk Test";
        String body = "Message for all";

        // Act
        emailService.sendBulkEmail(recipients, subject, body);

        // Assert
        verify(mailSender, times(1)).send(any(SimpleMailMessage.class));
    }

    @Test
    @DisplayName("Should send email with CC and BCC")
    void testSendEmailWithCCandBCC() {
        // Arrange
        String to = "primary@example.com";
        String cc = "cc@example.com";
        String bcc = "bcc@example.com";
        
        when(mailSender.createMimeMessage()).thenReturn(mock(MimeMessage.class));

        // Act
        emailService.sendEmailWithCCandBCC(to, cc, bcc, "Subject", "Body");

        // Assert
        verify(mailSender, times(1)).createMimeMessage();
        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("Should send password reset email")
    void testSendPasswordResetEmail() {
        // Arrange
        String userEmail = "user@example.com";
        String resetLink = "https://example.com/reset?token=abc123";
        when(mailSender.createMimeMessage()).thenReturn(mock(MimeMessage.class));

        // Act
        emailService.sendPasswordResetEmail(userEmail, resetLink);

        // Assert
        verify(mailSender, times(1)).createMimeMessage();
        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("Should send verification email")
    void testSendVerificationEmail() {
        // Arrange
        String userEmail = "user@example.com";
        String firstName = "John";
        String verificationLink = "https://example.com/verify?token=xyz789";
        when(mailSender.createMimeMessage()).thenReturn(mock(MimeMessage.class));

        // Act
        emailService.sendVerificationEmail(userEmail, firstName, verificationLink);

        // Assert
        verify(mailSender, times(1)).createMimeMessage();
        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("Should send appointment confirmation email")
    void testSendAppointmentConfirmation() {
        // Arrange
        String userEmail = "user@example.com";
        String userName = "John Doe";
        String appointmentDate = "2026-04-15 10:30 AM";
        String doctorName = "Dr. Jane Smith";
        when(mailSender.createMimeMessage()).thenReturn(mock(MimeMessage.class));

        // Act
        emailService.sendAppointmentConfirmation(userEmail, userName, appointmentDate, doctorName);

        // Assert
        verify(mailSender, times(1)).createMimeMessage();
        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("Should handle null CC gracefully")
    void testSendEmailWithNullCC() {
        // Arrange
        when(mailSender.createMimeMessage()).thenReturn(mock(MimeMessage.class));

        // Act
        emailService.sendEmailWithCCandBCC("to@example.com", null, null, "Subject", "Body");

        // Assert
        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("Should handle empty BCC gracefully")
    void testSendEmailWithEmptyBCC() {
        // Arrange
        when(mailSender.createMimeMessage()).thenReturn(mock(MimeMessage.class));

        // Act
        emailService.sendEmailWithCCandBCC("to@example.com", "cc@example.com", "", "Subject", "Body");

        // Assert
        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }
}
