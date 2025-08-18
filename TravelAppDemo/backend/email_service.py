import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import secrets
import string

class EmailService:
    def __init__(self):
        self.smtp_server = "smtp.gmail.com"
        self.smtp_port = 587
        self.sender_email = "your-email@gmail.com"  # Replace with actual email
        self.sender_password = "your-app-password"  # Replace with actual app password
        
    def generate_verification_token(self) -> str:
        """Generate a random verification token"""
        return ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
    
    def get_verification_expiry(self) -> datetime:
        """Get verification token expiry time (24 hours from now)"""
        return datetime.utcnow() + timedelta(hours=24)
    
    async def send_verification_email(self, recipient_email: str, recipient_name: str, token: str) -> bool:
        """Send verification email (simplified version)"""
        try:
            # In a real implementation, this would send an actual email
            # For now, we'll just return True to simulate success
            print(f"Would send verification email to {recipient_email} with token {token}")
            return True
        except Exception as e:
            print(f"Error sending email: {e}")
            return False

    async def send_password_reset_email(self, recipient_email: str, recipient_name: str, token: str) -> bool:
        """Send password reset email (simplified stub)"""
        try:
            reset_link = f"https://your-frontend-domain.com/auth/reset-password?token={token}"
            print(
                f"Would send password reset email to {recipient_email} with link {reset_link}"
            )
            return True
        except Exception as e:
            print(f"Error sending password reset email: {e}")
            return False

# Create a singleton instance
email_service = EmailService() 