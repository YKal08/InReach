package com.enterprise.iam_service.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;

// ? @Service: Marks this class as a service layer component for email operations.
// ? @Slf4j: Provides logging capabilities using Lombok.
@Service
@Slf4j
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    // * Sends a simple text email to a user
    // ? Used for basic notifications without HTML formatting
    public void sendSimpleEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            
            mailSender.send(message);
            log.info("Simple email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send simple email to: {}", to, e);
            throw new RuntimeException("Failed to send email", e);
        }
    }

    // * Sends an HTML email to a user
    // ? Allows rich formatting, styling, and embedded content
    public void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true); // true indicates HTML format
            
            mailSender.send(message);
            log.info("HTML email sent successfully to: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send HTML email to: {}", to, e);
            throw new RuntimeException("Failed to send email", e);
        }
    }

    // * Sends an email to multiple recipients
    public void sendBulkEmail(String[] recipients, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(recipients);
            message.setSubject(subject);
            message.setText(body);
            
            mailSender.send(message);
            log.info("Bulk email sent successfully to: {} recipients", recipients.length);
        } catch (Exception e) {
            log.error("Failed to send bulk email", e);
            throw new RuntimeException("Failed to send bulk email", e);
        }
    }

    // * Sends an email with CC and BCC recipients
    public void sendEmailWithCCandBCC(String to, String cc, String bcc, String subject, String body) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            
            helper.setTo(to);
            if (cc != null && !cc.isEmpty()) {
                helper.setCc(cc);
            }
            if (bcc != null && !bcc.isEmpty()) {
                helper.setBcc(bcc);
            }
            helper.setSubject(subject);
            helper.setText(body);
            
            mailSender.send(message);
            log.info("Email sent with CC/BCC to: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send email with CC/BCC to: {}", to, e);
            throw new RuntimeException("Failed to send email", e);
        }
    }

    // * Sends a password reset email
    public void sendPasswordResetEmail(String userEmail, String resetLink) {
        String htmlBody = String.format(
            "<html><body>" +
            "<h2>Password Reset Request</h2>" +
            "<p>You requested a password reset. Click the link below to reset your password:</p>" +
            "<p><a href=\"%s\">Reset Password</a></p>" +
            "<p>This link expires in 1 hour.</p>" +
            "<p>If you did not request this, please ignore this email.</p>" +
            "</body></html>",
            resetLink
        );
        sendHtmlEmail(userEmail, "Password Reset Request", htmlBody);
    }

    // * Sends a welcome/verification email
    public void sendVerificationEmail(String userEmail, String firstName, String verificationLink) {
        String htmlBody = String.format(
            "<html><body>" +
            "<h2>Welcome, %s!</h2>" +
            "<p>Thank you for signing up. Please verify your email address by clicking the link below:</p>" +
            "<p><a href=\"%s\">Verify Email</a></p>" +
            "<p>If you did not create this account, please contact support.</p>" +
            "</body></html>",
            firstName,
            verificationLink
        );
        sendHtmlEmail(userEmail, "Email Verification", htmlBody);
    }

    // * Sends an appointment confirmation email
    public void sendAppointmentConfirmation(String userEmail, String userName, 
                                           String appointmentDate, String doctorName) {
        String htmlBody = String.format(
            "<html><body>" +
            "<h2>Appointment Confirmation</h2>" +
            "<p>Hello %s,</p>" +
            "<p>Your appointment has been confirmed.</p>" +
            "<p><strong>Appointment Details:</strong></p>" +
            "<ul>" +
            "<li>Date & Time: %s</li>" +
            "<li>Doctor: %s</li>" +
            "</ul>" +
            "<p>If you need to reschedule, please contact us.</p>" +
            "</body></html>",
            userName,
            appointmentDate,
            doctorName
        );
        sendHtmlEmail(userEmail, "Appointment Confirmation", htmlBody);
    }
}
