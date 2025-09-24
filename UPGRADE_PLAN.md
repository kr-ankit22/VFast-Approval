### **Plan: Authentication and Email Notification System Upgrade**

This plan outlines a lean, robust implementation for upgrading the application's authentication mechanism to include Google OAuth and to introduce a comprehensive email notification system.

**1. Change Type & Severity**

*   **Type:** Feature Enhancement
*   **Severity:** Moderate. This change impacts core user-facing functionality (login, registration) and introduces a new notification system. While critical, the implementation is designed to be modular and minimally disruptive.

**2. Impacting Modules**

*   **Backend:**
    *   `server/auth.ts`: To be created/modified to consolidate authentication logic.
    *   `server/google-auth.ts`: Will be integrated into the main auth flow.
    *   `server/email.ts`: To be enhanced with a robust email transport.
    *   `server/routes.ts`: To handle new authentication and notification-triggering routes.
    *   `server/app.ts`: To integrate new middleware and routes.
    *   `.env.example`: To add new environment variables for Google OAuth and SMTP settings.
*   **Shared:**
    *   `shared/schema.ts`: To confirm user schema supports necessary fields (`googleId`, `email`, `name`).
*   **Frontend:**
    *   `client/src/pages/auth-page.tsx`: To add the "Sign in with Google" button.
    *   `client/src/hooks/use-auth.tsx`: To handle the frontend logic for Google authentication.

---

### **3. Detailed Implementation Plan**

#### **Part A: Google OAuth Authentication Upgrade**

The goal is to allow users to sign up and log in using their Google account, which simplifies registration and improves security.

**Lean Implementation:**

1.  **Configuration:**
    *   Utilize the existing `passport-google-oauth20` library.
    *   Securely store `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env` file.
2.  **Backend Logic (`server/auth.ts`, `server/google-auth.ts`):**
    *   Configure Passport.js with the Google strategy. The callback URL will be `/api/auth/google/callback`.
    *   In the callback handler, implement logic to find or create a user:
        *   **Existing User:** If a user with the Google profile's email exists, link the Google ID to their account.
        *   **New User:** If no user exists, create a new user in the `users` table with their Google profile information (name, email, Google ID).
    *   Upon successful authentication, create a session for the user, returning the user profile to the frontend.
3.  **Frontend Integration (`client/src/pages/auth-page.tsx`):**
    *   Add a "Sign in with Google" button that links to the backend endpoint `/api/auth/google`.

**Error Handling:**

*   **Failed Google Sign-In:** If Google returns an error (e.g., user denies permission), the backend will redirect to a frontend failure page (`/login?error=google_failed`) with a clear error message.
*   **Database Errors:** All database operations (finding/creating users) will be wrapped in `try/catch` blocks. If a database error occurs, the API will return a `500 Internal Server Error` response, and the error will be logged.
*   **User Already Linked:** If a user tries to link a Google account that is already associated with another user, a `409 Conflict` error will be returned with an appropriate message.

---

#### **Part B: Email Notification System**

This system will send transactional emails for key events in the booking lifecycle.

**Lean Implementation:**

1.  **Technology:**
    *   Use **Nodemailer**, a robust and widely-used Node.js library for sending emails.
    *   Configure an SMTP transport using credentials stored in the `.env` file (e.g., `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`). This allows flexibility to use services like Gmail, SendGrid, or Mailgun.
2.  **Core Logic (`server/email.ts`):**
    *   Create a reusable `sendEmail` function that takes `to`, `subject`, and `html` content as arguments.
    *   Develop email templates for different notification types.
3.  **Notification Triggers:**
    *   **User Registration:** Send a "Welcome to VFast Booker" email upon new user creation (especially via Google OAuth).
    *   **Booking Status Change:**
        *   When a booking status changes to `PendingApproval`, `Approved`, `Rejected`, or `Allocated`, trigger an email to the user who created the booking.
        *   When a booking requires department approval, notify the corresponding approver.
    *   **Password Reset:** (Future enhancement, but the email foundation will be ready).

**Error Handling:**

*   **Invalid Email Configuration:** The application will perform a check on startup (`smtpTransport.verify()`) to ensure SMTP credentials are valid. If not, it will log a critical error and fail to start, preventing runtime failures.
*   **Failed Email Delivery:** The `sendEmail` function will be wrapped in a `try/catch` block.
    *   If an email fails to send (e.g., invalid recipient address, SMTP service down), the error will be logged with details (`recipient`, `subject`, `error message`).
    *   The primary application flow (e.g., booking approval) will **not** be blocked. The failure will be logged, but the user action (like approving a booking) will still succeed. This ensures the email system is not a single point of failure for core application logic.
