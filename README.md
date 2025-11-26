# EtherX OneNote - Complete Setup Guide

## Quick Start (3 Steps)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Backend Server
```bash
node server.js
```

### 3. Open Frontend
Open `etherx-backend.html` in your browser

## Files Included
- `server.js` - Backend server
- `package.json` - Dependencies
- `etherx-backend.html` - Frontend with backend integration
- `README.md` - This guide

## Features
✅ User Registration & Login
✅ JWT Authentication
✅ Per-user note storage
✅ Real-time search
✅ Image & audio attachments
✅ Dark mode
✅ Loading animations (no external logo needed)

## Backend API Endpoints
- POST `/api/register` - Register new user
- POST `/api/login` - User login
- GET `/api/notes` - Get user notes
- POST `/api/notes` - Create note
- PUT `/api/notes/:id` - Update note
- DELETE `/api/notes/:id` - Delete note

## Data Storage
- Users: `data/user_at_email.com.json`
- Notes: `data/notes_user_at_email.com.json`

## Port Configuration
- Backend: http://localhost:3001
- Frontend connects automatically

## Troubleshooting
- If port 3001 is busy, change PORT in server.js
- Update API_BASE in etherx-backend.html to match
- Logo is text-based (no external files needed)

## Ready for Zip Distribution
All files are self-contained with no external dependencies after npm install.