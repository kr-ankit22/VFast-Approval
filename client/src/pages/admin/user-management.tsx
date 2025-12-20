import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, UploadCloud, PlusCircle, Edit, Trash2, Search, Users, Building2 } from "lucide-react";
import { User, UserRole } from "@shared/schema";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { useDepartments } from "@/hooks/use-departments";
import { Combobox } from "@/components/ui/combobox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
// Zod schema for creating/updating a user
const userFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
  role: z.nativeEnum(UserRole),
  phone: z.string().optional().refine(val => !val || /^\d{10}$/.test(val), {
    message: "Phone number must be 10 digits",
  }),
  department: z.string({ required_error: "Department is required." }).min(1, "Department is required."),
  authMethod: z.enum(["Password", "Google"]),
}).superRefine(({ confirmPassword, password, authMethod }, ctx) => {
  if (authMethod === "Password") {
    if (!password || password.length < 6) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: "Password must be at least 6 characters",
      });
    }
    if (password !== confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  }
});

type UserFormValues = z.infer<typeof userFormSchema>;

export default function UserManagementPage() {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all users
  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users");
      return res.json();
    }
  });

  // Fetch departments for the combobox
  const { data: departments, isLoading: isLoadingDepartments } = useDepartments();

  const departmentOptions = departments?.map(dept => ({ value: String(dept.id), label: dept.name })) || [];

  // Create a map for easy lookup in the table
  const departmentMap = departments?.reduce((acc, dept) => {
    acc[dept.id] = dept.name;
    return acc;
  }, {} as Record<number, string>);

  // Fetch user metrics
  const { data: userMetrics, isLoading: isLoadingMetrics } = useQuery<{ totalUsers: number; totalDepartments: number }>({
    queryKey: ["userMetrics"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/stats/users");
      return res.json();
    }
  });

  // CSV Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: async (csvFile: File) => {
      const formData = new FormData();
      formData.append("file", csvFile);
      const res = await apiRequest("POST", "/api/admin/users/upload", formData);
      return res.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: `Created ${data.created} users, updated ${data.updated} users.`,
      });
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["userMetrics"] });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.response?.data?.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  // Add/Edit User Mutation
  const userMutation = useMutation({
    mutationFn: async (userData: UserFormValues & { id?: number }) => {
      if (userData.id) {
        // Update existing user
        const res = await apiRequest("PATCH", `/api/admin/users/${userData.id}`, userData);
        return res.data;
      } else {
        // Create new user
        const res = await apiRequest("POST", "/api/admin/users", userData);
        return res.data;
      }
    },
    onSuccess: () => {
      toast({
        title: editingUser ? "User Updated" : "User Created",
        description: editingUser ? "User details have been updated." : "New user has been created.",
      });
      setIsAddUserDialogOpen(false);
      setEditingUser(null);
      userForm.reset();
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["userMetrics"] });
    },
    onError: (error: any) => {
      toast({
        title: editingUser ? "Update Failed" : "Creation Failed",
        description: error.response?.data?.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  // Delete User Mutation
  const deleteMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "User Deleted",
        description: "The user has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["userMetrics"] });
    },
    onError: (error: any) => {
      toast({
        title: "Deletion Failed",
        description: error.response?.data?.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  const userForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: UserRole.BOOKING,
      phone: "",
      department: "",
      authMethod: "Password",
    },
  });

  useEffect(() => {
    if (editingUser) {
      userForm.reset({
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        phone: editingUser.mobileNumber || "",
        department: editingUser.department_id?.toString() || "",
        password: "",
        confirmPassword: "",
        authMethod: "Password",
      });
    } else {
      userForm.reset({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: UserRole.BOOKING,
        phone: "",
        department: "",
        authMethod: "Password",
      });
    }
  }, [editingUser, userForm]);

  const onUserFormSubmit = (data: UserFormValues) => {
    const { confirmPassword, ...rest } = data;
    userMutation.mutate({ ...rest, id: editingUser?.id });
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsAddUserDialogOpen(true);
  };

  const handleDeleteUser = (userId: number) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      deleteMutation.mutate(userId);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "text/csv": [".csv"] },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
      }
    },
  });

  const handleCsvUpload = () => {
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const filteredUsers = users?.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingMetrics ? <Loader2 className="h-5 w-5 animate-spin" /> : userMetrics?.totalUsers ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">All registered users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Departments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingMetrics ? <Loader2 className="h-5 w-5 animate-spin" /> : userMetrics?.totalDepartments ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Departments in the system</p>
          </CardContent>
        </Card>
      </div>

      {/* User Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>User Accounts</CardTitle>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-grow md:w-64">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  className="pl-8"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingUser(null)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New User
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md h-[90vh]">
                  <DialogHeader>
                    <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
                    <DialogDescription>
                      {editingUser ? "Make changes to the user profile here." : "Fill in the details to create a new user account."}
                      <p className="mt-2 text-sm text-muted-foreground">
                        Users created with a BITS Pilani email can log in via Google. Their Google account will be automatically linked on first Google login.
                      </p>
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="h-full">
                    <TooltipProvider>
                      <Form {...userForm}>
                        <form onSubmit={userForm.handleSubmit(onUserFormSubmit)} className="space-y-4 pr-6">
                          <FormField
                            control={userForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="John Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={userForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input placeholder="john.doe@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={userForm.control}
                            name="authMethod"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Authentication Method</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select an authentication method" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Password">Password</SelectItem>
                                    <SelectItem value="Google">Google</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          {userForm.watch("authMethod") === "Password" && (
                            <>
                              <FormField
                                control={userForm.control}
                                name="password"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                      <Input type="password" placeholder="••••••••" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                      {editingUser ? "Leave blank to keep current password." : "Minimum 6 characters."}
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={userForm.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Confirm Password</FormLabel>
                                    <FormControl>
                                      <Input type="password" placeholder="••••••••" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </>
                          )}
                          <FormField
                            control={userForm.control}
                            name="role"
                            render={({ field }) => (
                              <FormItem>
                                <div className="flex items-center space-x-1">
                                  <FormLabel>Role</FormLabel>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>BOOKING: Standard user, can make booking requests.</p>
                                      <p>DEPARTMENT_APPROVER: Approves bookings for their department.</p>
                                      <p>ADMIN: Full administrative access.</p>
                                      <p>VFAST: Manages rooms, guests, and booking workflows.</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                                <FormControl>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Object.values(UserRole).map((role) => (
                                        <SelectItem key={role} value={role}>
                                          {role.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={userForm.control}
                            name="department"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <div className="flex items-center space-x-1">
                                  <FormLabel>Department</FormLabel>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Every user must be assigned to a department.</p>
                                      <p>Select the department the user belongs to.</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                                <FormControl>
                                  <Combobox
                                    options={departmentOptions}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Select department..."
                                    searchPlaceholder="Search departments..."
                                    noResultsMessage={isLoadingDepartments ? "Loading..." : "No departments found."}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={userForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="+91 12345 67890" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <DialogFooter className="pt-4">
                            <Button type="submit" disabled={userMutation.isPending}>
                              {userMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                              {editingUser ? "Save Changes" : "Create User"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </TooltipProvider>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading users data...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>Error loading users: {error.message}</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No users found matching your criteria.</p>
              {searchTerm && (
                <p className="mt-2">
                  Try a different search term or clear the search.
                  <Button
                    variant="link"
                    className="ml-1 p-0"
                    onClick={() => setSearchTerm("")}
                  >
                    Clear search
                  </Button>
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell><Badge variant="secondary" className="capitalize">{user.role.replace(/_/g, " ")}</Badge></TableCell>
                      <TableCell>{departmentMap?.[user.department_id] || user.department_id || "-"}</TableCell>
                      <TableCell>{user.mobileNumber || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.id)} className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CSV Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk User Upload (CSV)</CardTitle>
          <CardDescription>Upload a CSV file to create or update multiple user accounts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-1">
              <Label htmlFor="csv-format-bulk">CSV Format</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Expected columns: `email`, `role`, `department`, `name` (optional), `phone` (optional).</p>
                  <p>Roles: BOOKING, DEPARTMENT_APPROVER, ADMIN, VFAST.</p>
                  <p>Department: Mandatory, must be the numerical ID of the department.</p>
                  <p>Example: `john.doe@pilani.bits-pilani.ac.in,BOOKING,1,John Doe,+919876543210`</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="csv-format-bulk"
              value="email,role,department,name,phone"
              readOnly
              className="font-mono bg-muted"
            />
            <p className="text-sm text-muted-foreground">
              The 'department' column is now mandatory for all users and must contain the department ID.
            </p>
          </div>

          <div
            {...getRootProps()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
          >
            <input {...getInputProps()} />
            {uploadMutation.isPending ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Uploading...</span>
              </div>
            ) : isDragActive ? (
              <p>Drop the CSV file here ...</p>
            ) : file ? (
              <p>File selected: {file.name}</p>
            ) : (
              <p className="text-muted-foreground flex flex-col items-center">
                <UploadCloud className="h-8 w-8 mb-2" />
                Drag 'n' drop a CSV file here, or click to select one
              </p>
            )}
          </div>

          {file && !uploadMutation.isPending && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={handleCsvUpload} className="w-full">
                  Upload CSV
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Uploads the selected CSV file.</p>
                <p>Existing users (by email) will be updated, new users will be created.</p>
                <p>Any validation errors in the CSV will be reported.</p>
              </TooltipContent>
            </Tooltip>
          )}
        </CardContent>
      </Card>
    </div>
  );
}