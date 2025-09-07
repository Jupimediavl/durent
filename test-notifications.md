# Testing Notifications System

## API Endpoints pentru testare:

### 1. Get all notifications
```
GET http://192.168.1.135:4000/notifications
Authorization: Bearer YOUR_TOKEN
```

### 2. Get notification settings
```
GET http://192.168.1.135:4000/notifications/settings
Authorization: Bearer YOUR_TOKEN
```

### 3. Update notification settings
```
PUT http://192.168.1.135:4000/notifications/settings
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "paymentReminders": true,
  "paymentUpdates": true,
  "messages": true,
  "endRentalNotifications": true,
  "tenantUpdates": true,
  "paymentDateChangeRequests": true,
  "reminderDaysBefore": 3
}
```

### 4. Mark notification as read
```
PATCH http://192.168.1.135:4000/notifications/{notificationId}/read
Authorization: Bearer YOUR_TOKEN
```

### 5. Delete notification
```
DELETE http://192.168.1.135:4000/notifications/{notificationId}
Authorization: Bearer YOUR_TOKEN
```

## Pentru a genera notificări de test:

### Create Payment (generates notification)
```
POST http://192.168.1.135:4000/payments
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "rentalId": "your-rental-id",
  "amount": 1000,
  "dueDate": "2025-01-15",
  "description": "Monthly rent"
}
```

### Send Message (generates notification)
```
POST http://192.168.1.135:4000/messages
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "content": "Hello, this is a test message",
  "receiverId": "receiver-user-id",
  "propertyId": "property-id"
}
```

### Request End Rental (generates notification)
```
POST http://192.168.1.135:4000/end-rental/request/{rentalId}
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "reason": "Need to move out"
}
```