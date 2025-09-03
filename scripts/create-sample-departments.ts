import { db } from "../server/db";
import { departments } from "../shared/schema";

async function createSampleDepartments() {
  try {
    console.log("Creating sample departments...");

    const departmentNames = [
      "Computer Science",
      "Electrical Engineering",
      "Mechanical Engineering",
      "Civil Engineering",
      "Chemistry",
      "Physics",
      "Mathematics",
      "Management",
      "Economics",
    ];

    for (const name of departmentNames) {
      const [department] = await db.insert(departments).values({ name }).returning();
      console.log("Created department:", department.name);
    }

    console.log("Successfully created all sample departments!");
  } catch (error) {
    console.error("Error creating sample departments:", error);
  } finally {
    process.exit(0);
  }
}

createSampleDepartments();