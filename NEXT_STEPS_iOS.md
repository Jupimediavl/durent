# iOS Build pentru Push Notifications - Pași Următori

## 🍎 Pentru build iOS cu push notifications:

### 1. **Apple Developer Account necesar**
- Ai nevoie de Apple Developer Account ($99/an)
- Sau folosește Apple ID personal pentru testing

### 2. **Build comandă manuală**
```bash
cd /Users/jupi/Desktop/duRent/mobile-app
eas build --platform ios --profile development
```

### 3. **La prompt-uri:**
- "Do you want to log in to your Apple account?" → **Y**
- Introdu Apple ID și password
- EAS va genera automat certificatele pentru push notifications

### 4. **După build (10-15 min):**
- Download IPA file de pe expo.dev
- Instalează pe iPhone via Xcode sau TestFlight

### 5. **Testare push notifications:**
```bash
curl -X POST http://TU_IP:4000/api/notifications/test-push \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
```

## ✅ Ce e deja configurat:
- ✅ Project ID: f264faa5-1e10-4a54-b6cc-0e245c51b150
- ✅ Bundle ID: com.durent.app
- ✅ expo-dev-client instalat
- ✅ Notification plugins configurate
- ✅ Backend pregătit pentru push notifications

## 🔥 Alternativă Android:
Dacă nu ai Apple Developer account, folosește build-ul Android care e mai simplu și gratuit.

## 📱 Pentru producție:
După testare, folosește profile "production" pentru App Store.