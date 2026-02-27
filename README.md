# Scheduler — Lightweight Availability & Booking System

A Calendly-style scheduling app built with Next.js 14 (App Router), Tailwind CSS, and MongoDB.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS
- **Backend**: Next.js API Routes (serverless)
- **Database**: MongoDB via Mongoose

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Installation

```bash
cd scheduler
npm install
```

### Environment Setup

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and set your MongoDB URI:
```
MONGODB_URI=mongodb://localhost:27017/scheduler
# or MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/scheduler
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Features

### User Availability Dashboard (`/`)

1. **Pick a date** from the interactive calendar
2. **Set start and end time** for that date
3. **Save** — data is stored in MongoDB and shown in-session list
4. **Refresh** clears the in-memory list (but data is saved in DB)
5. **Generate Booking Link** — creates a unique UUID-based booking URL
6. Choose **slot duration** (15/30/45/60 minutes)

### Public Booking Page (`/book/:linkId`)

1. Invalid links return a **404 page**
2. Calendar shows only **future available dates** (highlighted)
3. Select a date to see **time slot chips**
4. Already-booked slots for **this specific link** are hidden
5. Same slot on **other links** remains available
6. Enter name + optional email and **confirm booking**

---

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/availability` | Save/update availability slot |
| GET | `/api/availability?userId=X` | Get all slots for user |
| POST | `/api/links` | Generate booking link |
| GET | `/api/links?linkId=X` | Validate/fetch a booking link |
| GET | `/api/bookings?linkId=X` | Get available dates for link |
| GET | `/api/bookings?linkId=X&date=Y` | Get available time slots |
| POST | `/api/bookings` | Create a booking |

---

## Data Models

### Availability
```js
{ userId, date, startTime, endTime }
```

### BookingLink
```js
{ userId, linkId (UUID), slotDurationMinutes, active }
```

### Booking
```js
{ linkId, userId, date, startTime, endTime, visitorName, visitorEmail }
// Unique index on (linkId, date, startTime) prevents double-booking
```

---

## Key Design Decisions

- **Per-link booking isolation**: Bookings are tied to `linkId`, so one booking link's filled slots don't affect other links — enabling multiple booking campaigns
- **Slot generation**: Server-side slot generation from availability windows ensures consistent, tamper-proof slot lists
- **Offline-first list**: Availability list is managed from API response data in React state (not re-fetched), simulating the offline requirement
- **MongoDB unique index** on `(linkId, date, startTime)` ensures race-condition-safe booking

---

## Build for Production

```bash
npm run build
npm start
```
