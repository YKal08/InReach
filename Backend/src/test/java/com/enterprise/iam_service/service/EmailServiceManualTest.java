package com.enterprise.iam_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

// ? Integration test that sends REAL emails to test various email formats
// ? This test is meant to be run manually to verify email appearance and delivery
@SpringBootTest
@DisplayName("EmailService Manual Integration Tests - Sends Real Emails")
class EmailServiceManualTest {

    @Autowired
    private EmailService emailService;

    private static final String TEST_EMAIL = "bobi.l.marinov@gmail.com";

    @Test
    @DisplayName("Send Simple Text Email")
    void testSendSimpleTextEmail() {
        String subject = "InReach Test - Simple Email";
        String body = "This is a simple text email from the InReach Backend application.\n\n" +
                      "This email tests the basic text email functionality.\n\n" +
                      "Sent at: " + java.time.LocalDateTime.now();
        
        emailService.sendSimpleEmail(TEST_EMAIL, subject, body);
        System.out.println("✓ Simple text email sent to: " + TEST_EMAIL);
    }

    @Test
    @DisplayName("Send HTML Email")
    void testSendHtmlEmail() {
        String subject = "InReach Test - HTML Email";
        String htmlBody = "<html><body style='font-family: Arial, sans-serif;'>" +
                         "<h1 style='color: #2196F3;'>HTML Email Test</h1>" +
                         "<p>This is a beautifully formatted <strong>HTML email</strong> from InReach.</p>" +
                         "<p style='color: #666;'>It includes:</p>" +
                         "<ul>" +
                         "<li>Rich text formatting</li>" +
                         "<li>Colors and styling</li>" +
                         "<li>Professional appearance</li>" +
                         "</ul>" +
                         "<p><em>Sent at: " + java.time.LocalDateTime.now() + "</em></p>" +
                         "</body></html>";
        
        emailService.sendHtmlEmail(TEST_EMAIL, subject, htmlBody);
        System.out.println("✓ HTML email sent to: " + TEST_EMAIL);
    }

    @Test
    @DisplayName("Send Password Reset Email")
    void testSendPasswordResetEmail() {
        String resetLink = "https://inreach.example.com/reset?token=abc123def456ghi789";
        
        emailService.sendPasswordResetEmail(TEST_EMAIL, resetLink);
        System.out.println("✓ Password reset email sent to: " + TEST_EMAIL);
    }

    @Test
    @DisplayName("Send Verification Email")
    void testSendVerificationEmail() {
        String firstName = "Test";
        String verificationLink = "https://inreach.example.com/verify?token=xyz789uvw456rst123";
        
        emailService.sendVerificationEmail(TEST_EMAIL, firstName, verificationLink);
        System.out.println("✓ Verification email sent to: " + TEST_EMAIL);
    }

    @Test
    @DisplayName("Send Appointment Confirmation Email")
    void testSendAppointmentConfirmationEmail() {
        String userName = "John Doe";
        String appointmentDate = "April 15, 2026 at 2:30 PM";
        String doctorName = "Dr. Jane Smith";
        
        emailService.sendAppointmentConfirmation(TEST_EMAIL, userName, appointmentDate, doctorName);
        System.out.println("✓ Appointment confirmation email sent to: " + TEST_EMAIL);
    }

    @Test
    @DisplayName("Send Email with CC and BCC")
    void testSendEmailWithCCandBCC() {
        String cc = "cc@example.com";
        String bcc = "bcc@example.com";
        String subject = "InReach Test - CC/BCC Email";
        String body = "This email has both CC and BCC recipients.\n\n" +
                     "CC: " + cc + "\n" +
                     "BCC: " + bcc + "\n\n" +
                     "Sent at: " + java.time.LocalDateTime.now();
        
        emailService.sendEmailWithCCandBCC(TEST_EMAIL, cc, bcc, subject, body);
        System.out.println("✓ Email with CC/BCC sent to: " + TEST_EMAIL);
    }

    @Test
    @DisplayName("Send Bulk Email to Multiple Recipients")
    void testSendBulkEmail() {
        String[] recipients = {TEST_EMAIL, "secondary@example.com"};
        String subject = "InReach Test - Bulk Email";
        String body = "This email is being sent to multiple recipients.\n\n" +
                     "Recipients:\n" +
                     "1. " + recipients[0] + "\n" +
                     "2. " + recipients[1] + "\n\n" +
                     "Sent at: " + java.time.LocalDateTime.now();
        
        emailService.sendBulkEmail(recipients, subject, body);
        System.out.println("✓ Bulk email sent to " + recipients.length + " recipients");
    }
}
