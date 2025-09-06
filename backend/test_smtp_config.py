#!/usr/bin/env python3
"""
Test script to verify SMTP configuration and email functionality
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

async def test_smtp_configuration():
    """Test SMTP configuration and email sending functionality"""
    
    print("🧪 Testing SMTP Configuration for TravelApp")
    print("=" * 50)
    
    # Create email service instance
    email_service = EmailService()
    
    # Display current configuration
    print("\n📧 Current SMTP Configuration:")
    print(f"  SMTP Server: {email_service.smtp_server}")
    print(f"  SMTP Port: {email_service.smtp_port}")
    print(f"  Sender Email: {email_service.sender_email}")
    print(f"  Password Set: {'✅ Yes' if email_service.sender_password else '❌ No'}")
    print(f"  Test Mode: {'✅ Enabled' if email_service.is_test_mode else '❌ Disabled'}")
    
    # Check environment variables
    print("\n🔧 Environment Variables:")
    required_vars = ['SMTP_SERVER', 'SMTP_PORT', 'SENDER_EMAIL', 'SENDER_PASSWORD']
    for var in required_vars:
        value = os.getenv(var)
        if var == 'SENDER_PASSWORD':
            status = '✅ Set' if value else '❌ Missing'
        else:
            status = f'✅ {value}' if value else '❌ Missing'
        print(f"  {var}: {status}")
    
    # Test email methods
    print("\n🧪 Testing Email Methods:")
    
    test_email = "test@example.com"
    test_name = "Test User"
    
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
    
    # Test password reset email
    print("\n3. Testing Password Reset Email...")
    try:
        reset_token = "test-reset-token-123"
        success = await email_service.send_password_reset_email(test_email, test_name, reset_token)
        print(f"   ✅ Password reset email: {'Success' if success else 'Failed'}")
    except Exception as e:
        print(f"   ❌ Password reset email failed: {str(e)}")
    
    # Test booking confirmation email
    print("\n4. Testing Booking Confirmation Email...")
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
    
    # Test itinerary PDF email
    print("\n5. Testing Itinerary PDF Email...")
    try:
        itinerary_data = {
            'destination': 'Tokyo, Japan',
            'duration': '10 days',
            'total_cost': 2199.99
        }
        pdf_content = b"Mock PDF content for testing"
        success = await email_service.send_itinerary_pdf_email(
            test_email, test_name, itinerary_data, pdf_content
        )
        print(f"   ✅ Itinerary PDF email: {'Success' if success else 'Failed'}")
    except Exception as e:
        print(f"   ❌ Itinerary PDF email failed: {str(e)}")
    
    print("\n" + "=" * 50)
    print("🎯 SMTP Test Complete!")
    
    # Recommendations
    print("\n📋 Recommendations:")
    if not os.getenv('SENDER_PASSWORD'):
        print("  ❌ Set SENDER_PASSWORD environment variable with your Gmail app password")
    if not os.getenv('SENDER_EMAIL'):
        print("  ❌ Set SENDER_EMAIL environment variable with your Gmail address")
    if email_service.is_test_mode:
        print("  ℹ️  Currently in test mode - emails are mocked")
        print("  ℹ️  Set ENV=production to enable real email sending")
    else:
        print("  ✅ Production mode enabled - emails will be sent via SMTP")
    
    print("\n🚀 Ready for Railway deployment with Gmail SMTP!")

def test_gmail_app_password():
    """Test if Gmail app password is properly formatted"""
    password = os.getenv('SENDER_PASSWORD', '')
    
    print("\n🔐 Gmail App Password Validation:")
    if not password:
        print("  ❌ No password set")
        return False
    
    # Gmail app passwords are typically 16 characters
    if len(password) == 16 and password.isalnum():
        print(f"  ✅ Password format looks correct (16 characters)")
        return True
    else:
        print(f"  ⚠️  Password length: {len(password)} characters")
        print(f"  ⚠️  Expected: 16 alphanumeric characters")
        if ' ' in password:
            print("  ❌ Password contains spaces - remove them!")
        return False

if __name__ == "__main__":
    print("🚀 TravelApp SMTP Configuration Test")
    print("This script tests email functionality for Railway deployment")
    print()
    
    # Test Gmail app password format
    test_gmail_app_password()
    
    # Run async SMTP tests
    asyncio.run(test_smtp_configuration())
