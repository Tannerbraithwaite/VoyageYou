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
from typing import List, Dict, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        # Email configuration - in production, these would be environment variables
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.sender_email = os.getenv('SENDER_EMAIL', 'noreply@travelapp.com')
        self.sender_password = os.getenv('SENDER_PASSWORD', '')
        
        # For testing purposes, we'll use a mock service
        self.is_test_mode = True
        
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
                    <p><strong>The Travel App Team</strong></p>
                </div>
                
                <div class="footer">
                    <p>Need help? Contact us at <a href="mailto:support@travelapp.com">support@travelapp.com</a></p>
                    <p>© 2024 Travel App. All rights reserved.</p>
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
        The Travel App Team
        
        Need help? Contact us at support@travelapp.com
        © 2024 Travel App. All rights reserved.
        """
        
        return text
    
    async def _send_email(
        self, 
        recipient_email: str, 
        subject: str, 
        html_content: str, 
        text_content: str
    ) -> bool:
        """Send email via SMTP"""
        
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = self.sender_email
            message["To"] = recipient_email
            
            # Add both HTML and text parts
            text_part = MIMEText(text_content, "plain")
            html_part = MIMEText(html_content, "html")
            
            message.attach(text_part)
            message.attach(html_part)
            
            # Create secure connection and send email
            context = ssl.create_default_context()
            
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls(context=context)
                server.login(self.sender_email, self.sender_password)
                server.sendmail(self.sender_email, recipient_email, message.as_string())
            
            return True
            
        except Exception as e:
            logger.error(f"❌ SMTP error: {str(e)}")
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