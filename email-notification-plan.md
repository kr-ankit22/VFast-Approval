### Comprehensive Plan: SaaS-Grade Email Notifications

**Goal:** Implement automated, rich HTML email notifications with dynamic hyperlinks for key application events.

**Scope:** Notifications for new booking requests, department approval/rejection, admin approval/rejection, and room allocation.

---

**Phase 1: Backend - Core Infrastructure & Templates**

1.  **Examine `server/storage.ts`:**
    *   **Action:** Read `server/storage.ts` to understand the available methods for fetching users (by ID, role, department) and booking details. This is crucial for identifying recipients.
    *   **Outcome:** A clear understanding of how to fetch all necessary recipient and booking data.

2.  **Create Email Template Helper:**
    *   **Action:** Create a new file, `server/email-templates.ts`, to house functions that generate HTML content for different notification types. These functions will take relevant data (e.g., booking details, user info, frontend URL) and return a complete HTML email body.
    *   **Outcome:** Centralized, reusable, and easily maintainable email content.

3.  **Configure Frontend Base URL:**
    *   **Action:** Add `FRONTEND_BASE_URL` to `.env.example` and ensure it's used when constructing hyperlinks in email templates.
    *   **Outcome:** Dynamic, clickable links in emails that direct users to the relevant page in the application.

---

**Phase 2: Backend - Integration into Routes**

For each major event, I will integrate email sending into the relevant `server/routes.ts` endpoint:

1.  **New Booking Request:**
    *   **Trigger:** `POST /api/bookings` (when a user creates a new booking).
    *   **Recipient:** The Department Approver associated with the booking's department.
    *   **Content:** Email notifying of a new request, with a link to the department approver's booking requests page.

2.  **Department Approval/Rejection:**
    *   **Trigger:** `PATCH /api/bookings/:id/department-approval` (when a department approver acts).
    *   **Recipient:** The original Booking User and all Admin users.
    *   **Content:** Email to the booking user with status update (Approved/Rejected) and a link to their booking details. Email to admins for awareness.

3.  **Admin Approval/Rejection:**
    *   **Trigger:** `PATCH /api/bookings/:id/status` (when an admin acts).
    *   **Recipient:** The original Booking User and all VFast users.
    *   **Content:** Email to the booking user with status update (Approved/Rejected) and a link to their booking details. Email to VFast for awareness/action.

4.  **Room Allocation:**
    *   **Trigger:** `PATCH /api/bookings/:id/allocate` (when VFast allocates a room).
    *   **Recipient:** The original Booking User.
    *   **Content:** Email confirming room allocation with room details and a link to the booking details page.

---

**Phase 3: Testing & Refinement**

*   **Manual Testing:** Thoroughly test each notification to ensure it's sent to the correct recipients, contains accurate information, and that all hyperlinks function as expected.

---

**Scale and Scope of Changes:**

*   **Scale:** Moderate. This involves modifying several backend routes and creating new utility files.
*   **Scope:** Primarily backend (`server/routes.ts`, new `server/email-templates.ts`, potentially `server/storage.ts`). Configuration (`.env.example`). No direct frontend changes are required for sending emails, but frontend routes will be linked.
