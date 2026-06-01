# Authentication API Endpoints Design

This document outlines the detailed HTTP API specification for the authentication modules, including headers, request payloads, response templates, and HTTP status codes.

---

## 1. Global Specifications
* **Base URL**: `/v1`
* **Content-Type**: `application/json`
* **CORS Settings**: Restrict to authorized client domains.
* **Authentication Header**: `Authorization: Bearer <access_token>` (for protected endpoints)

---

## 2. API Endpoints Catalog

### 📌 2.1 Send OTP Verification Code
* **URL**: `/auth/send-otp`
* **Method**: `POST`
* **Authentication**: `None`
* **Request Payload**:
  ```json
  {
    "email": "customer@smartstay.ai"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "status": "success",
    "message": "Verification OTP sent successfully to customer@smartstay.ai"
  }
  ```
* **Error Responses**:
  * **400 Bad Request**: Invalid email formatting or email already registered.
  * **429 Too Many Requests**: Triggered when the email/IP requests too many OTPs.

---

### 📌 2.2 Register Account
* **URL**: `/auth/register`
* **Method**: `POST`
* **Authentication**: `None`
* **Request Payload**:
  ```json
  {
    "email": "customer@smartstay.ai",
    "password": "customerPassword123",
    "fullName": "Nguyen Van A",
    "verificationCode": "483921"
  }
  ```
* **Success Response (210 Created)**:
  ```json
  {
    "user": {
      "id": "2c9bf1f6-d877-456b-a2ba-e889a74421b1",
      "email": "customer@smartstay.ai",
      "fullName": "Nguyen Van A",
      "role": "customer",
      "status": "active",
      "emailVerifiedAt": "2026-05-29T01:52:42.000Z",
      "createdAt": "2026-05-29T01:52:42.000Z"
    },
    "tokens": {
      "access": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "expires": "2026-05-29T02:22:42.000Z"
      },
      "refresh": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "expires": "2026-06-28T01:52:42.000Z"
      }
    }
  }
  ```
* **Error Responses**:
  * **400 Bad Request**: Password confirm mismatch, weak password complexity, or incorrect OTP.
  * **409 Conflict**: Email is already taken.

---

### 📌 2.3 Login with Email & Password
* **URL**: `/auth/login`
* **Method**: `POST`
* **Authentication**: `None`
* **Request Payload**:
  ```json
  {
    "email": "customer@smartstay.ai",
    "password": "customerPassword123"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "user": {
      "id": "2c9bf1f6-d877-456b-a2ba-e889a74421b1",
      "email": "customer@smartstay.ai",
      "fullName": "Nguyen Van A",
      "role": "customer",
      "status": "active"
    },
    "tokens": {
      "access": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "expires": "2026-05-29T02:22:42.000Z"
      },
      "refresh": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "expires": "2026-06-28T01:52:42.000Z"
      }
    }
  }
  ```
* **Error Responses**:
  * **401 Unauthorized**: Incorrect email or password.
  * **403 Forbidden**: Account is inactive or suspended.

---

### 📌 2.4 Google OAuth Authentication
* **URL**: `/auth/google`
* **Method**: `POST`
* **Authentication**: `None`
* **Request Payload**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJzdWIiOiIxMDk4Mzg4OTU4MTAzNzEwOTIz...",
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "user": {
      "id": "dcf3f834-874e-4f0e-a611-9a742ea2d2b4",
      "email": "google.user@gmail.com",
      "fullName": "Google User",
      "role": "customer",
      "status": "active"
    },
    "tokens": {
      "access": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "expires": "2026-05-29T02:22:42.000Z"
      },
      "refresh": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "expires": "2026-06-28T01:52:42.000Z"
      }
    }
  }
  ```
* **Error Responses**:
  * **400 Bad Request**: Invalid Google Token verification failure.

---

### 📌 2.5 Refresh Session Tokens
* **URL**: `/auth/refresh-tokens`
* **Method**: `POST`
* **Authentication**: `None`
* **Request Payload**:
  ```json
  {
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "access": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires": "2026-05-29T02:22:42.000Z"
    },
    "refresh": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires": "2026-06-28T01:52:42.000Z"
    }
  }
  ```
* **Error Responses**:
  * **401 Unauthorized**: Refresh token is expired, missing, or revoked.

---

### 📌 2.6 Logout Session
* **URL**: `/auth/logout`
* **Method**: `POST`
* **Authentication**: `None`
* **Request Payload**:
  ```json
  {
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
* **Success Response (204 No Content)**:
  * *Response payload is empty. Standard Header `204 No Content` returned.*
* **Error Responses**:
  * **404 Not Found**: Refresh token session record does not exist or has already been deleted.

---

### 📌 2.7 Request Password Reset (Forgot Password)
* **URL**: `/auth/forgot-password`
* **Method**: `POST`
* **Authentication**: `None`
* **Request Payload**:
  ```json
  {
    "email": "customer@smartstay.ai"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "status": "success",
    "message": "Reset password email sent successfully."
  }
  ```
* **Error Responses**:
  * **404 Not Found**: No account registered with the given email address.

---

### 📌 2.8 Execute Password Reset
* **URL**: `/auth/reset-password`
* **Method**: `POST`
* **Authentication**: `None`
* **Query Parameters**: `?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
* **Request Payload**:
  ```json
  {
    "password": "newSecurePassword123"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "status": "success",
    "message": "Password updated successfully."
  }
  ```
* **Error Responses**:
  * **400 Bad Request**: Password does not meet length or complexity criteria.
  * **401 Unauthorized**: Password reset token is invalid, used, or expired.
