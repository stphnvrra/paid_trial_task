# Paid Trial Task — Full Stack Mobile Developer

A gamified missions platform demonstrating multi-tenant isolation (Org A/B) using NestJS, PostgreSQL, and React Native (Expo).

## 1. Quick Start

### Database Setup
Seed the local PostgreSQL database (default port `5433`):
```bash
psql -h localhost -p 5433 -U postgres -d missions_db -f backend/schema.sql
```

### Run Backend (NestJS)
```bash
cd backend && npm install && npm run start:dev
```
Server runs on `http://localhost:3000`.

### Run Frontend (Expo)
```bash
cd mobile && npm install && npx expo start
```
* Press **`w`** for Web mode (`http://localhost:8081`).
* Scan the QR code to open in the Expo Go iOS/Android app.

---

## 2. Walkthrough Instructions
1. **Read Isolation**: Switch Org A/B at the top to see isolated mission lists.
2. **Successful Submission**: Open a mission, leave the header matching the tenant, and submit.
3. **Write Isolation (Refused)**: Open a mission, toggle the header to the *other* tenant, and submit. The UI banner will show "Access denied".
