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
    *   Create a reusable `sendEmail` function that takes `to`, `subject`, `html` content, and `text` content as arguments.
    *   Develop email templates for different notification types.
3.  **Notification Triggers & Templates:**

    *   **Template 1: Welcome Email (New User Registration)**
        *   **Event:** New User Registration (both local and Google sign-up).
        *   **Recipient:** The newly registered user.
        *   **Subject:** `Welcome to VFast Booker!`
        *   **Content (HTML/Text):** "Welcome, [User Name]! Your account has been successfully created. You can now log in to the VFast Booker application by clicking [here]([FRONTEND_URL]/login)."
        *   **Affected Modules:** `server/routes.ts` (for local registration), `server/google-auth.ts` (for Google sign-up).

    *   **Template 2: New Booking Request (to Department Approver)**
        *   **Event:** When a new booking is created.
        *   **Recipient:** The relevant Department Approver.
        *   **Subject:** `New Booking Request #[Booking ID] for [Department Name]`
        *   **Content (HTML/Text):** "Dear [Approver Name], A new booking request #[Booking ID] has been submitted for your department, [Department Name]. Please review the request in the VFast Booker application by clicking [here]([FRONTEND_URL]/department/requests)."
        *   **Affected Module:** `server/storage.ts` (within `createBooking`).

    *   **Template 3: Booking Status Update (to Booking User)**
        *   **Event:** When a booking's status changes (e.g., Approved by Department, Approved by Admin, Rejected).
        *   **Recipient:** The user who created the booking.
        *   **Subject:** `Your Booking #[Booking ID] Status Update: [New Status]`
        *   **Content (HTML/Text):** "Dear [User Name], Your booking request #[Booking ID] has been updated to **[New Status]** by [Approver Role]. [Optional Notes]. You can view details by clicking [here]([FRONTEND_URL]/booking/[Booking ID]). Thank you for using VFast Booker."
        *   **Affected Module:** `server/storage.ts` (within `updateBookingStatus`).

    *   **Template 4: Room Allocated (to Booking User)**
        *   **Event:** When a room is allocated to a booking.
        *   **Recipient:** The user who created the booking.
        *   **Subject:** `Your Booking #[Booking ID] - Room Allocated!`
        *   **Content (HTML/Text):** "Dear [User Name], Your booking request #[Booking ID] has been successfully allocated a room. Room Number: **[Room Number]**. [Optional Notes]. You can view details by clicking [here]([FRONTEND_URL]/booking/[Booking ID]). Thank you for using VFast Booker."
        *   **Affected Module:** `server/storage.ts` (within `allocateRoom`).

**4. Error Handling:**

*   **Strategy:** Email sending failures will be logged but will **not** block the main application flow.

**5. Utilizing Existing Components:**

*   We will leverage the existing `sendEmail` function in `server/email.ts` and the `logger` for error reporting.

---

**Note:** This updated plan for the Email Notification System is the preferred approach.
