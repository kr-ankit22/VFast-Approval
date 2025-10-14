
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { BookingStatus, UserRole } from "@shared/schema";
import { PaginatedTable } from "@/components/ui/paginated-table";

const reportsConfig = {
  [UserRole.DEPARTMENT_APPROVER]: [
    { name: "departmentalBookings", label: "Departmental Bookings Report" },
  ],
  [UserRole.ADMIN]: [
    { name: "allBookings", label: "All Bookings Report" },
    { name: "departmentWiseAllotment", label: "Department-wise Allotment Report" },
  ],
  [UserRole.VFAST]: [
    { name: "roomAllocationGuest", label: "Room Allocation & Guest Report" },
    { name: "departmentWiseAllotment", label: "Department-wise Allotment Report" },
  ],
};

type ReportRow = { [key: string]: any };

interface Department {
  id: number;
  name: string;
}

export default function ReportsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedReport, setSelectedReport] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [status, setStatus] = useState("all"); // Default to 'all'

  const [reportData, setReportData] = useState<ReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Client-side filter states
  const [clientFilterStatus, setClientFilterStatus] = useState("all");
  const [clientFilterDepartment, setClientFilterDepartment] = useState("all");

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await api.get("/api/departments");
        setDepartments(response);
      } catch (error) {
        console.error("Failed to fetch departments:", error);
        toast({
          title: "Error",
          description: "Failed to load departments for filtering.",
          variant: "destructive",
        });
      }
    };
    fetchDepartments();
  }, []);

  const userReports = user ? reportsConfig[user.role as UserRole] || [] : [];

  const handleGenerateReport = async () => {
    if (!selectedReport) {
      toast({ title: "Please select a report type.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const filters = {
        reportType: selectedReport,
        startDate: dateRange?.from,
        endDate: dateRange?.to,
        status: status === "all" ? undefined : status,
      };
      console.log('Frontend: Sending filters to backend:', filters);
      const response = await api.post("/api/reports/generate", filters);
      const data = response;

      if (data.length > 0) {
        setReportData(data);
      } else {
        setReportData([]);
        toast({ title: "No results found.", description: "Your query returned no data." });
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error Generating Report",
        description: `An unexpected error occurred: ${(error as Error).message || String(error)}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = async () => {
    if (reportData.length === 0) {
      toast({ title: "No data to export.", description: "Please generate a report first.", variant: "destructive" });
      return;
    }
    try {
      const filters = {
        reportType: selectedReport,
        startDate: dateRange?.from,
        endDate: dateRange?.to,
        status: status === "all" ? undefined : status,
      };
      const response = await api.post("/api/reports/export", filters, { responseType: "blob" });

      const url = window.URL.createObjectURL(response);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${selectedReport}-report.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error exporting report:", error);
      toast({
        title: "Error Exporting Report",
        description: `An unexpected error occurred: ${(error as Error).message || String(error)}`,
        variant: "destructive",
      });
    }
  };

  // Apply client-side filters
  const filteredReportData = reportData.filter(item => {
    const matchesStatus = clientFilterStatus === "all" || item.status === clientFilterStatus;
    const matchesDepartment = clientFilterDepartment === "all" || String(item.department_id) === clientFilterDepartment;
    return matchesStatus && matchesDepartment;
  });

  // Define columns for PaginatedTable based on selected report type
  const getColumns = (reportType: string, data: ReportRow[]) => {
    if (data.length === 0) return [];

    const commonRender = (value: any) => {
      if (value === null || value === undefined || value === '') return "N/A";
      if (typeof value === 'boolean') return value ? 'Yes' : 'No';
      if (value instanceof Date) return value.toLocaleDateString();
      if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)) {
        return new Date(value).toLocaleDateString();
      }
      return String(value);
    };

    if (reportType === 'departmentWiseAllotment') {
      return [
        { key: 'department_name', header: 'Department', sortable: true, render: (item: ReportRow) => commonRender(item.department_name) },
        { key: 'total_bookings_created', header: 'Total Created', sortable: true, render: (item: ReportRow) => commonRender(item.total_bookings_created) },
        { key: 'total_pending_department_approval', header: 'Pending Dept. Approval', sortable: true, render: (item: ReportRow) => commonRender(item.total_pending_department_approval) },
        { key: 'total_pending_admin_approval', header: 'Pending Admin Approval', sortable: true, render: (item: ReportRow) => commonRender(item.total_pending_admin_approval) },
        { key: 'total_approved', header: 'Total Approved', sortable: true, render: (item: ReportRow) => commonRender(item.total_approved) },
        { key: 'total_rejected', header: 'Total Rejected', sortable: true, render: (item: ReportRow) => commonRender(item.total_rejected) },
        { key: 'total_allocated', header: 'Total Allocated', sortable: true, render: (item: ReportRow) => commonRender(item.total_allocated) },
        { key: 'total_pending_reconsideration', header: 'Pending Reconsideration', sortable: true, render: (item: ReportRow) => commonRender(item.total_pending_reconsideration) },
      ];
    }

    const defaultColumns = Object.keys(data[0]).map(key => ({
      key,
      header: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      sortable: key === 'booking_id' || key === 'check_in_date' || key === 'check_out_date' || key === 'status',
      render: (item: ReportRow) => {
        // Specific transformations based on key and context
        if (key === 'room_number' && (item.status === BookingStatus.PENDING_DEPARTMENT_APPROVAL || item.status === BookingStatus.PENDING_ADMIN_APPROVAL)) {
          return item[key] === null ? 'Not Allocated' : commonRender(item[key]);
        }
        if (key === 'department' && item.department_id) {
          const dept = departments.find(d => d.id === item.department_id);
          return dept ? dept.name : commonRender(item[key]);
        }
        return commonRender(item[key]);
      }
    }));

    return defaultColumns;
  };

  const columns = getColumns(selectedReport, filteredReportData);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="report">Select Report</Label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger id="report">
                  <SelectValue placeholder="Select a report" />
                </SelectTrigger>
                <SelectContent>
                  {userReports.map((report) => (
                    <SelectItem key={report.name} value={report.name}>
                      {report.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date Range</Label>
              <DateRangePicker date={dateRange} onDateChange={setDateRange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.values(BookingStatus).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button onClick={handleGenerateReport} disabled={isLoading || !selectedReport}>
              {isLoading ? "Generating..." : "Generate Report"}
            </Button>
            <Button onClick={handleExportReport} disabled={reportData.length === 0} variant="outline">
              Export to CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {reportData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Report Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-4">
              <div className="space-y-2">
                <Label htmlFor="client-filter-status">Filter by Status</Label>
                <Select value={clientFilterStatus} onValueChange={setClientFilterStatus}>
                  <SelectTrigger id="client-filter-status">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {Object.values(BookingStatus).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-filter-department">Filter by Department</Label>
                <Select value={clientFilterDepartment} onValueChange={setClientFilterDepartment}>
                  <SelectTrigger id="client-filter-department">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={String(dept.id)}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <PaginatedTable
              data={filteredReportData}
              columns={columns}
              initialPageSize={10}
              emptyMessage="No report data found for the selected filters."
            />
            {filteredReportData.length > 0 && (
              <div className="text-sm text-muted-foreground mt-2">
                Showing {filteredReportData.length} result(s).
              </div>
            )}
            {filteredReportData.length > 0 && (
              <div className="text-sm text-muted-foreground mt-2">
                Showing {filteredReportData.length} result(s).
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
