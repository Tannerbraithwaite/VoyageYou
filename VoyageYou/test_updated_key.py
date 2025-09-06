#!/usr/bin/env python3
"""
Test updated SendGrid API key
"""
import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

# Get the API key from environment or use the one from .env
api_key = os.getenv('SENDGRID_API_KEY', '')
if not api_key:
    # Try to read from .env file
    try:
        with open('.env', 'r') as f:
            for line in f:
                if line.startswith('SENDGRID_API_KEY='):
                    api_key = line.split('=', 1)[1].strip()
                    break
    except:
        pass

print("🔍 Checking Updated API Key")
print("=" * 30)
print(f"API Key: {api_key[:10]}...{api_key[-10:] if len(api_key) > 20 else 'SHORT'}")
print(f"Length: {len(api_key)} characters")
print(f"Starts with 'SG.': {'✅ Yes' if api_key.startswith('SG.') else '❌ No'}")

if not api_key:
    print("❌ No API key found in environment or .env file")
    exit(1)

# Set the API key
os.environ['SENDGRID_API_KEY'] = api_key

def test_sendgrid():
    print("\n🧪 Testing SendGrid with Updated API Key...")
    print("=" * 40)
    
    message = Mail(
        from_email='tannerbraithwaite@gmail.com',
        to_emails='tannerbraithwaite@gmail.com',
        subject='Test Email from VoyageYou - Updated Key',
        html_content='<strong>SendGrid is working with updated key!</strong><br><p>This is a test email from your VoyageYou.</p>'
    )
    
    try:
        sg = SendGridAPIClient(api_key)
        response = sg.send(message)
        
        print(f"✅ Email sent successfully!")
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.body}")
        
        if response.status_code in [200, 201, 202]:
            print("\n�� SUCCESS! Check your email inbox!")
            return True
        else:
            print(f"\n⚠️ Unexpected status code: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error sending email: {e}")
        if hasattr(e, 'body'):
            print(f"Error body: {e.body}")
        return False

if __name__ == "__main__":
    test_sendgrid()
