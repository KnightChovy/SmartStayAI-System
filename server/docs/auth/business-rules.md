# Authentication Business Rules

This document specifies the strict business logic rules that must be implemented and enforced on both the client (Frontend) and the server (Backend) for the authentication process.

---

## 🔒 1. Password Complexity Rules (BR-PWD)
* **BR-PWD-1**: The password must be at least **8 characters** in length.
* **BR-PWD-2**: The password must contain at least **one alphabet letter** and **one number**.
* **BR-PWD-3**: In the Registration Form, `Confirm Password` must match the `Password` field exactly. If they do not match, the submission must be blocked.

---

## 📨 2. OTP & Email Verification Rules (BR-OTP)
* **BR-OTP-1**: To request an OTP, the email must be valid and must not belong to an active, registered account (except for password resets).
* **BR-OTP-2**: The verification code must be a **6-digit numeric string** (e.g., `583921`).
* **BR-OTP-3**: The OTP must have an expiration limit of exactly **10 minutes** from generation.
* **BR-OTP-4**: The Frontend must enforce a **60-second cooldown timer** after an OTP is requested. The "Send OTP" button must remain disabled with a visible countdown during this period.
* **BR-OTP-5**: The email field in the `verification_tokens` table is unique, meaning a user can only have **one active OTP code** at any given time. Requesting a new OTP overrides/deletes the old one.

---

## 🌐 3. Session & Token Life Cycle (BR-SES)
* **BR-SES-1**: Upon successful authentication, the server generates:
  * An **Access Token** with a lifetime of **30 minutes** (configured in JWT settings).
  * A **Refresh Token** with a lifetime of **30 days**.
* **BR-SES-2**: Every successful login creates a record in the `user_sessions` table containing the refresh token hash, user agent, IP address, and `expires_at` date.
* **BR-SES-3**: When a session is revoked (logout) or when a refresh token is used, the associated session record in `user_sessions` must be deleted/invalidated.
* **BR-SES-4**: A user can have multiple concurrent active sessions (e.g., logged in on phone and desktop simultaneously).

---

## 👥 4. Roles & Permissions (BR-ROL)
* **BR-ROL-1**: Every newly registered user via the sign-up page must automatically be assigned the default role of **`customer`** and have a status of **`active`**.
* **BR-ROL-2**: Accounts created or authenticated via Google OAuth are assigned the role of **`customer`** by default.
* **BR-ROL-3**: Elevation to roles like `hotel_partner`, `staff`, or `admin` can only be performed by platform managers or through explicit approval workflows (e.g., approved business licenses in `hotel_partners`).

---

## 🚫 5. Rate Limiting & Account Protection (BR-SEC)
* **BR-SEC-1**: The `/v1/auth/login` and `/v1/auth/register` endpoints must be restricted to a maximum of **20 requests per hour** per IP address to mitigate brute-force and credential stuffing attacks.
* **BR-SEC-2**: The `/v1/auth/send-otp` endpoint must be restricted to a maximum of **3 requests per 10 minutes** per IP address/email.
