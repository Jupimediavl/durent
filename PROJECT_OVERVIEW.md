# duRent - Dubai Rental Management Platform

## 🏢 Project Overview
duRent is a comprehensive rental management platform designed specifically for the Dubai real estate market. It connects landlords and tenants through a mobile-first application, streamlining property management, rent payments, and communication.

## 🎯 Core Purpose
- **For Landlords**: Manage multiple properties, track tenants, collect rent, handle end-of-lease requests
- **For Tenants**: Pay rent, communicate with landlords, track payment history, browse available properties
- **Market Focus**: Dubai, UAE with specific regulatory and market requirements

## 🏗️ Technical Architecture

### Backend (Port 4000)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Authentication**: JWT tokens with bcrypt
- **File Storage**: Local uploads + Supabase storage ready
- **Real-time**: Push notifications via Expo

### Mobile App
- **Framework**: React Native with Expo
- **State Management**: Redux Toolkit
- **Navigation**: React Navigation
- **UI Components**: Custom components with Linear Gradients
- **Styling**: Futuristic dark theme with gradient accents

### Database Schema Highlights
- Users (landlords/tenants)
- Properties (40+ Dubai-specific fields)
- RentalRelationships (connects properties to tenants)
- Payments (with verification system)
- Messages (in-app chat)
- EndRequests (rental termination management)
- Notifications (push notification support)

## 🚀 Key Features Implemented

### Authentication & Onboarding
✅ User registration with role selection (LANDLORD/TENANT)
✅ JWT-based authentication
✅ Role-based access control
✅ Push notification token management

### Property Management
✅ Comprehensive property creation with Dubai-specific fields:
   - Property types (Apartment, Villa, Studio, Townhouse, Penthouse)
   - Furnishing status (Furnished, Semi-furnished, Unfurnished)
   - Financial details (security deposit, DEWA, commission)
   - Utilities (AC type, chiller payments, included services)
   - Amenities (pool, gym, security, etc.)
   - Rules & restrictions (tenant type, pets, smoking)
   - Legal documentation (RERA permit, municipality numbers)
✅ Property photo gallery with multiple image upload
✅ Property availability management (Available, Ending Soon, Available Soon)
✅ Property search with filters (location, price, bedrooms)
✅ Property deletion with tenant verification

### Tenant Onboarding System
✅ Invite code generation by landlords
✅ 6-character alphanumeric codes
✅ Tenant joins property via invite code
✅ Automatic rental relationship creation

### Payment Management
✅ Monthly payment generation
✅ Payment proof upload (image/receipt)
✅ Payment verification workflow:
   - Tenant submits payment with proof
   - Status changes to VERIFICATION
   - Landlord reviews and approves/rejects
✅ Payment history tracking
✅ Overdue payment notifications
✅ Grace period system

### Communication
✅ In-app messaging between landlord and tenant
✅ Conversation view with unread counts
✅ Property-specific chat threads
✅ Read receipts

### Rental End Management
✅ End rental request system:
   - Either party can initiate
   - 7-day auto-accept period
   - Reason/message support
   - Cancel request option
✅ Proper status tracking (PENDING, ACCEPTED, AUTO_ACCEPTED)
✅ UI indicators for ending rentals

### Notifications
✅ Push notification infrastructure
✅ In-app notification center
✅ Notification preferences per user
✅ Types: Payment reminders, messages, end requests, etc.

### Dashboard Features
**Landlord Dashboard:**
- Property overview with tenant counts
- Monthly income calculation
- Quick actions (Add Property, Messages)
- End request notifications
- Statistics (properties, tenants, income)

**Tenant Dashboard (Simplified):**
- Main actions only: Join Property, Chat, Payments, Past Rentals
- Find New Home search option
- Current rental status
- Upcoming payment reminders

## 📱 UI/UX Design Principles
- **Dark Theme**: Deep blue/purple gradients (#0F0F23, #1A1A2E, #16213E)
- **Accent Colors**: Purple to pink gradients for CTAs
- **Typography**: All caps for headers, high letter-spacing
- **Components**: Custom dropdowns, not native pickers
- **Cards**: Gradient backgrounds with glow effects
- **Forms**: Dark inputs with subtle borders

## 🔧 Current Technical Challenges Solved

1. **Property Deletion Foreign Keys**: Fixed cascade deletion order:
   - Payments → EndRequests → Messages → PaymentDateChangeRequests → RentalRelationships → Notifications → Property

2. **Landlord Multi-Tenant Handling**: 
   - Properties can have multiple rentals
   - Proper rental ID resolution for operations

3. **Image Handling**: 
   - Base64 encoding for payment proofs
   - Multiple photo upload for properties

4. **Search Availability Status**:
   - Proper differentiation between AVAILABLE, ENDING_SOON, and AVAILABLE_SOON

## 🚧 Known Issues & Future Work

### High Priority
- [ ] Payment gateway integration (currently manual)
- [ ] Lease agreement document upload/generation
- [ ] Tenant screening/verification system
- [ ] Automated rent reminders (cron jobs)
- [ ] Multi-language support (Arabic/English)

### Medium Priority
- [ ] Property virtual tours
- [ ] Maintenance request system
- [ ] Expense tracking for landlords
- [ ] Tenant rating/review system
- [ ] Advanced analytics dashboard

### Nice to Have
- [ ] AI-powered rent pricing suggestions
- [ ] Integration with Dubai Land Department
- [ ] Automated EJARI registration
- [ ] WhatsApp notifications
- [ ] Property comparison tool

## 🛠️ Development Setup

### Prerequisites
```bash
# Node.js 18+
# PostgreSQL (via Supabase)
# Expo CLI
# iOS Simulator / Android Emulator
```

### Environment Variables
```env
# Backend (.env)
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret"
PORT=4000

# Mobile App (.env.local)
API_URL=http://localhost:4000/api
# Or for physical device:
API_URL=http://YOUR_IP:4000/api
```

### Running the Project
```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev

# Mobile App
cd mobile-app
npm install
npx expo start
```

## 📝 Code Patterns & Conventions

### API Endpoints
- All routes prefixed with `/api`
- Authentication via Bearer token
- Consistent error responses: `{ error: "message" }`
- Success responses include relevant data

### Frontend State
- Redux for global state (auth, user)
- Local state for forms
- Optimistic updates where appropriate

### Component Structure
- Screen components in `/screens`
- Reusable components in `/components`
- Services in `/services`
- Redux store in `/store`

### Styling
- No inline styles
- StyleSheet.create() at component bottom
- Consistent spacing scale (8, 16, 24, 32)
- Responsive design using Dimensions

## 🔐 Security Considerations
- JWT tokens expire after 7 days
- Passwords hashed with bcrypt
- Role-based API protection
- Input validation on all endpoints
- SQL injection prevention via Prisma
- No sensitive data in Git

## 📊 Database Relationships
```
User (1) ← → (N) Property [as landlord]
User (1) ← → (N) RentalRelationship [as tenant]
Property (1) ← → (N) RentalRelationship
RentalRelationship (1) ← → (N) Payment
RentalRelationship (1) ← → (1) EndRequest
Property (1) ← → (N) Message
User (1) ← → (N) Notification
```

## 🎨 Custom Components Created
- `GenericDropdown`: Modal-based dropdown replacement
- `LocationDropdown`: Dubai locations selector
- `NotificationBell`: Header notification indicator
- `PropertyCard`: Reusable property display

## 📱 Screen Flow

### Landlord Flow
1. Register → Select LANDLORD
2. Dashboard → Add Property
3. Property Details → Generate Invite Code
4. Share code with tenant
5. Manage payments, messages, end requests

### Tenant Flow  
1. Register → Select TENANT
2. Dashboard → Join Property (enter code)
3. Property Details → Make Payment
4. Upload proof → Wait for verification
5. Chat with landlord

## 🏆 Recent Improvements
- Simplified tenant dashboard (4 main actions)
- Replaced scroll pickers with dropdowns
- Added comprehensive Dubai property fields
- Fixed Accept Now button for end requests
- Improved property search with status badges
- Added property deletion with verification

## 💡 Tips for Future Development
1. Always check tenant verification before property operations
2. Use transactions for multi-table operations
3. Test on physical devices for IP-based API calls
4. Maintain consistent gradient color schemes
5. Follow UPPERCASE convention for UI text
6. Add loading states for all async operations
7. Handle foreign key constraints carefully

## 📞 Support & Documentation
- Supabase Dashboard: Check for database issues
- Expo Dev Tools: For mobile debugging
- Prisma Studio: `npx prisma studio` for data browsing
- Redux DevTools: For state debugging

## 🚀 Deployment Notes
- Backend: Ready for deployment on Render/Railway
- Database: Already on Supabase (production)
- Mobile: Ready for EAS Build and app stores
- Environment: Separate dev/staging/prod configs needed

---

**Last Updated**: December 2024
**Primary Developer**: Initial development phase
**Tech Stack Version**: React Native 0.74, Expo SDK 51, Node 18+