# Modular Workflow Plan: Booking Reconsideration

This plan breaks down the implementation of the booking reconsideration feature into four main modules.

**Module 1: Database Schema Enhancement**

*   **Task 1.1: Add Rejection Tracking Fields:**
    *   Add a `rejection_history` column (JSONB) to the `bookings` table to store an array of rejection events (reason, rejector, timestamp).
    *   Add a `status` enum value of `PENDING_RECONSIDERATION` to the `BookingStatus` enum.
*   **Task 1.2: Add Re-submission Tracking Fields:**
    *   Add an `is_reconsidered` column (boolean) to the `bookings` table.
    *   Add a `reconsideration_count` column (integer) to the `bookings` table.
    *   Add a `reconsidered_from_id` column (integer, foreign key to `bookings.id`) to link a re-submitted booking to its original.

**Module 2: Backend API Development**

*   **Task 2.1: Enhance the `updateBookingStatus` Endpoint:**
    *   When a booking is rejected, update its status to `PENDING_RECONSIDERATION`.
    *   Add the rejection details (reason, rejector, timestamp) to the `rejection_history` array.
*   **Task 2.2: Create a `reconsiderBooking` Endpoint:**
    *   This endpoint will be called when a student re-submits a rejected booking.
    *   It will create a *new* booking record with the updated details.
    *   The new booking will have `is_reconsidered` set to `true`, `reconsideration_count` incremented, and `reconsidered_from_id` pointing to the original rejected booking.
    *   The original booking will be marked as `is_deleted` or archived.
*   **Task 2.3: Enhance the `getBooking` and `getAllBookings` Endpoints:**
    *   These endpoints will need to be updated to join the `rejection_history` and other new fields.
    *   The `getAllBookings` endpoint should be able to filter out the original, re-submitted bookings and only show the latest version.

**Module 3: Frontend UI Implementation**

*   **Task 3.1: Student's "My Bookings" Page:**
    *   When a booking is in the `PENDING_RECONSIDERATION` state, display the rejection feedback from the `rejection_history`.
    *   Provide a "Re-submit" button that takes the student to a modified booking form.
*   **Task 3.2: Re-submission Form:**
    *   Pre-populate the form with the details of the rejected booking.
    *   Allow the student to edit the details.
    *   On submit, call the new `reconsiderBooking` endpoint.
*   **Task 3.3: Approver's Dashboard (Approval Matrix):**
    *   Display a "Reconsidered" badge or indicator for bookings where `is_reconsidered` is `true`.
    *   Provide a way to view the history of the booking, including previous rejection reasons and modifications. This could be a modal or a separate page.

**Module 4: Testing and Deployment**

*   **Task 4.1: Unit and Integration Tests:**
    *   Write tests for the new and modified backend endpoints.
    *   Write tests for the new frontend components.
*   **Task 4.2: End-to-End Testing:**
    *   Manually test the entire reconsideration workflow, from rejection to re-submission and re-approval.
*   **Task 4.3: Deployment:**
    *   Deploy the changes to production.
