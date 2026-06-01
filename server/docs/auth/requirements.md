# Authentication Feature Requirements

This document specifies the functional and non-functional requirements for the User Authentication, Registration, and Session Management system of the SmartStayAI platform, derived from the premium glassmorphism mockups and the target TypeScript backend database structure.

---

## 👥 1. Actors & Roles
The system authenticates users under the following roles (`UserRole` enum in schema):
* **Guest**: Unauthenticated visitor. Can view public hotel listings.
* **Customer**: Registered guests booking hotel rooms and viewing loyalty points.
* **Hotel Partner**: Hotel managers/owners listing room types, adjusting pricing rules, and handling bookings.
* **Staff / Marketer**: Hotel personnel answering conversations, updating faq bases, and approving content drafts.
* **Platform Manager / Admin**: Platform administrators managing partners, approving licenses, and auditing logs.

---

## 🛠️ 2. Functional Requirements (FR)

### FR-1: Account Registration (Sign Up Flow)
* **FR-1.1**: The user must register with an Email Address, Password, Name, and Verification Code (OTP).
* **FR-1.2**: Password must be confirmed before submission.
* **FR-1.3**: The client must request a 6-character numeric OTP via email using the `Send OTP` mechanism prior to registration.
* **FR-1.4**: A countdown of 60 seconds must be enforced on the frontend after clicking `Send OTP` before letting the user request a new one.

### FR-2: Email & Password Authentication (Sign In Flow)
* **FR-2.1**: The user must log in using their Email Address and Password.
* **FR-2.2**: The password input field must include a toggle eye icon to show/hide the password.
* **FR-2.3**: Successful login generates an Access Token (JWT) and a Refresh Token (JWT).
* **FR-2.4**: A "Forgot Password?" entry point must be accessible directly from the password field.

### FR-3: Google Social Authentication
* **FR-3.1**: Users must be able to Register and Login using Google OAuth.
* **FR-3.2**: If a Google account does not exist in the database, it must automatically create a new user profile (`User` + `UserProfile`) with the Google credentials (social registration).
* **FR-3.3**: If a Google account already exists, it signs the user in and generates session tokens (social login).

### FR-4: Session & Token Management
* **FR-4.1**: Active sessions must be persisted in the `user_sessions` database table.
* **FR-4.2**: The client must store the Access Token in memory and automatically request a new one using the Refresh Token via a silent HTTP POST call when it expires.
* **FR-4.3**: Logging out must revoke the session by deleting or revoking the refresh token inside the database.

---

## ⚡ 3. Non-Functional Requirements (NFR)

### NFR-1: Security & Encryption
* **NFR-1.1**: Passwords must never be stored in plain text. Hashing must be done using **bcryptjs** with a salt round of 10.
* **NFR-1.2**: JWT secrets must be loaded securely from environment variables (`.env`) and never hardcoded.
* **NFR-1.3**: Refresh tokens must be transmitted using secure `HttpOnly`, `Secure`, `SameSite=Strict` cookies to block XSS and CSRF token interception.

### NFR-2: Performance & Scalability
* **NFR-2.1**: Authentication API response time must be under 200ms for ordinary logins.
* **NFR-2.2**: OTP codes must expire strictly after 10 minutes to reduce database footprint and enhance security.
* **NFR-2.3**: Connection pools for database requests must be handled via PostgreSQL pools to handle concurrent login peaks.

### NFR-3: User Experience (UX)
* **NFR-3.1**: Giao diện đăng nhập/đăng ký phải thiết kế theo hiệu ứng Frosted Glassmorphism với độ phản hồi tức thì (micro-animations).
* **NFR-3.2**: Input validation errors must display inline immediately after losing focus or on submission.
