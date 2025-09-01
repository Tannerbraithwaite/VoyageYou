# 📧 SMTP Email Setup Guide for TravelApp

## 🎯 **Quick Setup Options**

### **Option 1: Gmail SMTP (Recommended for Testing)**
**Setup Time**: 10 minutes  
**Cost**: Free  
**Daily Limit**: 500 emails (Gmail limit)

### **Option 2: SendGrid (Recommended for Production)**
**Setup Time**: 15 minutes  
**Cost**: Free tier (100 emails/day)  
**Daily Limit**: 100 emails (free tier)

### **Option 3: Mailgun (Alternative)**
**Setup Time**: 15 minutes  
**Cost**: Free tier (5,000 emails/month)  
**Daily Limit**: ~167 emails (free tier)

---

## 📧 **Gmail SMTP Setup (Recommended)**

### **Step 1: Enable 2-Factor Authentication**
1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Click "Security" in the left sidebar
3. Under "Signing in to Google," click "2-Step Verification"
4. Follow the steps to turn on 2FA

### **Step 2: Generate App Password**
1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Select "Mail" from the dropdown
3. Click "Generate"
4. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### **Step 3: Configure Environment Variables**
Add these to your Railway/Render environment variables:
```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SENDER_EMAIL=your-email@gmail.com
SENDER_PASSWORD=your-16-char-app-password
```

### **Step 4: Test Email Functionality**
The app will automatically test email sending for:
- User registration verification
- Password reset emails
- Booking confirmations
- Welcome emails

---

## �� **SendGrid Setup (Production)**

### **Step 1: Create SendGrid Account**
1. Go to [sendgrid.com](https://sendgrid.com)
2. Sign up for free account
3. Verify your email address

### **Step 2: Create API Key**
1. Go to Settings → API Keys
2. Click "Create API Key"
3. Name it "TravelApp API Key"
4. Select "Restricted Access" → "Mail Send"
5. Click "Create & View"
6. Copy the API key

### **Step 3: Configure Environment Variables**
```env
SMTP_SERVER=smtp.sendgrid.net
SMTP_PORT=587
SENDER_EMAIL=noreply@yourdomain.com
SENDER_PASSWORD=your-sendgrid-api-key
```

---

## 🔧 **Email Functionality in TravelApp**

### **Email Types Sent:**
1. **User Registration Verification**
   - Sent when user signs up
   - Contains verification link
   - Required for account activation

2. **Password Reset Emails**
   - Sent when user requests password reset
   - Contains secure reset link
   - Time-limited token

3. **Welcome Emails**
   - Sent after successful registration
   - Welcome message and app introduction

4. **Booking Confirmations**
   - Sent when booking is completed
   - Contains itinerary details
   - PDF attachment option

5. **Travel Updates**
   - Flight changes
   - Hotel updates
   - Itinerary modifications

---

## 🧪 **Testing Email Functionality**

### **Test User Registration:**
1. Create new account in app
2. Check email for verification link
3. Click verification link
4. Account should be activated

### **Test Password Reset:**
1. Go to login screen
2. Click "Forgot Password"
3. Enter email address
4. Check email for reset link
5. Click reset link and set new password

### **Test Booking Confirmation:**
1. Complete a booking in the app
2. Check email for confirmation
3. Verify booking details are correct

---

## ⚠️ **Common Issues & Solutions**

### **Gmail Issues:**
- **"Invalid credentials"**: Make sure you're using app password, not regular password
- **"2FA required"**: Enable 2-factor authentication first
- **"Less secure app access"**: Use app passwords instead

### **SendGrid Issues:**
- **"Authentication failed"**: Check API key is correct
- **"Sender not verified"**: Verify your sender email in SendGrid
- **"Rate limit exceeded"**: Upgrade to paid plan

### **General SMTP Issues:**
- **Port 587**: Use port 587 for TLS, not 465
- **SSL/TLS**: Make sure STARTTLS is enabled
- **Firewall**: Check if port 587 is blocked

---

## 📊 **Email Monitoring**

### **Check Email Logs:**
```bash
# Railway logs
railway logs

# Check for email errors
railway logs | grep -i email
railway logs | grep -i smtp
```

### **Test Email Endpoint:**
```bash
# Test email functionality
curl -X POST https://your-app.railway.app/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

---

## 🎯 **Production Recommendations**

1. **Use SendGrid or Mailgun** for production
2. **Set up email monitoring** and alerts
3. **Implement email templates** for consistency
4. **Add email analytics** to track engagement
5. **Set up bounce handling** for invalid emails

---

**📧 Ready to set up email functionality? Start with Gmail SMTP for testing!**
