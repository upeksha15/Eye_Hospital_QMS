# Login Page & JWT Authentication Setup Guide

## Overview
This document describes the implementation of the JWT-based login system with role selection for the Eye Hospital QMS.

## Features Implemented

### 1. **Beautiful Login Page** (`LoginPage.jsx`)
- Modern, gradient-based UI design
- Role selection (Patient, Admin, Medical Staff)
- Email and password authentication
- Password visibility toggle
- Real-time form validation
- Error messages with animations
- Responsive design

### 2. **Backend Changes**

#### Updated Patient Model
- Added `role` field with enum values: `['patient', 'admin', 'medical_staff']`
- Default role: `'patient'`

#### Modified Login Endpoint (`/api/auth/login`)
**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "patient"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "patient": {
    "_id": "patient_id",
    "fullName": "John Doe",
    "email": "user@example.com",
    "nic": "123456789V",
    "contactNumber": "0712345678",
    "role": "patient",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 3. **Frontend Authentication Context**
- Enhanced `AuthContext.jsx` to store role information
- Added `getStoredRole()` and `persistAuth()` functions
- Role is now part of the authentication state

### 4. **Protected Routes**
- Created `ProtectedRoute` component in `App.jsx`
- All dashboard routes require authentication
- Redirects to login page if not authenticated
- Shows loading state while checking authentication

### 5. **Updated Flows**
- Registration → Auto-login with patient role
- Login → Navigate to dashboard
- Logout → Return to home page

## File Structure Changes

```
frontend/src/
├── Pages/
│   ├── LoginPage.jsx (NEW)
│   ├── User_dash.jsx (UPDATED)
│   └── UserReg.jsx (UPDATED)
├── context/
│   └── AuthContext.jsx (UPDATED)
├── api/
│   └── authApi.js (UPDATED)
└── App.jsx (UPDATED)

backend/src/
├── controllers/
│   └── authController.js (UPDATED)
└── models/
    └── Patient.js (UPDATED)
```

## Setup Instructions

### 1. Backend Setup

#### Update Environment Variables
Make sure your `.env` file contains:
```
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
PORT=5000
```

#### Database Migration
If you have existing patients without the `role` field, run:
```bash
# The role field will default to 'patient' for new documents
# Existing documents will get the default value on next save
```

#### Restart Backend
```bash
npm run dev
```

### 2. Frontend Setup

The frontend changes are automatic. Just ensure:
1. React Router is properly configured ✓
2. AuthContext is wrapping your app ✓
3. Protected routes are in place ✓

## Testing the Login Flow

### Test Case 1: Register as Patient
1. Go to `/register`
2. Fill out the form with:
   - Full Name
   - Email (e.g., `test@example.com`)
   - Password
   - Other required fields
3. Click "Register"
4. Should auto-login and redirect to `/dashboard`

### Test Case 2: Login as Patient
1. Go to `/login`
2. Select "Patient" role
3. Enter credentials:
   - Email: `test@example.com`
   - Password: (password used during registration)
4. Click "Sign In"
5. Should redirect to `/dashboard`

### Test Case 3: Role Selection
1. Go to `/login`
2. Try selecting different roles
3. Visual feedback should show selected role
4. Login with each role to test

### Test Case 4: Authentication Persistence
1. Login and navigate to dashboard
2. Refresh the page
3. Should remain logged in (token persisted in localStorage)

### Test Case 5: Protected Routes
1. Logout from dashboard
2. Try to access `/dashboard` directly
3. Should redirect to `/login`

## API Endpoints

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "role": "patient"
}
```

### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "nic": "123456789V",
  "dateOfBirth": "1990-01-15",
  "email": "user@example.com",
  "password": "password123",
  "contactNumber": "0712345678"
}
```

### Get Current User
```
GET /api/auth/me
Authorization: Bearer <jwt_token>
```

## Security Features

1. **Password Hashing**: Using bcryptjs with 10 salt rounds
2. **JWT Tokens**: Secure token-based authentication
3. **Token Expiration**: Default 7 days
4. **Password Visibility Toggle**: Secure password entry
5. **Email Validation**: Client and server-side validation
6. **HTTPS Ready**: All sensitive data should be sent over HTTPS

## Customization Guide

### Change Login Page Colors
Edit `LoginPage.jsx` - Look for gradient classes:
```jsx
// Change from blue to your preferred color
from-blue-500 to-indigo-600  // Primary gradient
from-blue-50 to-indigo-50    // Background gradient
```

### Add Additional Roles
1. Update `Patient.js` model:
```javascript
role: { 
  type: String, 
  enum: ['patient', 'admin', 'medical_staff', 'new_role'], 
  default: 'patient' 
}
```

2. Update `LoginPage.jsx` roles array:
```javascript
const roles = [
  { value: 'patient', label: 'Patient', icon: '👤' },
  // Add new role here
];
```

### Modify Login Validation
Edit `LoginPage.jsx` - `handleSubmit()` function to add custom validation

## Troubleshooting

### Issue: "Invalid credentials" on login
- Verify email spelling
- Check password is correct
- Ensure user was registered in the same environment

### Issue: Can't access dashboard after login
- Check if token is stored in localStorage
- Verify JWT_SECRET matches between login and token verification
- Check if AuthContext is properly wrapping your routes

### Issue: Logout not working
- Verify logout function is called
- Check localStorage.clear() in browser DevTools
- Try clearing cookies if using cookie-based tokens

### Issue: Role not updating
- Ensure role parameter is sent to backend
- Check Patient model has role field
- Verify database migration completed

## Future Enhancements

1. Add "Remember Me" functionality
2. Implement real-time notifications for appointments
3. Add SMS/Email OTP verification
4. Implement role-based dashboards
5. Add password reset functionality
6. Implement 2FA for enhanced security
7. Add audit logging for login attempts

## Dependencies

### Backend
- `bcryptjs`: ^2.4.3
- `jsonwebtoken`: ^9.0.2
- `express`: ^4.18.2
- `mongoose`: ^8.9.5

### Frontend
- `react`: Latest
- `react-router-dom`: Latest
- `axios`: Latest (for API calls)
- `lucide-react`: For icons

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the API endpoints section
3. Verify environment variables are set
4. Check browser console for error messages
