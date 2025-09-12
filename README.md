# VFast Booker

VFast Booker is a full-stack hostel booking application for BITS Pilani, designed to streamline the booking process from initial request to final room allocation and guest management.

## Features

*   **Role-Based Access Control:** Different user roles (Booking User, Department Approver, Admin, VFast) with different permissions.
*   **Booking Workflow:** A comprehensive booking workflow from creation, department approval, admin approval, to room allocation.
*   **Room Management:** Admins and VFast users can manage rooms, including their status and maintenance schedules.
*   **Guest Management:** VFast users can manage guests, including check-in, check-out, and guest notes.
*   **Reconsideration Workflow:** Users can request reconsideration for rejected bookings.
*   **Dashboard:** Each user role has a dedicated dashboard to view relevant information.
*   **Real-time Updates:** The application uses real-time updates to keep the user informed about the status of their bookings.

## Tech Stack

*   **Frontend:** React, Vite, TypeScript, Tailwind CSS, shadcn/ui
*   **Backend:** Node.js, Express, TypeScript
*   **Database:** PostgreSQL, Drizzle ORM
*   **Authentication:** Passport.js

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   Node.js
*   npm
*   PostgreSQL

### Installation

1.  Clone the repo
    ```sh
    git clone https://github.com/your_username_/VFastBooker.git
    ```
2.  Install NPM packages
    ```sh
    npm install
    ```
3.  Create a `.env` file in the root directory and add the following environment variables:
    ```
    DATABASE_URL="your_postgresql_database_url"
    SESSION_SECRET="your_session_secret"
    ```
4.  Run the database migrations:
    ```sh
    npm run migrate
    ```
5.  Start the development server:
    ```sh
    npm run dev
    ```

The application will be available at `http://localhost:5000`.
