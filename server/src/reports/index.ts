import { generateDepartmentalBookingsReport } from "./departmentalBookings.ts";
import { generateAllBookingsReport } from "./allBookings.ts";
import { generateDepartmentWiseAllotmentReport } from "./departmentWiseAllotment.ts";
import { generateRoomAllocationGuestReport } from "./roomAllocationGuest.ts";

const reportGenerators: { [key: string]: (filters: any) => Promise<any> } = {
  departmentalBookings: generateDepartmentalBookingsReport,
  allBookings: generateAllBookingsReport,
  departmentWiseAllotment: generateDepartmentWiseAllotmentReport,
  roomAllocationGuest: generateRoomAllocationGuestReport,
};

export async function generateReport(reportName: string, filters: any) {
  const generator = reportGenerators[reportName];
  if (!generator) {
    throw new Error(`Report "${reportName}" not found.`);
  }
  return generator(filters);
}
