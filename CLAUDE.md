# duRent - Dubai Rental Management Platform

## Overview
Fresh implementation of duRent rental management app for Dubai market with landlord-tenant onboarding system.

## Project Structure
```
duRent/
├── backend/          # Express.js + TypeScript API
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── server.ts
│   └── prisma/       # SQLite database
└── mobile-app/       # React Native + Expo
    └── src/
        ├── screens/auth/
        ├── services/
        └── store/
```

## Backend (Port 4000)
- **Framework**: Express.js + TypeScript
- **Database**: SQLite with Prisma ORM
- **Auth**: JWT + bcrypt

### API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/properties` - Create property (landlord only)
- `POST /api/invites/generate` - Generate invite code
- `POST /api/invites/accept` - Accept invite code

### Features Implemented
✅ User registration/login with JWT
✅ Role-based access (LANDLORD/TENANT)
✅ Property creation
✅ Invite code system for landlord-tenant connection

## Mobile App
- **Framework**: React Native + Expo
- **State**: Redux Toolkit
- **Navigation**: React Navigation

### Screens Implemented
✅ Login screen
✅ Registration screen with user type selection

## Development Commands

### Backend
```bash
cd backend
npm run dev    # Start server on port 4000
npm run build  # Compile TypeScript
```

### Mobile App
```bash
cd mobile-app
npm start      # Start Expo dev server
npm run ios    # iOS simulator
npm run android # Android emulator
```

## Testing Status
✅ Backend server running successfully on port 4000
✅ Database setup with SQLite
✅ Authentication endpoints working
✅ User registration/login tested

## Next Steps
- Add dashboard screens for landlord/tenant
- Implement property listing and invite flows
- Add form validation and error handling
- Test complete user journey