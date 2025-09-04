# Network Configuration Guide

## Problem
The mobile app needs to connect to the backend server running on your local machine. When you change WiFi networks, your IP address changes and the app can't connect anymore.

## Solutions

### Solution 1: Automatic IP Update Script (Recommended)

Run this command whenever you change networks:
```bash
npm run update-ip
```

Or use the dev command that updates IP automatically before starting:
```bash
npm run dev
```

### Solution 2: Manual Update

Edit the file `/mobile-app/src/services/api.ts` and update the IP address:
```javascript
// Change this line with your current IP
return 'http://192.168.1.135:3001/api';
```

To find your current IP:
- macOS: `ifconfig | grep "inet " | grep -v 127.0.0.1`
- Linux: `hostname -I`
- Windows: `ipconfig` (look for IPv4 Address)

### Solution 3: Environment Variables

Create or update `.env.local` file:
```env
EXPO_PUBLIC_API_IP=192.168.1.135
EXPO_PUBLIC_API_PORT=3001
```

Then restart the Expo server.

## Platform-Specific Notes

- **iOS Simulator**: Can use `localhost` if backend is on same machine
- **Android Emulator**: Use `10.0.2.2` instead of `localhost`
- **Physical Device**: Must use your computer's actual IP address

## Troubleshooting

1. **Network Error**: Check if backend is running (`npm run dev` in backend folder)
2. **Connection Refused**: Check firewall settings
3. **Wrong IP**: Run `npm run update-ip` to auto-detect current IP
4. **Still not working**: Restart both backend and Expo servers after IP change