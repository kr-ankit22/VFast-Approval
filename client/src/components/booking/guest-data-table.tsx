
import { useState, Fragment } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Guest } from "@shared/schema";
import { Edit, UserCheck, UserX, ChevronDown, ChevronRight } from "lucide-react";

interface GuestDataTableProps {
  guests: Guest[];
  departmentName: string;
  onEdit: (guest: Guest) => void;
  onCheckIn: (guest: Guest) => void;
  onCheckOut: (guest: Guest) => void;
}

const GuestDetails = ({ guest }: { guest: Guest }) => (
  <div className="p-4 bg-gray-50">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
      <div className="space-y-2">
        <p><strong>Origin:</strong> {guest.origin || 'N/A'}</p>
        <p><strong>SPOC Name:</strong> {guest.spocName || 'N/A'}</p>
        <p><strong>SPOC Contact:</strong> {guest.spocContact || 'N/A'}</p>
      </div>
      <div className="space-y-2">
        <p><strong>Food Preferences:</strong> {guest.foodPreferences || 'N/A'}</p>
        <p><strong>Other Special Requests:</strong> {guest.otherSpecialRequests || 'N/A'}</p>
        {(guest.citizenCategory === 'Foreign National' || guest.citizenCategory === 'NRI') && (
          <>
            <p><strong>Passport Number:</strong> {guest.passportNumber || 'N/A'}</p>
            <p><strong>Nationality:</strong> {guest.nationality || guest.otherNationality || 'N/A'}</p>
          </>
        )}
      </div>
    </div>
  </div>
);

export default function GuestDataTable({ guests, departmentName, onEdit, onCheckIn, onCheckOut }: GuestDataTableProps) {
  const [expanded, setExpanded] = useState({});
  const columns: ColumnDef<Guest>[] = [
    {
      id: "expander",
      header: () => null,
      cell: ({ row }) => {
        return row.getCanExpand() ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              row.toggleExpanded();
            }}
          >
            {row.getIsExpanded() ? <ChevronDown /> : <ChevronRight />}
          </Button>
        ) : null;
      },
    },
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "contact",
      header: "Contact",
    },
    {
      accessorKey: "citizenCategory",
      header: "Citizen Category",
    },
    {
      id: "department",
      header: "Department",
      cell: () => departmentName,
    },
    {
      accessorKey: "checkedIn",
      header: "Status",
      cell: ({ row }) => (row.original.checkedIn ? 
        <span className="text-green-600">Checked-in</span> : 
        <span className="text-yellow-600">Pending</span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const guest = row.original;
        return (
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(guest);}}>
              <Edit className="h-4 w-4" />
            </Button>
            {!guest.checkedIn ? (
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onCheckIn(guest);}}>
                <UserCheck className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onCheckOut(guest);}}>
                <UserX className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: guests,
    columns,
    state: {
      expanded,
    },
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
  });

  return (
    <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <Fragment key={row.id}>
                <TableRow
                  data-state={row.getIsSelected() && "selected"}
                  onClick={row.getToggleExpandedHandler()}
                  className="cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
                {row.getIsExpanded() && (
                  <TableRow>
                    <TableCell colSpan={columns.length}>
                      <GuestDetails guest={row.original} />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No guests found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
