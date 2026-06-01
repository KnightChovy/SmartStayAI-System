# Authentication System Flows

This document details the step-by-step logic and sequence of events for all key authentication flows: Registration, Login, Google OAuth, and Refreshing Tokens.

---

## 1. User Registration Flow (with Email OTP)

This flow details how a guest registers a new account using the OTP mechanism illustrated in the mockup.

```mermaid
sequenceDiagram
    autonumber
    actor Guest as Guest (UI)
    participant Server as Express Server
    participant DB as PostgreSQL Database
    participant Mail as Nodemailer SMTP
    
    Note over Guest, Mail: Phase 1: Request OTP Code
    Guest->>Guest: Validate Email input format
    Guest->>Server: POST /v1/auth/send-otp { email }
    Server->>DB: Check if email already exists in "users"
    alt Email Exists
        Server-->>Guest: 400 Bad Request (Email already taken)
    else Email Unique
        Server->>Server: Generate 6-digit numeric OTP
        Server->>DB: Upsert into "verification_tokens" (expires in 10 mins)
        Server->>Mail: Send Email with OTP code
        Server-->>Guest: 200 OK (OTP Sent successfully)
        Guest->>Guest: Disable "Send OTP", trigger 60s cooldown timer
    end

    Note over Guest, Mail: Phase 2: Form Submission
    Guest->>Guest: User fills Name, Pass, Confirm Pass, OTP
    Guest->>Guest: Verify PWD matches Confirm PWD
    Guest->>Server: POST /v1/auth/register { email, password, fullName, verificationCode }
    Server->>DB: Find active record in "verification_tokens" for email
    alt OTP Invalid / Expired / Missing
        Server-->>Guest: 400 Bad Request (Invalid or expired verification code)
    else OTP Matches & Valid
        Server->>Server: Hash password using bcryptjs (salt=10)
        Server->>DB: Create new "User" & "UserProfile" (role='customer')
        Server->>DB: Delete verification token record
        Server->>Server: Generate Access Token (30m) & Refresh Token (30d)
        Server->>DB: Insert Refresh Token session into "user_sessions"
        Server-->>Guest: 201 Created (Return Tokens + User profiles)
    end
```

---

## 2. Standard Login Flow (Email & Password)

This flow describes authentication using conventional email and password.

```mermaid
sequenceDiagram
    autonumber
    actor User as User (UI)
    participant Server as Express Server
    participant DB as PostgreSQL Database

    User->>User: Fills Email, Password
    User->>Server: POST /v1/auth/login { email, password }
    Server->>DB: Query User record by email where deleted_at is null
    alt User Not Found
        Server-->>User: 401 Unauthorized (Incorrect email or password)
    else User Exists
        Server->>Server: Compare hashed input password with passwordHash
        alt Password Mismatch
            Server-->>User: 401 Unauthorized (Incorrect email or password)
        else Password Matches
            Server->>Server: Generate Access Token (30m) & Refresh Token (30d)
            Server->>DB: Create new UserSession record in "user_sessions"
            Server-->>User: 200 OK (Return Access Token + User payload)
        end
    end
```

---

## 3. Google OAuth Social Authentication Flow

This flow covers automated sign-up and sign-in via Google Identity integration.

```mermaid
sequenceDiagram
    autonumber
    actor User as User (UI)
    participant Google as Google Identity Service
    participant Server as Express Server
    participant DB as PostgreSQL Database

    User->>User: Click "Login/Register with Google"
    User->>Google: Retrieve Google Credential JWT
    Google-->>User: Return id_token (JWT)
    User->>Server: POST /v1/auth/google { token }
    Server->>Server: Verify Google JWT signature & client ID
    Server->>Server: Extract email, name, avatarUrl from payload
    Server->>DB: Query User record by email
    alt User Does Not Exist (Social Sign-Up)
        Server->>Server: Generate random strong dummy password
        Server->>Server: Hash dummy password
        Server->>DB: Create User & UserProfile (role='customer', emailVerified=now)
    end
    Server->>Server: Generate Access Token & Refresh Token
    Server->>DB: Create new session in "user_sessions"
    Server-->>User: 200 OK (Return Access Token + Session Tokens)
```

---

## 4. Silent Token Refresh Flow

This flow allows the frontend client to seamlessly refresh access tokens without user interruption.

```mermaid
sequenceDiagram
    autonumber
    actor Client as Frontend Client
    participant Server as Express Server
    participant DB as PostgreSQL Database

    Client->>Server: Call protected API endpoint (Header: Bearer AccessToken)
    alt Access Token Expired
        Server-->>Client: 401 Unauthorized (Token expired)
        Client->>Server: POST /v1/auth/refresh-tokens { refreshToken }
        Server->>Server: Verify Refresh Token JWT signature & expiration
        Server->>DB: Query user_sessions where refreshTokenHash = token
        alt Session Exists & Active
            Server->>DB: Delete/Revoke old user_sessions record
            Server->>Server: Generate new Access Token & Refresh Token
            Server->>DB: Create new session in "user_sessions"
            Server-->>Client: 200 OK (Return new Access Token & Refresh Token)
            Client->>Server: Retry original protected API call (with new Access Token)
            Server-->>Client: 200 OK (Return protected data)
        else Session Missing / Revoked
            Server-->>Client: 401 Unauthorized (Session expired, force logout)
        end
    end
```
