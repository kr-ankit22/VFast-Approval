# User Management & Authentication Upgrade Plan

This document outlines the strategic plan to upgrade the VFast Booker application's user management and authentication systems. The goal is to create a more secure, scalable, and user-friendly platform suitable for a mature SaaS environment, while respecting the specific operational needs of an institute.

---

### **Phase 1: Quick Wins (Immediate Implementation)**

This phase focuses on building a strong, secure foundation for user onboarding and management with high-impact, low-disruption changes.

| # | Task | Description | Reason |
| :-- | :--- | :--- | :--- |
| 1 | **Create `preApprovedUsers` Table** | **1. New Table:** Create a `preApprovedUsers` table with columns for `email`, `name`, `role`, and `department_id`. <br> **2. Data Model:** The `users` table schema change (making `password` optional) is also required. | This table acts as the clean, definitive source for who is **allowed** to create an account. It cleanly separates the list of *potential* users from *actual* users. |
| 2 | **Upgrade CSV Upload to be "Name-Aware"** | **Modify `/api/admin/users/upload`:** Enhance the CSV parsing logic. <br> **1. Fetch Departments:** Before processing rows, fetch all existing departments from the database to create a `Map<string, number>` (name -> id). <br> **2. Validate & Transform:** For each row in the CSV, use the map to find the `department_id` corresponding to the provided `department_name`. <br> **3. Robust Error Handling:** If any `department_name` in the file is not found, **reject the entire upload** and return a clear error message listing all invalid department names. <br> **4. Provision Users:** If all rows are valid, proceed with an "upsert" into the `preApprovedUsers` table using the resolved `department_id`. | This provides a **user-friendly workflow for the admin** (using names) while maintaining **data integrity on the backend** (using foreign key IDs). The batch error handling prevents partial, corrupt data from being provisioned. |
| 3 | **Implement Pre-Approved Onboarding** | **Update Sign-up/Login Logic:** <br> - When a user signs up (local or Google), the system will check if their email exists in `preApprovedUsers`. <br> - If **yes**, it creates an entry in the main `users` table, copying the role and `department_id` from the `preApprovedUsers` table. <br> - If **no**, access is denied. | This connects the admin's provisioning work to a seamless, self-service user onboarding experience, ensuring accounts are created only for authorized individuals with the correct, pre-assigned permissions. |
| 4 | **Implement Basic Profile Section** | Create a simple "My Profile" page accessible to all logged-in users. <br> - **Backend:** Utilize the existing `GET /api/users/me` and `PATCH /api/users/me` endpoints. <br> - **Frontend:** The page will display the user's name, email, and role, and allow them to view and update their own mobile number. | This provides immediate value to all users and establishes a foundation for more advanced profile features in the future. |

---

### **Phase 2: Long-Term Upgrades (For SaaS Maturity & Scale)**

This phase will follow the successful implementation of Phase 1.

| # | Task | Description | Reason |
| :-- | :--- | :--- | :--- |
| 1 | **Migrate to Stateless JWT Authentication** | Transition from stateful sessions to a stateless JWT model using the **Access Token / Refresh Token** pattern. | **Scalability & Flexibility:** This is the key architectural upgrade for a mature SaaS application. It improves performance under load and makes it easier to support future clients (e.g., a mobile app). |
| 2 | **Implement Advanced RBAC** | Introduce a dedicated Role-Based Access Control (RBAC) library like **`casl`**. | **Granular Control:** As the application's rules become more complex, this will allow you to define permissions beyond simple roles (e.g., who can `reconsider` a `booking`). |
| 3 | **Expand User Profile Section** | Enhance the basic profile page with more features like notification preferences, activity history, and the ability to update more profile information (potentially with an approval workflow). | This builds on the basic profile section to create a comprehensive user-centric hub, further improving the SaaS experience. |
| 4 | **Production Hardening** | Enforce HTTPS. Formalize the use of environment variables for all secrets. Implement a global error handling middleware. | **Security & Reliability:** These are non-negotiable for protecting user data and ensuring a stable production environment. |
