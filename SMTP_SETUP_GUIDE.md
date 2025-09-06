# 📧 Gmail SMTP Setup Guide for Voyage Yo

## 🎯 **Gmail SMTP Configuration**

### **Setup Time**: 10 minutes  
### **Cost**: Free  
### **Daily Limit**: 500 emails (Gmail limit)
### **Perfect for**: Testing and initial deployment

---

## 📧 **Gmail SMTP Setup (Step-by-Step)**

### **Step 1: Enable 2-Factor Authentication**
1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Click "Security" in the left sidebar
3. Under "Signing in to Google," click "2-Step Verification"
4. Follow the steps to turn on 2FA
5. **Note**: This is required to generate app passwords

### **Step 2: Generate App Password**
1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Select "Mail" from the dropdown menu
3. Click "Generate"
4. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)
5. **Important**: This is NOT your regular Gmail password

### **Step 3: Configure Railway Environment Variables**
Add these to your Railway project environment variables:

```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SENDER_EMAIL=your-email@gmail.com
SENDER_PASSWORD=your-16-char-app-password
```

**Railway Dashboard Steps:**
1. Go to your Railway project
2. Click on your service
3. Go to "Variables" tab
4. Add each environment variable
5. Click "Deploy" to apply changes

### **Step 4: Test Email Functionality**
The app will automatically test email sending for:
- User registration verification
- Password reset emails
- Booking confirmations
- Welcome emails

---

## 🔧 **Email Functionality in Voyage Yo**

### **Email Types Sent via Gmail SMTP:**
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

### **Check Email Logs:**
```bash
# Railway logs
railway logs

# Check for email errors
railway logs | grep -i email
railway logs | grep -i smtp
```

---

## ⚠️ **Common Gmail SMTP Issues & Solutions**

### **"Invalid credentials" Error:**
- **Problem**: Using regular Gmail password instead of app password
- **Solution**: Generate app password and use that instead

### **"2FA required" Error:**
- **Problem**: 2-factor authentication not enabled
- **Solution**: Enable 2FA on your Gmail account first

### **"Less secure app access" Error:**
- **Problem**: Trying to use less secure app access
- **Solution**: Use app passwords instead (more secure)

### **"Rate limit exceeded" Error:**
- **Problem**: Exceeded Gmail's 500 emails/day limit
- **Solution**: Wait 24 hours or upgrade to SendGrid

### **"Authentication failed" Error:**
- **Problem**: Incorrect app password or email
- **Solution**: Double-check app password and sender email

---

## 📊 **Gmail SMTP Monitoring**

### **Check Email Sending Status:**
```bash
# View Railway logs
railway logs

# Filter for email-related logs
railway logs | grep -i "email\|smtp\|mail"

# Check for errors
railway logs | grep -i "error\|failed"
```

### **Test Email Endpoint:**
```bash
# Test email functionality
curl -X POST https://your-app.railway.app/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### **Monitor Gmail Usage:**
- Gmail has a 500 emails/day limit
- Monitor usage in Railway logs
- Consider SendGrid for higher limits

---

## 🎯 **Production Considerations**

### **When to Upgrade from Gmail:**
- **More than 500 emails/day** needed
- **Professional email domain** required
- **Advanced email analytics** needed
- **Higher deliverability** required

### **Recommended Upgrades:**
1. **SendGrid** - 100 emails/day free, then $14.95/month
2. **Mailgun** - 5,000 emails/month free
3. **Amazon SES** - Very cost-effective for high volume

### **Migration Path:**
1. Start with Gmail SMTP for testing
2. Monitor email usage and deliverability
3. Upgrade to SendGrid when approaching limits
4. Update environment variables in Railway

---

## 💡 **Pro Tips**

1. **Use a dedicated Gmail account** for your app emails
2. **Keep app password secure** - don't commit to git
3. **Monitor email logs** regularly for issues
4. **Test email functionality** after every deployment
5. **Have a backup plan** ready for when you hit Gmail limits

---

## 🔧 **Troubleshooting Checklist**

- [ ] 2FA enabled on Gmail account
- [ ] App password generated (16 characters)
- [ ] Environment variables set in Railway
- [ ] SMTP_SERVER=smtp.gmail.com
- [ ] SMTP_PORT=587
- [ ] SENDER_EMAIL matches Gmail account
- [ ] SENDER_PASSWORD is app password (not regular password)
- [ ] Railway deployment successful
- [ ] Email functionality tested

---

**📧 Ready to set up Gmail SMTP? Follow the steps above and you'll have email functionality working in 10 minutes!**
