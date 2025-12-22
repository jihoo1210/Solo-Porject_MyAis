package com.myais.infra.email;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final boolean emailEnabled;
    private final String fromEmail;
    private final String frontendUrl;

    public EmailService(
            @Autowired(required = false) JavaMailSender mailSender,
            @Value("${app.email.enabled:false}") boolean emailEnabled,
            @Value("${spring.mail.username:noreply@myais.com}") String fromEmail,
            @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl) {
        this.mailSender = mailSender;
        this.emailEnabled = emailEnabled;
        this.fromEmail = fromEmail;
        this.frontendUrl = frontendUrl;
    }

    @Async
    public void sendVerificationEmail(String to, String name, String token) {
        String verificationLink = frontendUrl + "/verify-email?token=" + token;

        if (!emailEnabled || mailSender == null) {
            log.info("[DEV MODE] Verification email would be sent to: {}", to);
            log.info("[DEV MODE] Verification link: {}", verificationLink);
            return;
        }

        String subject = "[MyAIs] 이메일 인증을 완료해주세요";
        String content = buildVerificationEmailTemplate(name, verificationLink);
        sendHtmlEmail(to, subject, content);
    }

    @Async
    public void sendPasswordResetEmail(String to, String name, String token) {
        String resetLink = frontendUrl + "/reset-password?token=" + token;

        if (!emailEnabled || mailSender == null) {
            log.info("[DEV MODE] Password reset email would be sent to: {}", to);
            log.info("[DEV MODE] Reset link: {}", resetLink);
            return;
        }

        String subject = "[MyAIs] 비밀번호 재설정";
        String content = buildPasswordResetEmailTemplate(name, resetLink);
        sendHtmlEmail(to, subject, content);
    }

    private void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Email sent successfully to: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send email to: {}", to, e);
            throw new RuntimeException("이메일 발송에 실패했습니다.", e);
        }
    }

    private String buildVerificationEmailTemplate(String name, String verificationLink) {
        return """
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #0f172a 0%%, #1e1b4b 50%%, #0f172a 100%%); min-height: 100vh;">
                <table role="presentation" style="width: 100%%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 40px 20px;">
                            <table role="presentation" style="max-width: 500px; margin: 0 auto; background: rgba(17, 24, 39, 0.95); border-radius: 16px; border: 1px solid rgba(139, 92, 246, 0.3); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
                                <!-- Header -->
                                <tr>
                                    <td style="padding: 40px 40px 20px; text-align: center;">
                                        <h1 style="margin: 0; font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #a78bfa 0%%, #818cf8 50%%, #6366f1 100%%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                                            MyAIs
                                        </h1>
                                    </td>
                                </tr>
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 20px 40px;">
                                        <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #ffffff;">
                                            이메일 인증
                                        </h2>
                                        <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #d1d5db;">
                                            안녕하세요, <strong style="color: #ffffff;">%s</strong>님!<br><br>
                                            MyAIs에 가입해 주셔서 감사합니다.<br>
                                            아래 버튼을 클릭하여 이메일 인증을 완료해주세요.
                                        </p>
                                        <div style="text-align: center; margin: 32px 0;">
                                            <a href="%s" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #7c3aed 0%%, #6366f1 100%%); color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4);">
                                                이메일 인증하기
                                            </a>
                                        </div>
                                        <p style="margin: 24px 0 0; font-size: 13px; line-height: 1.6; color: #9ca3af;">
                                            버튼이 작동하지 않으면 아래 링크를 브라우저에 복사하세요:
                                        </p>
                                        <p style="margin: 8px 0 0; font-size: 12px; color: #6b7280; word-break: break-all;">
                                            %s
                                        </p>
                                    </td>
                                </tr>
                                <!-- Footer -->
                                <tr>
                                    <td style="padding: 20px 40px 40px;">
                                        <div style="border-top: 1px solid rgba(75, 85, 99, 0.3); padding-top: 20px;">
                                            <p style="margin: 0; font-size: 12px; color: #6b7280; text-align: center;">
                                                이 링크는 24시간 동안 유효합니다.<br>
                                                본인이 요청하지 않은 경우 이 이메일을 무시해주세요.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """.formatted(name, verificationLink, verificationLink);
    }

    private String buildPasswordResetEmailTemplate(String name, String resetLink) {
        return """
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #0f172a 0%%, #1e1b4b 50%%, #0f172a 100%%); min-height: 100vh;">
                <table role="presentation" style="width: 100%%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 40px 20px;">
                            <table role="presentation" style="max-width: 500px; margin: 0 auto; background: rgba(17, 24, 39, 0.95); border-radius: 16px; border: 1px solid rgba(139, 92, 246, 0.3); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
                                <!-- Header -->
                                <tr>
                                    <td style="padding: 40px 40px 20px; text-align: center;">
                                        <h1 style="margin: 0; font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #a78bfa 0%%, #818cf8 50%%, #6366f1 100%%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                                            MyAIs
                                        </h1>
                                    </td>
                                </tr>
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 20px 40px;">
                                        <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #ffffff;">
                                            비밀번호 재설정
                                        </h2>
                                        <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #d1d5db;">
                                            안녕하세요, <strong style="color: #ffffff;">%s</strong>님!<br><br>
                                            비밀번호 재설정 요청이 접수되었습니다.<br>
                                            아래 버튼을 클릭하여 새 비밀번호를 설정해주세요.
                                        </p>
                                        <div style="text-align: center; margin: 32px 0;">
                                            <a href="%s" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #7c3aed 0%%, #6366f1 100%%); color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4);">
                                                비밀번호 재설정
                                            </a>
                                        </div>
                                        <p style="margin: 24px 0 0; font-size: 13px; line-height: 1.6; color: #9ca3af;">
                                            버튼이 작동하지 않으면 아래 링크를 브라우저에 복사하세요:
                                        </p>
                                        <p style="margin: 8px 0 0; font-size: 12px; color: #6b7280; word-break: break-all;">
                                            %s
                                        </p>
                                    </td>
                                </tr>
                                <!-- Footer -->
                                <tr>
                                    <td style="padding: 20px 40px 40px;">
                                        <div style="border-top: 1px solid rgba(75, 85, 99, 0.3); padding-top: 20px;">
                                            <p style="margin: 0; font-size: 12px; color: #6b7280; text-align: center;">
                                                이 링크는 1시간 동안 유효합니다.<br>
                                                본인이 요청하지 않은 경우 이 이메일을 무시해주세요.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """.formatted(name, resetLink, resetLink);
    }
}
