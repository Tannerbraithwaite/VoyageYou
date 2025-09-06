"""
Email service for sending booking confirmations and travel updates
"""
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import os
import secrets
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        # SendGrid configuration
        self.sendgrid_api_key = os.getenv('SENDGRID_API_KEY', '')
        self.sender_email = os.getenv('SENDER_EMAIL', 'noreply@travelapp.com')
        
        # For testing purposes, we'll use a mock service
        # If SendGrid API key is missing, force test mode
        self.is_test_mode = (
            os.getenv('ENV', 'development') == 'development' or 
            not self.sendgrid_api_key or 
            not self.sender_email or
            self.sender_email == 'noreply@travelapp.com'
        )
        
        # Initialize SendGrid client if not in test mode
        if not self.is_test_mode:
            try:
                self.sendgrid_client = SendGridAPIClient(api_key=self.sendgrid_api_key)
                logger.info("✅ SendGrid client initialized successfully")
            except Exception as e:
                logger.error(f"❌ Failed to initialize SendGrid client: {str(e)}")
                self.is_test_mode = True
        
        # Log email service configuration for debugging
        logger.info(f"Email Service Configuration:")
        logger.info(f"  Service: {'SendGrid' if not self.is_test_mode else 'Mock/Test'}")
        logger.info(f"  Sender Email: {self.sender_email}")
        logger.info(f"  Has API Key: {'Yes' if self.sendgrid_api_key else 'No'}")
        logger.info(f"  Is Test Mode: {self.is_test_mode}")
        logger.info(f"  ENV: {os.getenv('ENV', 'development')}")
        
    def generate_verification_token(self) -> str:
        """Generate a secure verification token"""
        return secrets.token_urlsafe(32)
    
    def get_verification_expiry(self) -> datetime:
        """Get verification token expiry time (24 hours from now)"""
        return datetime.utcnow() + timedelta(hours=24)
    
    async def send_verification_email(
        self, 
        recipient_email: str, 
        recipient_name: str, 
        verification_token: str
    ) -> bool:
        """Send email verification email"""
        try:
            if self.is_test_mode:
                logger.info(f"📧 [MOCK] Sending verification email to {recipient_email}")
                logger.info(f"📧 [MOCK] Verification token: {verification_token}")
                return True
            
            logger.info(f"📧 [REAL] Attempting to send verification email to {recipient_email}")
            
            subject = "🔐 Verify Your TravelApp Account"
            
            # Create verification URL
            base_url = os.getenv('FRONTEND_URL', 'http://localhost:8081')
            verification_url = f"{base_url}/auth/verify?token={verification_token}"
            
            # Create HTML email content
            html_content = self._create_verification_email_html(
                recipient_name, verification_url
            )
            
            # Create plain text version
            text_content = self._create_verification_email_text(
                recipient_name, verification_url
            )
            
            # Send email
            success = await self._send_email(
                recipient_email, subject, html_content, text_content
            )
            
            if success:
                logger.info(f"✅ Verification email sent to {recipient_email}")
            else:
                logger.error(f"❌ Failed to send verification email to {recipient_email}")
                
            return success
            
        except Exception as e:
            logger.error(f"❌ Error sending verification email: {str(e)}")
            return False
    
    async def send_welcome_email(
        self, 
        recipient_email: str, 
        recipient_name: str
    ) -> bool:
        """Send welcome email after successful verification"""
        try:
            if self.is_test_mode:
                logger.info(f"📧 [MOCK] Sending welcome email to {recipient_email}")
                return True
            
            subject = "🎉 Welcome to TravelApp!"
            
            # Create HTML email content
            html_content = self._create_welcome_email_html(recipient_name)
            
            # Create plain text version
            text_content = self._create_welcome_email_text(recipient_name)
            
            # Send email
            success = await self._send_email(
                recipient_email, subject, html_content, text_content
            )
            
            if success:
                logger.info(f"✅ Welcome email sent to {recipient_email}")
            else:
                logger.error(f"❌ Failed to send welcome email to {recipient_email}")
                
            return success
            
        except Exception as e:
            logger.error(f"❌ Error sending welcome email: {str(e)}")
            return False
    
    async def send_password_reset_email(
        self, 
        recipient_email: str, 
        recipient_name: str, 
        reset_token: str
    ) -> bool:
        """Send password reset email"""
        try:
            if self.is_test_mode:
                logger.info(f"📧 [MOCK] Sending password reset email to {recipient_email}")
                logger.info(f"📧 [MOCK] Reset token: {reset_token}")
                return True
            
            subject = "🔑 Reset Your TravelApp Password"
            
            # Create reset URL
            base_url = os.getenv('FRONTEND_URL', 'http://localhost:8081')
            reset_url = f"{base_url}/auth/reset-password?token={reset_token}"
            
            # Create HTML email content
            html_content = self._create_password_reset_email_html(
                recipient_name, reset_url
            )
            
            # Create plain text version
            text_content = self._create_password_reset_email_text(
                recipient_name, reset_url
            )
            
            # Send email
            success = await self._send_email(
                recipient_email, subject, html_content, text_content
            )
            
            if success:
                logger.info(f"✅ Password reset email sent to {recipient_email}")
            else:
                logger.error(f"❌ Failed to send password reset email to {recipient_email}")
                
            return success
            
        except Exception as e:
            logger.error(f"❌ Error sending password reset email: {str(e)}")
            return False
    
    async def send_itinerary_pdf_email(
        self, 
        recipient_email: str, 
        recipient_name: str, 
        itinerary_data: Dict,
        pdf_content: bytes
    ) -> bool:
        """Send itinerary PDF email"""
        try:
            if self.is_test_mode:
                logger.info(f"📧 [MOCK] Sending itinerary PDF email to {recipient_email}")
                return True
            
            subject = "📄 Your Travel Itinerary"
            
            # Create HTML email content
            html_content = self._create_itinerary_email_html(recipient_name, itinerary_data)
            
            # Create plain text version
            text_content = self._create_itinerary_email_text(recipient_name, itinerary_data)
            
            # Send email with PDF attachment
            success = await self._send_email_with_attachment(
                recipient_email, subject, html_content, text_content, pdf_content, "itinerary.pdf"
            )
            
            if success:
                logger.info(f"✅ Itinerary PDF email sent to {recipient_email}")
            else:
                logger.error(f"❌ Failed to send itinerary PDF email to {recipient_email}")
                
            return success
            
        except Exception as e:
            logger.error(f"❌ Error sending itinerary PDF email: {str(e)}")
            return False
        
    async def send_booking_confirmation(
        self, 
        recipient_email: str, 
        recipient_name: str, 
        booking_data: Dict,
        itinerary_data: Dict
    ) -> bool:
        """
        Send booking confirmation email with itinerary details
        
        Args:
            recipient_email: Customer's email address
            recipient_name: Customer's name
            booking_data: Booking information (confirmation number, cost, etc.)
            itinerary_data: Travel itinerary details
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            if self.is_test_mode:
                # Mock email sending for testing
                logger.info(f"📧 [MOCK] Sending confirmation email to {recipient_email}")
                logger.info(f"📧 [MOCK] Booking: {booking_data.get('confirmation_number', 'N/A')}")
                logger.info(f"📧 [MOCK] Total cost: ${booking_data.get('total_cost', 0)}")
                return True
            
            # Real email sending logic
            subject = f"🎉 Your Travel Booking Confirmation - {booking_data.get('confirmation_number', 'N/A')}"
            
            # Create HTML email content
            html_content = self._create_confirmation_email_html(
                recipient_name, booking_data, itinerary_data
            )
            
            # Create plain text version
            text_content = self._create_confirmation_email_text(
                recipient_name, booking_data, itinerary_data
            )
            
            # Send email
            success = await self._send_email(
                recipient_email, subject, html_content, text_content
            )
            
            if success:
                logger.info(f"✅ Confirmation email sent to {recipient_email}")
            else:
                logger.error(f"❌ Failed to send confirmation email to {recipient_email}")
                
            return success
            
        except Exception as e:
            logger.error(f"❌ Error sending confirmation email: {str(e)}")
            return False
    
    def _create_verification_email_html(self, recipient_name: str, verification_url: str) -> str:
        """Create HTML version of verification email"""
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your TravelApp Account</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f8f9fa; padding: 30px; }}
                .footer {{ background: #e9ecef; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }}
                .highlight {{ color: #6366f1; font-weight: bold; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔐 Verify Your Account</h1>
                    <p>Welcome to TravelApp!</p>
                </div>
                
                <div class="content">
                    <p>Dear <strong>{recipient_name}</strong>,</p>
                    
                    <p>Thank you for signing up for TravelApp! To complete your registration and start planning your next adventure, please verify your email address.</p>
                    
                    <p>Click the button below to verify your account:</p>
                    
                    <div style="text-align: center;">
                        <a href="{verification_url}" class="button">Verify Email Address</a>
                    </div>
                    
                    <p>Or copy and paste this link into your browser:</p>
                    <p><a href="{verification_url}">{verification_url}</a></p>
                    
                    <p><strong>This link will expire in 24 hours.</strong></p>
                    
                    <p>If you didn't create an account with TravelApp, you can safely ignore this email.</p>
                    
                    <p>Happy travels!</p>
                    <p><strong>The TravelApp Team</strong></p>
                </div>
                
                <div class="footer">
                    <p>Need help? Contact us at <a href="mailto:support@travelapp.com">support@travelapp.com</a></p>
                    <p>© 2024 TravelApp. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        return html
    
    def _create_verification_email_text(self, recipient_name: str, verification_url: str) -> str:
        """Create plain text version of verification email"""
        text = f"""
        🔐 VERIFY YOUR ACCOUNT
        
        Dear {recipient_name},
        
        Thank you for signing up for TravelApp! To complete your registration and start planning your next adventure, please verify your email address.
        
        Click the link below to verify your account:
        {verification_url}
        
        This link will expire in 24 hours.
        
        If you didn't create an account with TravelApp, you can safely ignore this email.
        
        Happy travels!
        The TravelApp Team
        
        Need help? Contact us at support@travelapp.com
        © 2024 TravelApp. All rights reserved.
        """
        return text
    
    def _create_welcome_email_html(self, recipient_name: str) -> str:
        """Create HTML version of welcome email"""
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to TravelApp!</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f8f9fa; padding: 30px; }}
                .footer {{ background: #e9ecef; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Welcome to TravelApp!</h1>
                    <p>Your account is now verified</p>
                </div>
                
                <div class="content">
                    <p>Dear <strong>{recipient_name}</strong>,</p>
                    
                    <p>Welcome to TravelApp! Your account has been successfully verified and you're now ready to start planning your next adventure.</p>
                    
                    <h2>🚀 What you can do now:</h2>
                    <ul>
                        <li>Browse destinations and travel inspiration</li>
                        <li>Create personalized itineraries</li>
                        <li>Book flights, hotels, and activities</li>
                        <li>Get AI-powered travel recommendations</li>
                        <li>Chat with our travel assistant</li>
                    </ul>
                    
                    <div style="text-align: center;">
                        <a href="http://localhost:8081" class="button">Start Planning</a>
                    </div>
                    
                    <p>We're excited to help you discover amazing destinations and create unforgettable travel experiences!</p>
                    
                    <p>Happy travels!</p>
                    <p><strong>The TravelApp Team</strong></p>
                </div>
                
                <div class="footer">
                    <p>Need help? Contact us at <a href="mailto:support@travelapp.com">support@travelapp.com</a></p>
                    <p>© 2024 TravelApp. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        return html
    
    def _create_welcome_email_text(self, recipient_name: str) -> str:
        """Create plain text version of welcome email"""
        text = f"""
        🎉 WELCOME TO TRAVELAPP!
        
        Dear {recipient_name},
        
        Welcome to TravelApp! Your account has been successfully verified and you're now ready to start planning your next adventure.
        
        🚀 WHAT YOU CAN DO NOW:
        - Browse destinations and travel inspiration
        - Create personalized itineraries
        - Book flights, hotels, and activities
        - Get AI-powered travel recommendations
        - Chat with our travel assistant
        
        Start planning: http://localhost:8081
        
        We're excited to help you discover amazing destinations and create unforgettable travel experiences!
        
        Happy travels!
        The TravelApp Team
        
        Need help? Contact us at support@travelapp.com
        © 2024 TravelApp. All rights reserved.
        """
        return text
    
    def _create_password_reset_email_html(self, recipient_name: str, reset_url: str) -> str:
        """Create HTML version of password reset email"""
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your TravelApp Password</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f8f9fa; padding: 30px; }}
                .footer {{ background: #e9ecef; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }}
                .warning {{ background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔑 Reset Your Password</h1>
                    <p>TravelApp Password Reset</p>
                </div>
                
                <div class="content">
                    <p>Dear <strong>{recipient_name}</strong>,</p>
                    
                    <p>We received a request to reset your TravelApp password. Click the button below to create a new password:</p>
                    
                    <div style="text-align: center;">
                        <a href="{reset_url}" class="button">Reset Password</a>
                    </div>
                    
                    <p>Or copy and paste this link into your browser:</p>
                    <p><a href="{reset_url}">{reset_url}</a></p>
                    
                    <div class="warning">
                        <p><strong>⚠️ Security Notice:</strong></p>
                        <ul>
                            <li>This link will expire in 1 hour</li>
                            <li>If you didn't request this reset, please ignore this email</li>
                            <li>Your password will not change unless you click the link above</li>
                        </ul>
                    </div>
                    
                    <p>If you have any questions, please contact our support team.</p>
                    
                    <p>Best regards,</p>
                    <p><strong>The TravelApp Team</strong></p>
                </div>
                
                <div class="footer">
                    <p>Need help? Contact us at <a href="mailto:support@travelapp.com">support@travelapp.com</a></p>
                    <p>© 2024 TravelApp. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        return html
    
    def _create_password_reset_email_text(self, recipient_name: str, reset_url: str) -> str:
        """Create plain text version of password reset email"""
        text = f"""
        🔑 RESET YOUR PASSWORD
        
        Dear {recipient_name},
        
        We received a request to reset your TravelApp password. Click the link below to create a new password:
        
        {reset_url}
        
        ⚠️ SECURITY NOTICE:
        - This link will expire in 1 hour
        - If you didn't request this reset, please ignore this email
        - Your password will not change unless you click the link above
        
        If you have any questions, please contact our support team.
        
        Best regards,
        The TravelApp Team
        
        Need help? Contact us at support@travelapp.com
        © 2024 TravelApp. All rights reserved.
        """
        return text
    
    def _create_itinerary_email_html(self, recipient_name: str, itinerary_data: Dict) -> str:
        """Create HTML version of itinerary email"""
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your Travel Itinerary</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f8f9fa; padding: 30px; }}
                .footer {{ background: #e9ecef; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📄 Your Travel Itinerary</h1>
                    <p>Ready for your adventure!</p>
                </div>
                
                <div class="content">
                    <p>Dear <strong>{recipient_name}</strong>,</p>
                    
                    <p>Your travel itinerary is ready! Please find the detailed PDF attached to this email.</p>
                    
                    <h2>📋 Trip Summary:</h2>
                    <p><strong>Destination:</strong> {itinerary_data.get('destination', 'N/A')}</p>
                    <p><strong>Duration:</strong> {itinerary_data.get('duration', 'N/A')}</p>
                    <p><strong>Total Cost:</strong> ${itinerary_data.get('total_cost', 0):,.2f}</p>
                    
                    <p>We hope you have an amazing trip! If you need any assistance, don't hesitate to contact us.</p>
                    
                    <p>Safe travels!</p>
                    <p><strong>The TravelApp Team</strong></p>
                </div>
                
                <div class="footer">
                    <p>Need help? Contact us at <a href="mailto:support@travelapp.com">support@travelapp.com</a></p>
                    <p>© 2024 TravelApp. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        return html
    
    def _create_itinerary_email_text(self, recipient_name: str, itinerary_data: Dict) -> str:
        """Create plain text version of itinerary email"""
        text = f"""
        📄 YOUR TRAVEL ITINERARY
        
        Dear {recipient_name},
        
        Your travel itinerary is ready! Please find the detailed PDF attached to this email.
        
        📋 TRIP SUMMARY:
        Destination: {itinerary_data.get('destination', 'N/A')}
        Duration: {itinerary_data.get('duration', 'N/A')}
        Total Cost: ${itinerary_data.get('total_cost', 0):,.2f}
        
        We hope you have an amazing trip! If you need any assistance, don't hesitate to contact us.
        
        Safe travels!
        The TravelApp Team
        
        Need help? Contact us at support@travelapp.com
        © 2024 TravelApp. All rights reserved.
        """
        return text

    def _create_confirmation_email_html(
        self, 
        recipient_name: str, 
        booking_data: Dict, 
        itinerary_data: Dict
    ) -> str:
        """Create HTML version of confirmation email"""
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Travel Booking Confirmation</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f8f9fa; padding: 30px; }}
                .footer {{ background: #e9ecef; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }}
                .booking-details {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }}
                .itinerary-summary {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }}
                .next-steps {{ background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; }}
                .highlight {{ color: #6366f1; font-weight: bold; }}
                .button {{ display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Booking Confirmed!</h1>
                    <p>Your travel adventure is officially booked</p>
                </div>
                
                <div class="content">
                    <p>Dear <strong>{recipient_name}</strong>,</p>
                    
                    <p>Thank you for choosing our travel service! Your booking has been confirmed and we're excited to help make your trip unforgettable.</p>
                    
                    <div class="booking-details">
                        <h2>📋 Booking Details</h2>
                        <p><strong>Confirmation Number:</strong> <span class="highlight">{booking_data.get('confirmation_number', 'N/A')}</span></p>
                        <p><strong>Total Cost:</strong> <span class="highlight">${booking_data.get('total_cost', 0):,.2f}</span></p>
                        <p><strong>Status:</strong> <span class="highlight">{booking_data.get('status', 'Confirmed')}</span></p>
                    </div>
                    
                    <div class="itinerary-summary">
                        <h2>✈️ Trip Summary</h2>
                        <p><strong>Destination:</strong> {itinerary_data.get('destination', 'N/A')}</p>
                        <p><strong>Duration:</strong> {itinerary_data.get('duration', 'N/A')}</p>
                        <p><strong>Travelers:</strong> {booking_data.get('itinerary_summary', {}).get('travelers', 1)}</p>
                    </div>
                    
                    <div class="next-steps">
                        <h2>📝 Next Steps</h2>
                        <ul>
                            <li>Check your email for detailed itinerary</li>
                            <li>Review travel documents and requirements</li>
                            <li>Download our mobile app for updates</li>
                            <li>Contact support if you have questions</li>
                        </ul>
                    </div>
                    
                    <p>We'll send you additional details about your flights, accommodations, and activities closer to your departure date.</p>
                    
                    <p>Safe travels!</p>
                    <p><strong>The VoyageYou Team</strong></p>
                </div>
                
                <div class="footer">
                    <p>Need help? Contact us at <a href="mailto:support@travelapp.com">support@travelapp.com</a></p>
                    <p>© 2024 VoyageYou. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html
    
    def _create_confirmation_email_text(
        self, 
        recipient_name: str, 
        booking_data: Dict, 
        itinerary_data: Dict
    ) -> str:
        """Create plain text version of confirmation email"""
        
        text = f"""
        🎉 BOOKING CONFIRMED!
        
        Dear {recipient_name},
        
        Thank you for choosing our travel service! Your booking has been confirmed and we're excited to help make your trip unforgettable.
        
        📋 BOOKING DETAILS
        Confirmation Number: {booking_data.get('confirmation_number', 'N/A')}
        Total Cost: ${booking_data.get('total_cost', 0):,.2f}
        Status: {booking_data.get('status', 'Confirmed')}
        
        ✈️ TRIP SUMMARY
        Destination: {itinerary_data.get('destination', 'N/A')}
        Duration: {itinerary_data.get('duration', 'N/A')}
        Travelers: {booking_data.get('itinerary_summary', {}).get('travelers', 1)}
        
        📝 NEXT STEPS
        - Check your email for detailed itinerary
        - Review travel documents and requirements
        - Download our mobile app for updates
        - Contact support if you have questions
        
        We'll send you additional details about your flights, accommodations, and activities closer to your departure date.
        
        Safe travels!
        The VoyageYou Team
        
        Need help? Contact us at support@travelapp.com
        © 2024 VoyageYou. All rights reserved.
        """
        
        return text
    
    async def _send_email(
        self, 
        recipient_email: str, 
        subject: str, 
        html_content: str, 
        text_content: str
    ) -> bool:
        """Send email via SendGrid API"""
        
        try:
            # Create SendGrid mail object
            message = Mail(
                from_email=self.sender_email,
                to_emails=recipient_email,
                subject=subject,
                html_content=html_content,
                plain_text_content=text_content
            )
            
            logger.info(f"📧 Sending email via SendGrid to {recipient_email}")
            response = self.sendgrid_client.send(message)
            logger.info(f"📧 SendGrid response status: {response.status_code}")
            
            if response.status_code in [200, 201, 202]:
                logger.info("📧 Email sent successfully via SendGrid!")
                return True
            else:
                logger.error(f"❌ SendGrid error: {response.status_code} - {response.body}")
                return False
            
        except Exception as e:
            logger.error(f"❌ SendGrid error: {str(e)}")
            return False
    
    async def _send_email_with_attachment(
        self, 
        recipient_email: str, 
        subject: str, 
        html_content: str, 
        text_content: str,
        attachment_content: bytes,
        attachment_filename: str
    ) -> bool:
        """Send email with attachment via SMTP"""
        
        try:
            # Create message
            message = MIMEMultipart("mixed")
            message["Subject"] = subject
            message["From"] = self.sender_email
            message["To"] = recipient_email
            
            # Create alternative part for HTML and text
            alternative_part = MIMEMultipart("alternative")
            
            # Add both HTML and text parts
            text_part = MIMEText(text_content, "plain")
            html_part = MIMEText(html_content, "html")
            
            alternative_part.attach(text_part)
            alternative_part.attach(html_part)
            
            message.attach(alternative_part)
            
            # Add attachment
            attachment_part = MIMEBase("application", "octet-stream")
            attachment_part.set_payload(attachment_content)
            encoders.encode_base64(attachment_part)
            attachment_part.add_header(
                "Content-Disposition",
                f"attachment; filename= {attachment_filename}"
            )
            message.attach(attachment_part)
            
            # Create SendGrid mail object with attachment
            message = Mail(
                from_email=self.sender_email,
                to_emails=recipient_email,
                subject=subject,
                html_content=html_content,
                plain_text_content=text_content
            )
            
            # Add attachment to SendGrid message
            import base64
            encoded_content = base64.b64encode(attachment_content).decode()
            message.attachment = {
                "content": encoded_content,
                "filename": attachment_filename,
                "type": "application/pdf",
                "disposition": "attachment"
            }
            
            logger.info(f"📧 Sending email with attachment via SendGrid to {recipient_email}")
            response = self.sendgrid_client.send(message)
            logger.info(f"📧 SendGrid response status: {response.status_code}")
            
            if response.status_code in [200, 201, 202]:
                logger.info("📧 Email with attachment sent successfully via SendGrid!")
                return True
            else:
                logger.error(f"❌ SendGrid error: {response.status_code} - {response.body}")
                return False
            
        except Exception as e:
            logger.error(f"❌ SendGrid error with attachment: {str(e)}")
            return False
    
    async def send_travel_updates(
        self, 
        recipient_email: str, 
        recipient_name: str, 
        update_type: str, 
        update_details: Dict
    ) -> bool:
        """Send travel updates (flight changes, hotel updates, etc.)"""
        
        try:
            if self.is_test_mode:
                logger.info(f"📧 [MOCK] Sending {update_type} update to {recipient_email}")
                return True
            
            # Real update email logic would go here
            return True
            
        except Exception as e:
            logger.error(f"❌ Error sending travel update: {str(e)}")
            return False

# Create global instance
email_service = EmailService() 