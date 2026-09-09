---
name: expense-tracker-workflow
description: >-
  Use this skill when developing, serving, testing, debugging, or extending the Expense Tracker application,
  including the Angular 22 frontend, Express 5 backend API, PostgreSQL database schema, authentication,
  and proxy configurations.
---

# Expense Tracker Full-Stack Development Workflow

This skill outlines the architecture, setup procedures, development servers, and testing runbook for the Expense Tracker application.

---

## 1. Project Architecture Overview

The repository is organized as a full-stack monolithic structure:

- **Frontend (`src/`)**:
  - Built with **Angular 22** using standalone components (`app/components/`), routing (`app.routes.ts`), and guards (`app/guards/auth.guard.ts`).
  - Uses `@angular/material` and `@angular/cdk` for modern UI components.
  - State and API services are located in `src/app/services/`.
  - Development proxy: `proxy.conf.json` forwards `/api` requests to `http://localhost:3000`.
- **Backend (`server/`)**:
  - Built with **Express 5** on Node.js (`server/src/server.js`).
  - Route handlers: `server/src/routes/` (`auth.routes.js`, `users.routes.js`).
  - Controllers and business logic: `server/src/controllers/`.
  - Database pool client: `server/src/db.js` using `pg`.
  - Authentication middleware: `server/src/middleware/auth.middleware.js` using `jsonwebtoken` and `bcryptjs`.
- **Database (`server/schema.sql`)**:
  - PostgreSQL schema defining the `users` table (`id`, `username`, `email`, `password_hash`, `role`, `created_at`).

---

## 2. Environment & Database Setup

### Step 1: Configure Environment Variables
Copy `.env.example` to `.env` in the repository root and configure the required variables:
```bash
cp .env.example .env
```
Ensure the following variables are defined:
- `PORT`: Express server port (default: `3000`)
- `DATABASE_URL`: PostgreSQL connection string (e.g., `postgresql://postgres:postgres@localhost:5432/demo`)
- `JWT_SECRET`: Secret key used for signing authentication tokens

### Step 2: Initialize the PostgreSQL Database
Create the database and apply the initial schema:
```bash
createdb demo
psql demo -f server/schema.sql
```

> **Security Note**: Never store plain-text passwords. All user passwords must be hashed using `bcryptjs` before insertion into the `users` table.

---

## 3. Development Workflow

### Starting the Backend API
Start the Express API server on port 3000:
```bash
npm run start:api
```
- Health check: `GET http://localhost:3000/api/health` -> `{ "status": "ok" }`
- Auth login: `POST http://localhost:3000/api/auth/login`

### Starting the Frontend Development Server
Start the Angular development server on port 4200:
```bash
npm start
```
The Angular CLI serves the app at `http://localhost:4200/` and proxies all `/api/*` requests to the Express server using `proxy.conf.json`.

---

## 4. Code Scaffolding & Conventions

### Angular 22 Conventions
- Use **standalone components** (avoid NgModules).
- Generate new components via Angular CLI:
  ```bash
  npx ng generate component components/<feature>/<name>
  ```
- Use Angular Signals for reactive state where applicable.
- Secure protected routes using `authGuard` in `src/app/app.routes.ts`.

### Express API Conventions
- Keep routes modular in `server/src/routes/`.
- Validate request payloads before passing them to controller functions.
- Protect private endpoints using the JWT verification middleware in `server/src/middleware/`.

---

## 5. Testing & Build Verification

### Run Unit Tests
To execute unit tests once without entering watch mode:
```bash
npm test -- --watch=false
```

### Production Build
Verify the production build compiles cleanly without TypeScript errors:
```bash
npm run build
```
Build artifacts will be emitted to `dist/my-angular22-app/browser/`.

> **Note**: If running in terminal environments where Node/npm are managed by `mise`, ensure mise shims are in PATH:
> `export PATH="$HOME/.local/share/mise/shims:$PATH"`

