
import { Request, Response } from 'express';
import * as fastcsv from 'fast-csv';
import { generateAllBookingsReport } from './reports/allBookings';
import { generateDepartmentWiseAllotmentReport } from './reports/departmentWiseAllotment';
import { generateRoomAllocationGuestReport } from './reports/roomAllocationGuest';
import { generateDepartmentalBookingsReport } from './reports/departmentalBookings';

const reportGenerators: { [key: string]: (filters: any) => Promise<any[]> } = {
  allBookings: generateAllBookingsReport,
  departmentWiseAllotment: generateDepartmentWiseAllotmentReport,
  roomAllocationGuest: generateRoomAllocationGuestReport,
  departmentalBookings: generateDepartmentalBookingsReport,
};

export const handleGenerateReport = async (req: Request, res: Response) => {
  console.log('Backend: Received request to generate report.');
  const { reportType, ...filters } = req.body;
  console.log(`Backend: Report Type: ${reportType}, Filters:`, filters);

  const generateReport = reportGenerators[reportType];

  if (!generateReport) {
    console.error(`Backend: Invalid report type received: ${reportType}`);
    return res.status(400).json({ message: 'Invalid report type' });
  }

  try {
    const data = await generateReport(filters);
    console.log(`Backend: Successfully generated report for ${reportType}. Data length: ${data.length}`);
    res.json(data);
  } catch (error) {
    console.error('Backend: Error generating report:', error);
    res.status(500).json({ message: 'Failed to generate report' });
  }
};

export const handleExportReport = async (req: Request, res: Response) => {
  console.log('Backend: Received request to export report.');
  const { reportType, ...filters } = req.body;
  console.log(`Backend: Export Report Type: ${reportType}, Filters:`, filters);

  const generateReport = reportGenerators[reportType];

  if (!generateReport) {
    console.error(`Backend: Invalid report type received for export: ${reportType}`);
    return res.status(400).json({ message: 'Invalid report type' });
  }

  try {
    const data = await generateReport(filters);
    console.log(`Backend: Successfully generated report for export for ${reportType}. Data length: ${data.length}`);

    if (data.length === 0) {
      return res.status(204).send(); // No Content
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${reportType}-report.csv`);

    const csvStream = fastcsv.format({ headers: true });
    csvStream.pipe(res);

    data.forEach(row => csvStream.write(row));

    csvStream.end();
  } catch (error) {
    console.error('Backend: Error exporting report:', error);
    res.status(500).json({ message: 'Failed to export report' });
  }
};
