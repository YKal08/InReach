package com.enterprise.iam_service.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.ActiveProfiles;
import jakarta.mail.internet.MimeMessage;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

// ? Integration tests for EmailService
// ? By default, these tests mock the JavaMailSender (no actual emails sent)
// ? To enable actual email sending, set the 'send-actual-emails' property to 'true'
// ? Or remove the @MockBean annotation and set up a real mail sender config
@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@DisplayName("EmailService Integration Tests")
class EmailServiceIntegrationTest {

    @Autowired
    private EmailService emailService;

    @MockBean
    private JavaMailSender mailSender;

    @Test
    @DisplayName("Should inject EmailService successfully")
    void testEmailServiceInjection() {
        org.junit.jupiter.api.Assertions.assertNotNull(emailService);
        org.junit.jupiter.api.Assertions.assertNotNull(mailSender);
    }

    @Test
    @DisplayName("Integration: Send simple email successfully")
    void integrationTestSendSimpleEmail() {
        // Arrange
        String to = "bobi.l.marinov@gmail.com";
        String subject = "Integration Test - Simple Email";
        String body = "This is a test email from the EmailService integration test.";

        // Act
        emailService.sendSimpleEmail(to, subject, body);

        // Assert
        verify(mailSender, times(1)).send(any(SimpleMailMessage.class));
    }

    @Test
    @DisplayName("Integration: Send HTML email successfully")
    void integrationTestSendHtmlEmail() {
        // Arrange
        String to = "bobi.l.marinov@gmail.com";
        String subject = "Integration Test - HTML Email";
        String htmlBody = "<html><body>" +
                         "<h1>Welcome to Integration Test</h1>" +
                         "<p>This is an HTML formatted email.</p>" +
                         "</body></html>";
        
        when(mailSender.createMimeMessage()).thenReturn(mock(MimeMessage.class));

        // Act
        emailService.sendHtmlEmail(to, subject, htmlBody);

        // Assert
        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("Integration: Send bulk email to multiple recipients")
    void integrationTestSendBulkEmail() {
        // Arrange
        String[] recipients = {
            "bobi.l.marinov@gmail.com",
            "test1@example.com",
            "test2@example.com"
        };
        String subject = "Integration Test - Bulk Email";
        String body = "This email is sent to multiple recipients.";

        // Act
        emailService.sendBulkEmail(recipients, subject, body);

        // Assert
        verify(mailSender, times(1)).send(any(SimpleMailMessage.class));
    }

    @Test
    @DisplayName("Integration: Send password reset email")
    void integrationTestSendPasswordReset() {
        // Arrange
        String userEmail = "bobi.l.marinov@gmail.com";
        String resetLink = "https://inreach.com/reset-password?token=integration_test_token_12345";
        
        when(mailSender.createMimeMessage()).thenReturn(mock(MimeMessage.class));

        // Act
        emailService.sendPasswordResetEmail(userEmail, resetLink);

        // Assert
        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("Integration: Send verification email")
    void integrationTestSendVerificationEmail() {
        // Arrange
        String userEmail = "bobi.l.marinov@gmail.com";
        String firstName = "Bobi";
        String verificationLink = "https://inreach.com/verify-email?token=integration_test_verify_789";
        
        when(mailSender.createMimeMessage()).thenReturn(mock(MimeMessage.class));

        // Act
        emailService.sendVerificationEmail(userEmail, firstName, verificationLink);

        // Assert
        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("Integration: Send appointment confirmation")
    void integrationTestSendAppointmentConfirmation() {
        // Arrange
        String userEmail = "bobi.l.marinov@gmail.com";
        String userName = "Bobi Marinov";
        String appointmentDate = "2026-04-20 14:00 PM";
        String doctorName = "Dr. Ivan Petrov";
        
        when(mailSender.createMimeMessage()).thenReturn(mock(MimeMessage.class));

        // Act
        emailService.sendAppointmentConfirmation(userEmail, userName, appointmentDate, doctorName);

        // Assert
        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("Integration: Send email with CC and BCC")
    void integrationTestSendEmailWithCCandBCC() {
        // Arrange
        String to = "bobi.l.marinov@gmail.com";
        String cc = "cc@example.com";
        String bcc = "bcc@example.com";
        String subject = "Integration Test - CC/BCC Email";
        String body = "Testing email with CC and BCC functionality.";
        
        when(mailSender.createMimeMessage()).thenReturn(mock(MimeMessage.class));

        // Act
        emailService.sendEmailWithCCandBCC(to, cc, bcc, subject, body);

        // Assert
        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }
}
