# Authentication Feature Implementation Plan

This document outlines the step-by-step roadmap to build, test, and verify the authentication features on both the Frontend client and Backend API.

---

## 🏗️ 1. Development Tasks Checklist

### Phase 1: Database Setup & Migration (Backend) - [x] COMPLETED
* **Task 1.1**: Define schema entities (`User`, `UserProfile`, `UserSession`, `VerificationToken`) in `schema.prisma`.
* **Task 1.2**: Comment out local pgvector columns to run migration successfully on PostgreSQL without pgvector constraints.
* **Task 1.3**: Execute migration `npx prisma migrate dev --name init_smartstay_schema` to build tables.
* **Task 1.4**: Run seed `npx prisma db seed` to populate PostgreSQL database with sample accounts.

### Phase 2: Authentication Business Logic (Backend) - [x] COMPLETED
* **Task 2.1**: Implement `token.service.ts` to map `refresh` tokens to `UserSession` and others to `VerificationToken`.
* **Task 2.2**: Implement `auth.service.ts` containing `login`, `logout`, `refreshAuth`, `resetPassword`, and `verifyEmail` methods.
* **Task 2.3**: Fix TypeScript compiler errors (`npx tsc --noEmit` returns zero warnings).
* **Task 2.4**: Verify standard compilation build outputs into `dist/` folder via `npm run build`.

### Phase 3: Frontend Layout & Premium Aesthetics (Frontend) - [ ] PENDING
* **Task 3.1**: Create base layout containing architecture background image and glassmorphism styling (`backdrop-filter: blur(20px)`).
* **Task 3.2**: Implement **Register Form** containing Email, Password, Confirm Password, and Verification Code fields.
* **Task 3.3**: Implement **Login Form** containing Email, Password, and "Forgot Password?" entry point.
* **Task 3.4**: Integrate toggling eye icon for Password inputs and Google login button.

### Phase 4: Frontend State & API Integrations (Frontend) - [ ] PENDING
* **Task 4.1**: Build `useTimer` countdown hook for "Send OTP" button.
* **Task 4.2**: Set up Axios instance with Interceptors to transparently refresh access tokens via Refresh Token when APIs throw 401s.
* **Task 4.3**: Integrate validation layers matching server schema requirements (length, characters, email regex).

---

## 🧪 2. Verification & Testing Plan

### 2.1 Automated Compilation & Linting
Run static type analysis and code checks to verify syntax correctness:
```bash
npx tsc --noEmit
npm run build
```

### 2.2 Manual Testing API Flows
Test endpoints using Postman or Swagger UI (`http://localhost:5000/v1/docs`):
1. **Send OTP**: Send `POST /v1/auth/send-otp` and verify that a 6-digit verification token record is created in `verification_tokens` table.
2. **Register**: Send `POST /v1/auth/register` with the OTP code. Check that a `User` and `UserProfile` are successfully inserted.
3. **Login**: Send `POST /v1/auth/login`. Verify that an Access Token is returned and a session record is created in `user_sessions`.
4. **Token Refresh**: Send `POST /v1/auth/refresh-tokens` with the refresh token. Confirm that new tokens are issued.
5. **Logout**: Send `POST /v1/auth/logout`. Check that the session is removed from the database.
