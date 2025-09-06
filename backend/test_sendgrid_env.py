#!/usr/bin/env python3
"""
Test SendGrid with environment variables
"""
import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_sendgrid():
    api_key = os.getenv('SENDGRID_API_KEY', '')
    print(f'API Key: {api_key[:10]}...{api_key[-10:] if len(api_key) > 20 else "SHORT"}')
    print(f'Length: {len(api_key)} characters')
    print(f'Starts with SG.: {"✅ Yes" if api_key.startswith("SG.") else "❌ No"}')
    
    if not api_key:
        print('❌ No API key found')
        return False
    
    try:
        message = Mail(
            from_email='tannerbraithwaite@gmail.com',
            to_emails='tannerbraithwaite@gmail.com',
            subject='Test Email from VoyageYou',
            html_content='<strong>SendGrid is working!</strong><br><p>This is a test email from your VoyageYou.</p>'
        )
        
        sg = SendGridAPIClient(api_key)
        response = sg.send(message)
        
        print(f'✅ Email sent successfully!')
        print(f'Status Code: {response.status_code}')
        print(f'Response Body: {response.body}')
        
        if response.status_code in [200, 201, 202]:
            print('🎉 SUCCESS! Check your email inbox!')
            return True
        else:
            print(f'⚠️ Unexpected status code: {response.status_code}')
            return False
            
    except Exception as e:
        print(f'❌ Error sending email: {e}')
        if hasattr(e, 'body'):
            print(f'Error body: {e.body}')
        return False

if __name__ == "__main__":
    test_sendgrid()
