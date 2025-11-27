"""Email service for sending SMTP emails"""

import smtplib
import secrets
import string
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.core.config import settings


def generate_temporary_password(length: int = 12) -> str:
    """Generate a secure temporary password"""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    # Ensure at least one of each type
    password = [
        secrets.choice(string.ascii_lowercase),
        secrets.choice(string.ascii_uppercase),
        secrets.choice(string.digits),
        secrets.choice("!@#$%^&*")
    ]
    # Fill the rest
    password += [secrets.choice(alphabet) for _ in range(length - 4)]
    # Shuffle
    secrets.SystemRandom().shuffle(password)
    return ''.join(password)


def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None
) -> bool:
    """
    Send an email via SMTP

    Returns True if successful, False otherwise
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print(f"[EMAIL SERVICE] SMTP not configured. Would send to: {to_email}")
        print(f"[EMAIL SERVICE] Subject: {subject}")
        print(f"[EMAIL SERVICE] Content: {text_content or html_content}")
        return True  # Return success for dev/testing

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = to_email

        # Add plain text version
        if text_content:
            msg.attach(MIMEText(text_content, "plain"))

        # Add HTML version
        msg.attach(MIMEText(html_content, "html"))

        # Connect and send
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_TLS:
                server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())

        return True

    except Exception as e:
        print(f"[EMAIL SERVICE] Error sending email: {e}")
        return False


def send_welcome_email(
    admin_name: str,
    admin_email: str,
    agency_name: str,
    temporary_password: str
) -> bool:
    """Send welcome email to new agency admin with credentials"""

    login_url = f"{settings.APP_URL}/login"

    subject = "Welcome to Bizvoy – Your Agency Account is Ready"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #0D9488; color: white; padding: 20px; text-align: center; }}
            .content {{ padding: 20px; background-color: #f9fafb; }}
            .credentials {{ background-color: #fff; border: 1px solid #e5e7eb; padding: 15px; margin: 15px 0; border-radius: 8px; }}
            .credentials p {{ margin: 8px 0; }}
            .button {{ display: inline-block; background-color: #0D9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }}
            .footer {{ text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to Bizvoy</h1>
            </div>
            <div class="content">
                <p>Hi {admin_name},</p>

                <p>Your agency <strong>"{agency_name}"</strong> has been successfully onboarded to Bizvoy.</p>

                <div class="credentials">
                    <p><strong>Your Login Details:</strong></p>
                    <p><strong>Login URL:</strong> <a href="{login_url}">{login_url}</a></p>
                    <p><strong>Email:</strong> {admin_email}</p>
                    <p><strong>Temporary Password:</strong> {temporary_password}</p>
                </div>

                <p><strong>Important:</strong> For security, please log in and change your password immediately.</p>

                <a href="{login_url}" class="button">Login to Bizvoy</a>

                <p style="margin-top: 20px;">If you have any questions, reply to this email or contact support.</p>
            </div>
            <div class="footer">
                <p>– The Bizvoy Team</p>
            </div>
        </div>
    </body>
    </html>
    """

    text_content = f"""
    Welcome to Bizvoy

    Hi {admin_name},

    Your agency "{agency_name}" has been successfully onboarded to Bizvoy.

    Your Login Details:
    - Login URL: {login_url}
    - Email: {admin_email}
    - Temporary Password: {temporary_password}

    Important: For security, please log in and change your password immediately.

    If you have any questions, reply to this email or contact support.

    – The Bizvoy Team
    """

    return send_email(admin_email, subject, html_content, text_content)


def send_password_reset_email(
    admin_name: str,
    admin_email: str,
    agency_name: str,
    new_password: str
) -> bool:
    """Send password reset email with new credentials"""

    login_url = f"{settings.APP_URL}/login"

    subject = "Bizvoy – Your Password Has Been Reset"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #0D9488; color: white; padding: 20px; text-align: center; }}
            .content {{ padding: 20px; background-color: #f9fafb; }}
            .credentials {{ background-color: #fff; border: 1px solid #e5e7eb; padding: 15px; margin: 15px 0; border-radius: 8px; }}
            .credentials p {{ margin: 8px 0; }}
            .button {{ display: inline-block; background-color: #0D9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }}
            .footer {{ text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Password Reset</h1>
            </div>
            <div class="content">
                <p>Hi {admin_name},</p>

                <p>Your password for the agency <strong>"{agency_name}"</strong> has been reset by an administrator.</p>

                <div class="credentials">
                    <p><strong>Your New Login Details:</strong></p>
                    <p><strong>Login URL:</strong> <a href="{login_url}">{login_url}</a></p>
                    <p><strong>Email:</strong> {admin_email}</p>
                    <p><strong>New Temporary Password:</strong> {new_password}</p>
                </div>

                <p><strong>Important:</strong> For security, please log in and change your password immediately.</p>

                <a href="{login_url}" class="button">Login to Bizvoy</a>

                <p style="margin-top: 20px;">If you did not request this reset, please contact support immediately.</p>
            </div>
            <div class="footer">
                <p>– The Bizvoy Team</p>
            </div>
        </div>
    </body>
    </html>
    """

    text_content = f"""
    Password Reset

    Hi {admin_name},

    Your password for the agency "{agency_name}" has been reset by an administrator.

    Your New Login Details:
    - Login URL: {login_url}
    - Email: {admin_email}
    - New Temporary Password: {new_password}

    Important: For security, please log in and change your password immediately.

    If you did not request this reset, please contact support immediately.

    – The Bizvoy Team
    """

    return send_email(admin_email, subject, html_content, text_content)
