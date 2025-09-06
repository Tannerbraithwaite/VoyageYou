#!/usr/bin/env python3
"""
Test SendGrid email service
"""
import asyncio
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the backend directory to Python path
sys.path.append(os.path.dirname(__file__))

from email_service import EmailService

async def test_sendgrid_service():
    """Test SendGrid email service functionality"""
    
    print("🧪 Testing SendGrid Email Service")
    print("=" * 40)
    
    # Create email service instance
    email_service = EmailService()
    
    # Display current configuration
    print("\n📧 SendGrid Configuration:")
    print(f"  Service: {'SendGrid' if not email_service.is_test_mode else 'Mock/Test'}")
    print(f"  Sender Email: {email_service.sender_email}")
    print(f"  Has API Key: {'Yes' if email_service.sendgrid_api_key else 'No'}")
    print(f"  Test Mode: {'Enabled' if email_service.is_test_mode else 'Disabled'}")
    
    # Test email methods
    print("\n🧪 Testing Email Methods:")
    
    test_email = "tannerbraithwaite@gmail.com"
    test_name = "Tanner Braithwaite"
    
    # Test verification email
    print("\n1. Testing Verification Email...")
    try:
        token = email_service.generate_verification_token()
        success = await email_service.send_verification_email(test_email, test_name, token)
        print(f"   ✅ Verification email: {'Success' if success else 'Failed'}")
    except Exception as e:
        print(f"   ❌ Verification email failed: {str(e)}")
    
    # Test welcome email
    print("\n2. Testing Welcome Email...")
    try:
        success = await email_service.send_welcome_email(test_email, test_name)
        print(f"   ✅ Welcome email: {'Success' if success else 'Failed'}")
    except Exception as e:
        print(f"   ❌ Welcome email failed: {str(e)}")
    
    # Test booking confirmation email
    print("\n3. Testing Booking Confirmation Email...")
    try:
        booking_data = {
            'confirmation_number': 'TRV-12345',
            'total_cost': 1299.99,
            'status': 'Confirmed'
        }
        itinerary_data = {
            'destination': 'Paris, France',
            'duration': '7 days',
            'total_cost': 1299.99
        }
        success = await email_service.send_booking_confirmation(
            test_email, test_name, booking_data, itinerary_data
        )
        print(f"   ✅ Booking confirmation email: {'Success' if success else 'Failed'}")
    except Exception as e:
        print(f"   ❌ Booking confirmation email failed: {str(e)}")
    
    print("\n" + "=" * 40)
    print("🎯 SendGrid Test Complete!")
    
    if not email_service.is_test_mode:
        print("✅ Production mode enabled - emails sent via SendGrid!")
    else:
        print("ℹ️  Test mode enabled - emails are mocked")

if __name__ == "__main__":
    print("🚀 Voyage Yo SendGrid Email Service Test")
    print("This script tests SendGrid email functionality")
    print()
    
    # Run async SendGrid tests
    asyncio.run(test_sendgrid_service())
