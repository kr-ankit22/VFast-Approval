# Approach

Create a comprehensive plan highlighting the change type, its severity, impacting modules and the edge cases. This should be the response type before any major changes to the project structure

# Project Description

This project is a full-stack hostel booking application for BITS Pilani, named "VFast Booker". It is designed to streamline the booking process, from initial request to final room allocation and guest management. The application features a robust role-based access control (RBAC) system to cater to the different needs of various user groups, including students, department approvers, administrators, and the VFast team.

The frontend is a modern React application built with Vite, offering a responsive and intuitive user interface. It utilizes `@tanstack/react-query` for efficient data fetching and state management, and `shadcn/ui` for a polished and consistent look and feel.

The backend is a powerful Node.js application written in TypeScript with the Express framework. It provides a secure and scalable RESTful API for all frontend operations. Authentication is handled using `passport.js` with a local strategy, and sessions are stored in a PostgreSQL database.

The database schema is managed using Drizzle ORM, ensuring type safety and ease of use. The schema is well-structured and includes tables for users, departments, bookings, rooms, guests, and room maintenance.

# Recent Updates

*   **[Date]:** [Description of update 1]
*   **[Date]:** [Description of update 2]
*   **[Date]:** [Description of update 3]

# Project Workflow

The project is a full-stack application with a React front-end and a Node.js (Express) back-end.

- **Front-end:** The client-side is a React application built with Vite. The source code is located in the `client/src` directory.
- **Back-end:** The server-side is an Express application written in TypeScript. The source code is in the `server` directory. The entry point for the server is `server/index.ts`.
- **Database:** The project uses a PostgreSQL database with Drizzle ORM for database access. The database schema is defined in `shared/schema.ts`.
- **Development:** To start the development server, run `npm run dev`. This command starts the back-end server and the front-end development server.
- **Building:** To build the application for production, run `npm run build`. This command builds both the client and server and outputs the production-ready files to the `dist` directory.
- **Production:** To start the production server, run `npm run start`.

# DB Structure

The database schema is defined in `shared/schema.ts` using Drizzle ORM. The main tables are:

- `users`: Stores user information, including their role (booking, department_approver, admin, vfast).
- `departments`: Stores department information.
- `bookings`: Stores booking information, including the status of the booking, check-in and check-out dates, and guest count.
- `rooms`: Stores room information, including the room number, type, and status.
- `guests`: Stores information about guests associated with a booking.
- `roomMaintenance`: Tracks maintenance schedules for rooms.
- `guestNotes`: Stores notes related to guests.

The relationships between these tables are defined in the schema file.

# Manual Migration Scripts

The project uses a manual migration approach. The migration scripts are located in the `scripts` directory.

- **`manual-migrate.ts`**: This is the main script for running database migrations. It should be executed by running `npm run migrate`.
- **`migrations/`**: This directory contains the SQL migration files. Each file represents a single migration.
- **`db-reset.ts`**: This script can be used to reset the database to a clean state. It can be executed by running `npm run db:reset`.
- **`create-tables.ts`**: This script can be used to create the initial database tables.
- **Sample Data Scripts**: The `scripts` directory also contains several scripts for seeding the database with sample data (e.g., `create-sample-users.ts`, `create-sample-rooms.ts`).