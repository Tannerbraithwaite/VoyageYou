#!/usr/bin/env python3
"""
Simple SendGrid test script
"""
import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

# Set your API key
os.environ['SENDGRID_API_KEY'] = 'nvruow54^@VTewnfu58ewsF$*@WVtdG5ewnsjvfinu4i'

def test_sendgrid():
    print("🧪 Testing SendGrid API Key...")
    print("=" * 40)
    
    message = Mail(
        from_email='tannerbraithwaite@gmail.com',
        to_emails='tannerbraithwaite@gmail.com',
        subject='Test Email from Travel App',
        html_content='<strong>SendGrid is working!</strong><br><p>This is a test email from your Travel App.</p>'
    )
    
    try:
        sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
        response = sg.send(message)
        
        print(f"✅ Email sent successfully!")
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.body}")
        print(f"Response Headers: {response.headers}")
        
        if response.status_code in [200, 201, 202]:
            print("\n🎉 SUCCESS! Check your email inbox!")
        else:
            print(f"\n⚠️ Unexpected status code: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error sending email: {e}")
        if hasattr(e, 'message'):
            print(f"Error message: {e.message}")
        if hasattr(e, 'body'):
            print(f"Error body: {e.body}")

if __name__ == "__main__":
    test_sendgrid()
