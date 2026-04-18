# Balai Assist - Quick Start Guide

## 🚀 Start the Application

### Option 1: Start Both Backend and Frontend Together
```bash
npm run dev
```

### Option 2: Start Separately (in different terminals)

**Terminal 1 - Backend:**
```bash
npm run dev:backend
```

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
```

## 📱 Access the Application

Once running, open your browser and navigate to:

- **Landing Page:** http://localhost:5173/
- **Guest Portal:** http://localhost:5173/guest
- **Staff Dashboard:** http://localhost:5173/staff
- **Executive Dashboard:** http://localhost:5173/executive

## 🔑 Demo Credentials

### Guest Portal
- **Room 101:** PIN `1234`
- **Room 102:** PIN `5678`
- **Room 201:** PIN `9012`

### Staff Dashboard
- **IT Staff:** `it_staff` / `password123`
- **Housekeeping:** `housekeeping_staff` / `password123`
- **Engineering:** `engineering_staff` / `password123`
- **Front Office:** `frontoffice_staff` / `password123`

### Executive Dashboard
- **Executive:** `executive` / `admin123`

## 🎯 Testing the System

### 1. Create a Guest Request
1. Go to http://localhost:5173/guest
2. Login with Room 101, PIN 1234
3. Click "New Service Request"
4. Select a category (e.g., "Wi-Fi/IT")
5. Select a sub-category
6. Enter a description
7. Submit the request

### 2. Handle Request as Staff
1. Open http://localhost:5173/staff in a new tab
2. Login as `it_staff` / `password123`
3. You'll see the ticket in the "Idle / New" tab
4. Click on the ticket to open details
5. Click "Claim Ticket"
6. Click "Mark as En Route"
7. Select a resolution code
8. Click "Resolve Ticket"

### 3. Rate the Service as Guest
1. Go back to the Guest Portal tab
2. The ticket should now show as "Resolved"
3. Click "Rate Service"
4. Give it a star rating
5. Submit the rating

### 4. View Analytics as Executive
1. Go to http://localhost:5173/executive
2. Login as `executive` / `admin123`
3. View real-time KPIs
4. See departmental breakdown
5. Check staff performance metrics

## 🔄 Real-Time Features

The system includes WebSocket support for real-time updates:

- **Guest Portal:** Ticket status updates automatically
- **Staff Dashboard:** New tickets appear instantly
- **Executive Dashboard:** KPIs refresh every 30 seconds

## 🛠️ Troubleshooting

### Port Already in Use
If you get an error about ports being in use:

**Backend (Port 3001):**
```bash
# Find and kill the process
lsof -ti:3001 | xargs kill -9
```

**Frontend (Port 5173):**
```bash
# Find and kill the process
lsof -ti:5173 | xargs kill -9
```

### Dependencies Issues
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## 📊 Features Demonstrated

✅ **Guest Portal**
- QR code authentication (Room + PIN)
- Service request submission with categories
- Real-time ticket status tracking
- Guest satisfaction ratings

✅ **Staff Dashboard**
- Role-based ticket queues
- Ticket claiming and assignment
- Status updates (Acknowledged → En Route → Resolved)
- Internal notes
- Proxy request creation (Front Office)
- SLA timer with visual indicators

✅ **Executive Dashboard**
- Real-time KPIs (tickets, resolution time, SLA, CSAT)
- Departmental breakdown
- Staff performance metrics
- Auto-refresh every 30 seconds

✅ **System Features**
- Automatic ticket routing by category
- SLA timer (10min warning, 15min escalation)
- WebSocket real-time updates
- In-memory database (resets on restart)
- JWT authentication
- Role-based access control

## 🎨 Design System

The prototype implements the Balai Assist design system:

- **Primary Color:** Sky Blue (#0EA5E9)
- **Secondary Color:** Vibrant Green (#10B981)
- **Font:** Poppins (Google Fonts)
- **Touch Targets:** Minimum 44px
- **Card Radius:** 8px
- **Transitions:** 0.2s ease-in-out

## 📝 Notes

- This is a **functional prototype** with in-memory storage
- Data resets when the server restarts
- No photo upload functionality (simplified for prototype)
- No PMS integration (simplified authentication)
- No SMS/email notifications (console logs only)

## 🚀 Next Steps for Production

To convert this prototype to production:

1. Replace in-memory database with PostgreSQL
2. Add proper JWT refresh token logic
3. Implement file upload to S3
4. Add PMS integration
5. Integrate SMS gateway (Twilio)
6. Add email service (AWS SES)
7. Implement PWA service worker
8. Add comprehensive error handling
9. Add unit and integration tests
10. Deploy to AWS infrastructure

---

**Enjoy exploring the Balai Assist prototype!** 🎉
