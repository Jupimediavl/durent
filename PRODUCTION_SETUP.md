# duRent Production Setup

## 🚀 Current Status
✅ Backend successfully deployed to Railway  
✅ PostgreSQL database configured  
✅ Mobile app configured for production API switching  
⚠️ Need correct Railway deployment URL  

## 📱 Mobile App Configuration

The mobile app is now configured to switch between development and production APIs using environment variables.

### Current Configuration:
- **Development**: Uses local IP `http://192.168.1.135:4000/api`  
- **Production**: Ready to use Railway URL (needs correct URL)  

### Switching to Production:
1. Open `/mobile-app/.env.local`
2. Change `EXPO_PUBLIC_ENV=development` to `EXPO_PUBLIC_ENV=production`
3. Update `EXPO_PUBLIC_PRODUCTION_API_URL` with correct Railway URL

## 🔧 Finding Railway URL

### Option 1: Railway Web Dashboard
1. Go to [railway.app](https://railway.app)
2. Sign in to your account
3. Open the duRent project
4. Go to your backend service
5. Look for the deployment URL (usually shows as "Domain" or "Public URL")

### Option 2: Railway CLI
```bash
# Install CLI (already done)
npm install -g @railway/cli

# Login to Railway
railway login

# Check project status
railway status

# Get domain info
railway domain
```

### Option 3: Try Common Patterns
Railway URLs typically follow these patterns:
- `https://[service-name]-production-[hash].up.railway.app`
- `https://web-production-[hash].up.railway.app`

## 📋 Next Steps

1. **Get Railway URL**: Use one of the methods above to find the correct deployment URL
2. **Update Configuration**: Replace the placeholder URL in `.env.local`
3. **Test Connection**: Verify the production API works
4. **Create Production Build**: Build the mobile app for distribution

## 🔗 Current Files Updated

### `/mobile-app/src/services/api.ts`
- Enhanced environment detection
- Flexible URL switching
- Production fallback configuration

### `/mobile-app/.env.local`
- Added production environment variables
- Easy switching between dev/prod modes

## 💡 Quick Switch Commands

**Switch to Development:**
```
EXPO_PUBLIC_ENV=development
```

**Switch to Production:**
```
EXPO_PUBLIC_ENV=production
```

## 🛠️ Testing Production Connection

Once you have the correct URL, test it:
```bash
curl https://your-railway-url.up.railway.app/health
```

Should return:
```json
{"status":"OK","message":"duRent API is running"}
```