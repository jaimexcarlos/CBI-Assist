# Balai Assist - Functional Prototype

A working prototype of the Balai Assist Guest Portal & Service Management System for Club Balai Isabel.

## Features Implemented

### Guest Portal
- QR Code authentication (Room Number + PIN)
- Service request submission with categories
- Real-time ticket status tracking
- Guest satisfaction ratings

### Staff Dashboard
- Role-based ticket queues (Idle, Pending, Urgent, Closed)
- Ticket claiming and status updates
- Ticket resolution with codes
- Internal notes
- Proxy request creation (Front Office)

### Executive Dashboard
- Real-time KPIs (tickets, resolution time, SLA compliance, CSAT)
- Departmental breakdown
- Staff performance metrics
- Issue frequency analysis

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Access the application:**
   - Guest Portal: http://localhost:5173/guest
   - Staff Dashboard: http://localhost:5173/staff
   - Executive Dashboard: http://localhost:5173/executive
   - Backend API: http://localhost:3001

## Demo Credentials

### Guest Access
- Room Number: `101`
- PIN: `1234`

### Staff Access
- **IT Staff:** username: `it_staff`, password: `password123`
- **Housekeeping:** username: `housekeeping_staff`, password: `password123`
- **Engineering:** username: `engineering_staff`, password: `password123`
- **Front Office:** username: `frontoffice_staff`, password: `password123`

### Executive Access
- Username: `executive`, password: `admin123`

## Technology Stack

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **Real-time:** Socket.IO
- **State Management:** Zustand + TanStack Query
- **Database:** In-memory (for prototype)

## Project Structure

```
balai-assist-prototype/
├── backend/
│   ├── server.js           # Express server + Socket.IO
│   ├── data.js             # In-memory database
│   ├── auth.js             # Authentication logic
│   └── routes/             # API routes
├── src/
│   ├── components/         # Reusable React components
│   ├── pages/              # Page components
│   ├── stores/             # Zustand stores
│   ├── hooks/              # Custom React hooks
│   └── utils/              # Utility functions
├── public/                 # Static assets
└── index.html              # Entry HTML
```

## Notes

This is a functional prototype demonstrating core features. For production:
- Replace in-memory database with PostgreSQL
- Add proper authentication with JWT refresh tokens
- Implement file upload for photos (S3)
- Add comprehensive error handling
- Implement PWA features (service worker, offline support)
- Add comprehensive testing
- Deploy to cloud infrastructure (AWS)
