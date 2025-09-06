# 📱 Mobile Setup Guide - VoyageYou with Railway Backend

## 🚀 Quick Start

Your VoyageYou is now configured to use your Railway backend for mobile development!

### 1. **Install Expo Go App**
- **iOS**: Download "Expo Go" from the App Store
- **Android**: Download "Expo Go" from Google Play Store

### 2. **Start the App**
The Expo development server should be running. You'll see a QR code in your terminal.

**To scan the QR code:**
- **iOS**: Open Camera app and point at QR code
- **Android**: Open Expo Go app and tap "Scan QR Code"

### 3. **Backend Connection**
- **Mobile**: Uses Railway backend (`https://travel-app-demo-production.up.railway.app`)
- **Web**: Still uses localhost (`http://localhost:8000`) for development
- **No local backend needed** - your Railway deployment handles everything!

## 🔧 Configuration Details

### API Configuration
- **File**: `frontend/config/api.ts`
- **Mobile**: Automatically uses Railway backend
- **Web**: Uses localhost for development
- **Smart switching**: Platform detection handles the routing

### App Configuration
- **Name**: VoyageYou
- **Slug**: travel-app-demo
- **Scheme**: voyageyo

## ✅ What's Working

Your mobile app will now:
- ✅ **Connect to Railway backend** automatically
- ✅ **Use LangChain chat** with conversation context
- ✅ **Generate real itineraries** with hotels, flights, and events
- ✅ **Work from anywhere** - no need to be on the same WiFi
- ✅ **Access all features** - profile, location, booking, etc.

## 🧪 Testing Your App

Once connected, test these features:
1. **Chat Interface** - "Plan me a trip from Vancouver to Victoria this weekend"
2. **Location Detection** - Allow location permissions
3. **Profile Management** - Update travel preferences
4. **Real-time Itinerary** - Get detailed travel plans with real data
5. **Conversation Memory** - Ask follow-up questions

## 🛠️ Troubleshooting

### If the app can't connect:
1. **Check Railway**: Visit `https://travel-app-demo-production.up.railway.app` in your browser
2. **Check logs**: Look at Railway deployment logs for any issues
3. **Restart Expo**: Stop and restart `npx expo start`

### If Expo Go doesn't work:
1. **Clear cache**: Run `npx expo start --clear`
2. **Check network**: Try using tunnel mode: `npx expo start --tunnel`
3. **Update Expo Go**: Make sure you have the latest version

## 🎉 Benefits of Railway Backend

- **Always available** - 24/7 uptime
- **No local setup** - works from anywhere
- **Production ready** - same backend as your deployed app
- **Scalable** - handles multiple users
- **Reliable** - cloud infrastructure

## 📞 Support

If you encounter any issues:
1. Check Railway deployment status
2. Verify API endpoints are working
3. Check Expo development server logs
4. Test backend directly in browser

Your VoyageYou is now ready for mobile testing with your Railway backend! 🚀
