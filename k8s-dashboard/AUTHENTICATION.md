# K8s Dashboard - User & Admin Authentication System

## 🎯 Overview

This K8s Dashboard now features a complete **Role-Based Access Control (RBAC)** system with separate interfaces for **Admin** and **User** roles.

## 👥 User Roles

### 🔐 Admin Role
- **Full Access** to all features
- **User Management** capabilities
- View and manage all users
- Create, update, and delete user accounts
- Access to admin dashboard with statistics
- All K8s monitoring features (nodes, pods, metrics, logs, alerts)

### 👤 User Role
- **Limited Access** to monitoring features
- Personal dashboard with activity tracking
- View pods, nodes, metrics, and logs
- **No access** to:
  - User management
  - Admin dashboard
  - System alerts management

## 🚀 Getting Started

### Backend Setup

1. **Install Dependencies**
```bash
cd k8s-dashboard/backend
pip install -r requirements.txt
```

2. **Start the Backend**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

1. **Install Dependencies**
```bash
cd k8s-dashboard/frontend
npm install
```

2. **Start the Frontend**
```bash
npm run dev
```

## 🔑 Demo Credentials

### Admin Account
- **Username:** `admin`
- **Password:** `admin123`
- **Access:** Full system access + user management

### Regular User Accounts
- **User 1:** `user` / `user123`
- **User 2:** `john` / `john123`
- **Access:** Limited monitoring access

## 📱 Features by Role

### Admin Features

#### Admin Dashboard (`/admin`)
- **User Statistics**
  - Total users count
  - Active users
  - Admin vs regular users breakdown
  
- **User Management Table**
  - View all users
  - Edit user details (email, role, status)
  - Delete users
  - Create new users
  - Assign roles (admin/user)
  - Activate/deactivate accounts

- **Full K8s Monitoring Access**
  - All pods and nodes
  - Complete metrics and logs
  - Alert management

#### Navigation for Admins
- Admin Dashboard
- K8s Dashboard
- Nodes
- Pods
- Metrics
- Logs
- Alerts

### User Features

#### User Dashboard (`/user-dashboard`)
- **Personal Statistics**
  - Pods viewed count
  - Nodes viewed count
  - Active alerts count
  - Last login timestamp

- **Quick Access Cards**
  - Direct links to Pods, Nodes, and Metrics

- **Recent Activity Feed**
  - Track your recent actions
  - View access history

- **System Status**
  - API server status
  - Cluster health
  - Monitoring status

#### Navigation for Users
- My Dashboard
- Pods
- Nodes
- Metrics
- Logs

## 🛡️ Security Features

### Authentication
- **JWT-based** token authentication
- **8-hour** token expiration
- **Bcrypt** password hashing
- Secure HTTP-only sessions

### Authorization
- **Role-based route protection**
- Admin-only endpoints secured
- Automatic redirection based on role
- Protected API endpoints

### Route Protection
```typescript
// Admin-only routes
<Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

// User routes (any authenticated user)
<Route path="/user-dashboard" element={<UserDashboard />} />

// Protected shared routes
<Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
  ...
</Route>
```

## 📡 API Endpoints

### Authentication Endpoints

#### POST `/api/v1/auth/login`
Login and receive JWT token
```json
{
  "username": "admin",
  "password": "admin123"
}
```

Response:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "username": "admin",
  "email": "admin@k8s-dashboard.com",
  "role": "admin"
}
```

#### GET `/api/v1/auth/verify`
Verify token validity (requires authentication)

#### POST `/api/v1/auth/logout`
Logout (client-side token removal)

### Admin Endpoints (Admin Only)

#### GET `/api/v1/auth/users`
Get all users

#### POST `/api/v1/auth/register`
Create new user
```json
{
  "username": "newuser",
  "password": "password123",
  "email": "user@example.com",
  "role": "user"
}
```

#### PUT `/api/v1/auth/users/{username}`
Update user details
```json
{
  "email": "newemail@example.com",
  "role": "admin",
  "is_active": true
}
```

#### DELETE `/api/v1/auth/users/{username}`
Delete user

#### GET `/api/v1/auth/stats`
Get user statistics

### User Endpoints

#### GET `/api/v1/auth/user-stats`
Get current user's statistics

#### GET `/api/v1/auth/recent-activity`
Get user's recent activity

## 🎨 UI Components

### New Pages
- **`Login.tsx`** - Authentication page with role-based redirect
- **`AdminDashboard.tsx`** - Admin panel with user management
- **`UserDashboard.tsx`** - User personal dashboard

### New Components
- **`ProtectedRoute.tsx`** - Requires authentication
- **`AdminRoute.tsx`** - Requires admin role

### Updated Components
- **`Layout.tsx`** - Role-based navigation and user info display
- **`App.tsx`** - Role-based routing logic

## 🔄 User Flow

### Admin Login Flow
1. Navigate to `/login`
2. Enter admin credentials
3. Redirected to `/admin` (Admin Dashboard)
4. Access to all features via sidebar

### User Login Flow
1. Navigate to `/login`
2. Enter user credentials
3. Redirected to `/user-dashboard`
4. Limited navigation menu
5. Cannot access `/admin` or `/alerts`

### Logout Flow
1. Click "Logout" button in sidebar
2. Token removed from storage
3. Redirected to `/login`

## 🏗️ Architecture

### Frontend State Management (Zustand)
```typescript
interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (username, password) => Promise<void>
  logout: () => void
}
```

### Backend User Model
```python
{
  "username": str,
  "email": str,
  "hashed_password": str,
  "role": "admin" | "user",
  "is_active": bool,
  "created_at": datetime
}
```

## 📝 Customization

### Adding New Roles
1. Update `auth.py` role validation
2. Add role to TypeScript types
3. Create role-specific routes
4. Update navigation logic

### Adding Protected Routes
```typescript
// Admin only
<Route path="/new-admin-feature" element={
  <AdminRoute><NewFeature /></AdminRoute>
} />

// Any authenticated user
<Route path="/new-feature" element={<NewFeature />} />
```

### Customizing User Permissions
Edit `auth.py` to add custom permission checks:
```python
def verify_custom_permission(username: str = Depends(verify_token)):
    user = USERS_DB.get(username)
    if not user or not user.get("custom_permission"):
        raise HTTPException(status_code=403, detail="Permission denied")
    return username
```

## 🐛 Troubleshooting

### "Token has expired"
- Tokens expire after 8 hours
- Simply login again to get a new token

### "Admin access required"
- Ensure you're logged in with an admin account
- Check user role in the sidebar

### CORS Issues
- Backend CORS is configured for `http://localhost:5173`
- Update `app/config.py` if using different port

## 🔐 Production Considerations

⚠️ **Important:** Before deploying to production:

1. **Change SECRET_KEY** in `auth.py`
   - Use environment variable
   - Generate secure random key

2. **Use Database** instead of USERS_DB dictionary
   - PostgreSQL, MySQL, or MongoDB
   - Proper user session management

3. **Add Rate Limiting** to login endpoint

4. **Enable HTTPS** for secure token transmission

5. **Add Password Requirements**
   - Minimum length
   - Complexity requirements
   - Password reset functionality

6. **Add Refresh Tokens** for better UX

7. **Add Audit Logging** for security tracking

## 📊 Future Enhancements

- [ ] Multi-factor authentication (MFA)
- [ ] OAuth2 integration (Google, GitHub)
- [ ] Password reset via email
- [ ] User profile management
- [ ] Activity logging and audit trail
- [ ] Session management
- [ ] IP whitelisting
- [ ] API rate limiting
- [ ] Role-based permissions granularity
- [ ] User groups and teams

## 📄 License

MIT License - Feel free to use for your thesis project!

---

**Built with ❤️ for Kubernetes Monitoring**
