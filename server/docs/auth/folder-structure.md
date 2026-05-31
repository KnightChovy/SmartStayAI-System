# Authentication Folder Structure

This document outlines the file layout and organization for the authentication feature, maintaining a strict Clean Architecture separation of concerns.

---

## 📂 1. Directory Tree
```text
server/
├── prisma/
│   ├── schema.prisma              # Database Models & Schema Configurations
│   └── seed.ts                    # Database Seed Script (generates mock users)
├── src/
│   ├── config/
│   │   ├── config.ts              # Configures Environment Variables & Joi validations
│   │   ├── passport.ts            # Configures Passport-JWT strategies
│   │   ├── prisma.ts              # Exports PrismaClient singleton (Pool Adapter)
│   │   └── tokens.ts              # Defines tokenTypes (ACCESS, REFRESH, etc.)
│   ├── controllers/
│   │   ├── auth.controller.ts     # Handles request validation & mapping to Services
│   │   └── user.controller.ts     # Handles user management HTTP requests
│   ├── middlewares/
│   │   ├── auth.ts                # Middleware to protect routes via Passport
│   │   ├── error.ts               # Error handling middleware
│   │   └── rateLimiter.ts         # Protects endpoints against brute-force attacks
│   ├── routes/v1/
│   │   ├── auth.route.ts          # Defintes routes for login, register, and refresh
│   │   ├── docs.route.ts          # Serves Swagger API Documentation
│   │   └── user.route.ts          # Defines routes for user CRUD
│   ├── services/
│   │   ├── auth.service.ts        # Business logic for sessions, logins, and logouts
│   │   ├── token.service.ts       # Business logic for JWT token sign, verify, and saves
│   │   └── user.service.ts        # Business logic for database users CRUD
│   ├── utils/
│   │   ├── ApiError.ts            # Customized API error subclass
│   │   └── catchAsync.ts          # Decorator/Wrapper to catch async errors in routers
│   ├── validations/
│   │   ├── auth.validation.ts     # Joi schemes for authentication requests validation
│   │   └── user.validation.ts     # Joi schemes for user CRUD validations
│   └── app.ts                     # Configures Express server and middlewares
docs/
└── auth/                          # Feature specifications (Source of Truth)
    ├── requirements.md
    ├── business-rules.md
    ├── flow.md
    ├── api-design.md
    ├── database-design.md
    ├── security.md
    ├── folder-structure.md
    └── implementation-plan.md
```

---

## 🎨 2. Architectural Layering
1. **Routing Layer (`src/routes/`)**: Registers URL paths, maps them to Middlewares (`validate`, `auth`), and attaches them to Controllers.
2. **Validation Layer (`src/validations/`)**: Validates input data types, syntax lengths, and payload parameters using `Joi` schemes before execution.
3. **Controller Layer (`src/controllers/`)**: Reads request bodies, headers, and params; delegates operations to Services; and sends HTTP responses.
4. **Service Layer (`src/services/`)**: Enforces core business logic (e.g., matching password hashes, formatting structures) and executes transactions through database query operations.
5. **Database ORM (`prisma/schema.prisma`)**: Direct data access layer matching database entities.
