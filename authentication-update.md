# VFast Booker: Authentication & Profile Management Upgrade

This document outlines the phased plan for upgrading the VFast Booker application to support Google-based authentication, user profile management, and email notifications.

## Guiding Principles

*   **Incremental Changes:** Each step will be a small, self-contained change that can be tested and integrated independently.
*   **Feature Flags:** For larger features, we can use feature flags to enable or disable them in production, reducing the risk of breaking the application.
*   **Reusability:** Components and services will be designed with reusability in mind.
*   **Backward Compatibility:** The initial changes will not break the existing username/password authentication system. We will have a transition period where both login methods are supported.

---

## Recent Updates

*   **2025-09-24:** Updated the plan to include a new Admin User Management UI.

---

## Phased Rollout Plan

### Phase 1: The "Invisible" Foundation (Zero Impact on MVP)

*   **Goal:** Get all the backend pieces in place without a single change to the user-facing application.
*   **Steps:**
    1.  **DB Migration:** Add `googleId` (string, nullable, unique) and `mobileNumber` (string, nullable) columns to the `users` table in `shared/schema.ts`.
    2.  **Backend OAuth Logic:**
        *   Implement the `passport-google-oauth20` strategy.
        *   The callback logic will only allow pre-provisioned users (from the CSV) with a `bits-pilani.ac.in` domain to log in.

### Phase 2: Admin User Management UI

*   **Goal:** Provide a user interface for administrators to manage authorized users.
*   **Steps:**
    1.  **Create Admin Page:** Build a new, admin-only page for user management, accessible from the sidebar.
    2.  **User Table:** Implement a data table to display a list of all authorized users. The table will support searching and sorting.
    3.  **CSV Upload:** Create a UI for uploading a CSV file of users. This will replace the need for manual backend scripts.
    4.  **Export Users:** Add a button to export the current list of users as a CSV file.
    5.  **User Actions:** Add actions to the user table, such as the ability to delete a user.

### Phase 3: "Invite-Only" Google Login (Low-Impact, Controlled Rollout)

*   **Goal:** Enable Google Login for a small group of test users without forcing everyone to use it.
*   **Steps:**
    1.  **Add "Sign in with Google" Button:** Add the new login button to the login page, but keep the old username/password form.
    2.  **Testing:** Have a few pre-provisioned users (from the CSV) test the Google login flow.

### Phase 4: Profile Management & Notifications (New, Isolated Features)

*   **Goal:** Build out the new user-facing features, which are isolated from the core booking workflow.
*   **Steps:**
    1.  **Build Profile Page:**
        *   Create the `/profile` page.
        *   Add a "Settings" link to the sidebar.
        *   Display user data (name, email, role, mobile number).
        *   Implement an "Edit" feature for the mobile number.
    2.  **Build Email Notification System:**
        *   Integrate an email service (e.g., SendGrid, Nodemailer).
        *   Trigger email notifications on key booking status changes.

### Phase 5: The "Sunset" (Optional, Future Decision)

*   **Goal:** Decide if you want to fully transition to Google-only login.
*   **Steps:**
    1.  **Communicate:** Inform users about the deprecation of password-based login.
    2.  **Remove Password Login:** Remove the username/password form from the login page.

---

This phased approach ensures that we can develop, test, and deploy these new features incrementally, with minimal disruption to the existing application.