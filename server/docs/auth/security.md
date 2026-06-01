# Authentication Security Plan

This document identifies security concerns and outlines mitigation strategies, configurations, and best practices implemented to secure user identities and authentication endpoints.

---

## 🔑 1. Password Protection & Hashing
* **Honeypot/Cleartext Prevention**: Plain text passwords must never be logged or stored under any circumstance.
* **Algorithm**: **bcryptjs** with **10 salt rounds** is used for password hashing inside `user.service.ts` and `auth.service.ts`.
* **Flow**:
  1. During registration, the plain password is validated, hashed, and stored inside `passwordHash`.
  2. During login, `bcrypt.compare()` compares the plain text input password with the stored hash in the database.

---

## 🎟️ 2. JWT Security & Management
* **Signing Algorithm**: HMAC SHA256 (HS256) is utilized to generate Access and Refresh tokens.
* **Payload Guidelines**: JWT payloads must only contain non-sensitive metadata (such as `userId`, `role`, and token `type`). They must **never** contain passwords or bank credentials.
* **Rotation Policy**:
  * Access Tokens are short-lived (**30 minutes**).
  * Refresh Tokens are long-lived (**30 days**) and stored as a cryptographically secure hash or unique lookup key inside the database (`UserSession` table).
  * Using a Refresh Token deletes the session record and generates a brand new token pair (refresh token rotation) to prevent token replay attacks.

---

## 🍪 3. Client-Side Token Storage & Transport
* **Access Tokens**: Recommended to be kept in Frontend memory (state) and never stored in `localStorage` to completely mitigate Cross-Site Scripting (XSS) extraction.
* **Refresh Tokens**: Transmitted via HTTP responses in **Secure Cookies**:
  * `HttpOnly = true`: Block JavaScript execution engines from reading the cookie.
  * `Secure = true`: Restrict cookie transmission strictly to HTTPS channels.
  * `SameSite = Strict`: Prevent Cross-Site Request Forgery (CSRF) ambient credential transmission on third-party site requests.

---

## 🧱 4. API Endpoints Protection & Hardening
* **Brute-Force & Rate Limiting**:
  * Utilizes `express-rate-limit` to restrict `/v1/auth/login` and `/v1/auth/send-otp` endpoints from spamming requests.
  * Configured in `src/middlewares/rateLimiter.ts`.
* **HTTP Headers Hardening**:
  * Uses the **`helmet`** middleware to set secure HTTP headers (Disabling `X-Powered-By`, configuring XSS-Protection, and enforcing Frameguard).
* **Input Sanitization**:
  * Sanitizes request payloads using `xss-clean` to filter out HTML tags and script injections before reaching controllers.
  * Schema validation using **`Joi`** strictly validates data types and structures, throwing a 400 Bad Request if anything outside the defined scheme is received.
