# Agent Development Guidelines & Project Requirements

## I. CRITICAL CONSTRAINTS (Environment & Tech Stack)

### 1. Runtime & Core APIs

- **Runtime:** Use **Bun** exclusively. Do not implement Node.js compatibility layers.
- **Database:** Use built-in `bun:sqlite` only with Drizzle ORM.
  - **Path:** `database/db.sql`.
  - **Logic:** All complex SQL queries must be abstracted into `lib/db/queries.ts`.
  - **Security:** Use **parameterized queries** to prevent SQL injection.
  - **Prohibition:** Strictly no third-party database drivers.
- **Cryptography:** Use `Bun.password` for all hashing and verification. Do not install third-party crypto packages.
- **Testing:** Use `bun test` for unit and integration testing. No Vitest, Jest, or Mocha.
- **Typing:** Install and use `@types/bun` for native Bun API support.

### 2. Authentication & UI Framework

- **Authentication:** **Better-Auth** integration.
  - **Plugin:** `phone + password` (Must support both Password and OTP flows).
  - **Adapter:** Follow the [Bun-native SQLite adapter](https://www.better-auth.com/docs/adapters/sqlite#bun-built-in-sqlite) implementation.
  - **Skills:** use `@better-auth/skills` and `onmax/next-skills` following best practices.
- **Framework:** **Next.js 16 (Latest Stable)**.
  - **Documentation:** Refer strictly to v16 docs. No legacy patterns (v15 or below).
  - **Data Fetching:** Force **Server Components** for data fetching; minimize `'use client'` usage.
- **UI System:** **Shadcn UI**, **Tailwind CSS**, **Radix UI Primitives**, and **Lucide Icons**.
  - **Rule:** Priority goes to Shadcn UI components. Do not re-implement existing Shadcn components using raw Tailwind.

### 3. Build Target: PWA (Progressive Web App)

- **Objective:** The final build must be a fully functional PWA.
- **Requirements:**
  - Implement a valid `manifest.json` (Web App Manifest).
  - Configure **Service Workers** for offline capability and caching.
  - Ensure **Responsive Design** for all components (Mobile-first).
  - Include all necessary PWA icons and metadata (theme-color, apple-touch-icon, etc.).
- **Validation:** Must pass **Lighthouse PWA audit** with a score > 90.

### 4. Development Environment

- **OS:** Windows + PowerShell.
- **Strict Prohibition:** Do not use Unix-like commands (e.g., `rm -rf`, `grep`, `export`). Use PowerShell equivalents only.

---

## II. TYPESCRIPT & ARCHITECTURE STANDARDS

- **Global Registry:** All shared definitions must reside in `types/`.
- **Inheritance Pattern:** 1. Define **Base Data Types** (Atomic entities). 2. Extend Base Types for specific contexts (Database, API DTOs, Frontend Props).
- **Strict Typing:** Usage of `any` is strictly prohibited.
- **Dependency Control:** Do not introduce uninstalled packages or new dependencies without explicit confirmation.

---

## III. VERIFICATION & WORKFLOW

### 1. Pre-execution Thought Process

Before any write operation, the Agent must document the following in `THOUGHTS.md` or as a response prefix:

1. **Impacted Files:** List all files to be created or modified.
2. **Schema Changes:** Detail any database migrations or structural changes.
3. **PWA Impact:** Does this change affect service workers, caching, or manifest?
4. **Breaking Risks:** Assess potential impact on existing features.

### 2. Verification Flow

- **Resource Reporting:** Report all new/updated Web Routes, API Endpoints, and Database Schemas.
- **Server Pre-flight Check:**
  - Verify if the port is occupied.
  - **Identity Check:** Run `curl http://localhost:[port]/` and verify if the `<title>` matches the metadata in Next.js.
  - If identity mismatches, terminate the conflicting process and restart the service.
- **Route Validation:**
  - **Web:** Use `curl` to ensure web routes resolve (200 OK).
  - **API:** Test "Happy Paths" using defined test data payloads.

### 3. Error Handling & Migrations

- **Standardized Errors:** Define all `errorcodes` in `constant.ts`.
- **Response Format:** All API errors must return: `{ "code": string, "message": string, "details": any }`.
- **Migrations:** All DB changes must be recorded as raw SQL scripts in `database/migrations/`.

### 4. Testing & Coverage

- **Hierarchy:** Integration Tests (Primary) > Unit Tests > E2E Tests (Playwright with local Chrome).
- **Metric:** Minimum **80% code coverage** required. Report actual coverage metrics upon completion.

---

## IV. TEST DATA SUITE

| Role       | Last Name | First Name | Gender | Phone       | PIN  | Password | Family ID  | Description          |
| :--------- | :-------- | :--------- | :----- | :---------- | :--- | :------- | :--------- | :------------------- |
| **admin**  | -         | admin      | Male   | 13800000001 | -    | 1111     | -          | System Administrator |
| **parent** | Zhang     | 1          | Male   | 13800000100 | -    | 1111     | family-001 | Family 1 (Primary)   |
| **child**  | Zhang     | 3          | Male   | -           | 1111 | -        | family-001 | Family 1 (Child)     |
| **parent** | Zhang     | 2          | Male   | 12800000200 | -    | 1111     | family-001 | Family 1 (Secondary) |
| **parent** | Li        | 1          | Male   | 13800000300 | -    | 1111     | family-002 | Family 2 (Primary)   |
| **parent** | Li        | 2          | Male   | 13800000400 | -    | 1111     | family-002 | Family 2 (Secondary) |
