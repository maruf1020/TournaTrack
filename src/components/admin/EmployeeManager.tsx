
'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  TableHead,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Trash2, UserPlus, FileJson, Loader2, Pencil, CheckCircle2, Info } from 'lucide-react';
import { getPlayers, addPlayer, removePlayer, importEmployees, updatePlayer } from '@/lib/services';
import type { Player, EmployeeUploadData } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSortableTable } from '@/hooks/use-sortable-table';
import { SortableTableHeader } from '@/components/ui/sortable-table-header';
import { Skeleton } from '../ui/skeleton';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { branches, departments } from '@/lib/placeholder-data';


const employeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  branch: z.string().min(1, 'Branch is required.'),
  department: z.string().min(1, 'Department is required.'),
  designation: z.string().min(1, 'Designation is required.'),
  employeeId: z.string().min(1, 'Employee ID is required.'),
  joiningDate: z.string().min(1, 'Joining date is required.'),
  imageUrl: z.string().url('Please enter a valid URL.').or(z.literal('')),
  isAdmin: z.boolean().default(false),
});

type EmployeeFormInputs = z.infer<typeof employeeSchema>;

function EmployeeFormDialog({ onEmployeeAdded, trigger, employeeToEdit, onEmployeeUpdated, open, onOpenChange }: { 
    onEmployeeAdded: () => void, 
    trigger?: React.ReactNode, 
    employeeToEdit?: Player | null,
    onEmployeeUpdated: () => void,
    open: boolean,
    onOpenChange: (open: boolean) => void,
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const isEditMode = !!employeeToEdit;

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<EmployeeFormInputs>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: '',
      email: '',
      branch: '',
      department: '',
      designation: '',
      employeeId: '',
      joiningDate: '',
      imageUrl: '',
      isAdmin: false
    }
  });
  
  React.useEffect(() => {
    if (employeeToEdit) {
        reset({
            ...employeeToEdit,
            joiningDate: employeeToEdit.joiningDate ? new Date(employeeToEdit.joiningDate).toISOString().split('T')[0] : '',
            imageUrl: employeeToEdit.imageUrl || '',
            isAdmin: employeeToEdit.isAdmin || false,
        });
    } else {
        reset({
            name: '', email: '', branch: '', department: '', designation: '', employeeId: '', joiningDate: '', imageUrl: '', isAdmin: false
        });
    }
  }, [employeeToEdit, reset]);


  const onSubmit = async (data: EmployeeFormInputs) => {
    if (!user) {
      toast({ title: 'Authentication Error', description: 'You must be logged in to modify employees.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const playerData: Partial<Player> = {
        ...data,
        imageUrl: data.imageUrl || `https://placehold.co/100x100.png`
      }
        if (isEditMode && employeeToEdit) {
            await updatePlayer(employeeToEdit.id, playerData);
            toast({ title: 'Employee Updated', description: `${data.name}'s information has been updated.` });
            onEmployeeUpdated();
        } else {
            await addPlayer(playerData as Omit<Player, 'id'>);
            toast({ title: 'Employee Added', description: `${data.name} has been added.` });
            onEmployeeAdded();
        }
      reset();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: 'Error', description: `Failed to save employee: ${error.message}`, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[625px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
            <DialogDescription>
                {isEditMode ? "Update the employee's details below." : "Fill out the details below to add a new employee."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} disabled={isEditMode} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID</Label>
              <Input id="employeeId" {...register('employeeId')} />
              {errors.employeeId && <p className="text-sm text-destructive">{errors.employeeId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
              <Input id="branch" {...register('branch')} />
              {errors.branch && <p className="text-sm text-destructive">{errors.branch.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input id="department" {...register('department')} />
              {errors.department && <p className="text-sm text-destructive">{errors.department.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Input id="designation" {...register('designation')} />
              {errors.designation && <p className="text-sm text-destructive">{errors.designation.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="joiningDate">Joining Date</Label>
              <Input id="joiningDate" type="date" {...register('joiningDate')} />
              {errors.joiningDate && <p className="text-sm text-destructive">{errors.joiningDate.message}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input id="imageUrl" placeholder="https://placehold.co/100x100.png" {...register('imageUrl')} />
                {errors.imageUrl && <p className="text-sm text-destructive">{errors.imageUrl.message}</p>}
            </div>
            <div className="flex items-center space-x-2 pt-6">
                <Controller
                    control={control}
                    name="isAdmin"
                    render={({ field }) => (
                      <Switch
                          id="isAdmin"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                      />
                    )}
                />
                <Label htmlFor="isAdmin">Is Admin?</Label>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <DialogClose asChild>
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Saving...</> : 'Save Employee'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const TableSkeleton = () => (
    <div className="rounded-md border">
        <Table>
            <TableHeader className="bg-muted/50">
                <TableRow>
                    <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                    <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                    <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                    <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                    <TableHead><Skeleton className="h-5 w-16" /></TableHead>
                    <TableHead className="text-right"><Skeleton className="h-5 w-16" /></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell className="text-right flex justify-end gap-2">
                            <Skeleton className="h-8 w-8" />
                            <Skeleton className="h-8 w-8" />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </div>
);

const JsonFormatPopover = () => (
    <Popover>
        <PopoverTrigger asChild>
             <Button variant="ghost" size="icon" className="h-7 w-7">
                <Info className="h-4 w-4" />
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
            <div className="grid gap-4">
                <div className="space-y-2">
                    <h4 className="font-medium leading-none">JSON Import Format</h4>
                    <p className="text-sm text-muted-foreground">
                       Your JSON file must be an array of objects with the following structure.
                       The `imageUrl` and `id` fields are optional.
                    </p>
                </div>
                <pre className="text-xs p-2 bg-muted rounded-md overflow-x-auto">
{`[
  {
    "employeeId": "EMP-001",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "joiningDate": "2023-01-15T00:00:00.000Z",
    "designation": "Software Engineer",
    "branch": "Dhanmondi",
    "department": "Development",
    "imageUrl": "https://example.com/image.png"
  }
]`}
                </pre>
            </div>
        </PopoverContent>
    </Popover>
);

export default function EmployeeManager() {
  const [employees, setEmployees] = React.useState<Player[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isImporting, setIsImporting] = React.useState(false);
  const [editingEmployee, setEditingEmployee] = React.useState<Player | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [filters, setFilters] = React.useState({
    search: '',
    branch: 'all',
    department: 'all',
    designation: 'all',
  });

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const allDesignations = React.useMemo(() => {
    const designations = new Set<string>();
    employees.forEach(e => e.designation && designations.add(e.designation));
    return Array.from(designations).sort();
  }, [employees]);

  const filteredEmployees = React.useMemo(() => {
    return employees.filter(employee => {
        const searchLower = filters.search.toLowerCase();
        const nameMatch = employee.name.toLowerCase().includes(searchLower);
        const emailMatch = employee.email.toLowerCase().includes(searchLower);
        const branchMatch = filters.branch === 'all' || employee.branch === filters.branch;
        const departmentMatch = filters.department === 'all' || employee.department === filters.department;
        const designationMatch = filters.designation === 'all' || employee.designation === filters.designation;

        return (nameMatch || emailMatch) && branchMatch && departmentMatch && designationMatch;
    });
  }, [employees, filters]);
  
  const { sortedData, requestSort, getSortDirection } = useSortableTable(filteredEmployees);

  React.useEffect(() => {
    setIsLoading(true);
    const unsubscribe = getPlayers((players) => {
        setEmployees(players);
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddNew = () => {
    setEditingEmployee(null);
    setIsFormOpen(true);
  };

  const handleEdit = (employee: Player) => {
    setEditingEmployee(employee);
    setIsFormOpen(true);
  };

  const onRemoveEmployee = async (id: string) => {
    if (!user) {
      toast({ title: 'Authentication Error', description: 'You must be logged in to remove an employee.', variant: 'destructive' });
      return;
    }
    try {
      await removePlayer(id);
      toast({ title: 'Employee Removed', description: 'Employee has been removed from Firestore.', variant: 'destructive' });
    } catch (error: any) {
      toast({ title: 'Error', description: `Failed to remove employee: ${error.message}`, variant: 'destructive' });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
        toast({ title: 'Authentication Error', description: 'You must be logged in to import employees.', variant: 'destructive' });
        return;
    }
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const content = await file.text();
      const newEmployees = JSON.parse(content) as EmployeeUploadData[];
      const result = await importEmployees(newEmployees);

      if (result.success) {
        toast({ title: "Import Successful", description: `${result.count} new employees imported.` });
      } else {
        throw new Error(result.error || "An unknown error occurred during import.");
      }
    } catch (error: any) {
      toast({ title: "Import Failed", description: error.message || "Please check the file format and content.", variant: "destructive" });
    } finally {
      setIsImporting(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <div className="space-y-4">
       <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <h3 className="text-lg font-medium">Employee Directory ({filteredEmployees.length})</h3>
                <div className="flex items-center gap-2">
                   <div className="flex items-center">
                     <Button className="w-full sm:w-auto" type="button" variant="outline" onClick={triggerFileUpload} disabled={isImporting}>
                        {isImporting ? <Loader2 className="mr-2 animate-spin h-4 w-4" /> : <FileJson className="mr-2 h-4 w-4" />}
                        {isImporting ? 'Importing...' : 'Import JSON'}
                     </Button>
                     <JsonFormatPopover />
                   </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="application/json" onChange={handleFileUpload} />
                    <Button className="w-full sm:w-auto" onClick={handleAddNew}>
                      <UserPlus className="mr-2 h-4 w-4" /> Add New Employee
                    </Button>
                </div>
            </div>
            <div className="p-4 border rounded-lg bg-card space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <Input 
                        placeholder="Search name or email..."
                        value={filters.search}
                        onChange={e => handleFilterChange('search', e.target.value)}
                    />
                     <Select value={filters.branch} onValueChange={value => handleFilterChange('branch', value)}>
                        <SelectTrigger><SelectValue placeholder="All Branches" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Branches</SelectItem>
                            {branches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={filters.department} onValueChange={value => handleFilterChange('department', value)}>
                        <SelectTrigger><SelectValue placeholder="All Departments"/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Departments</SelectItem>
                            {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Select value={filters.designation} onValueChange={value => handleFilterChange('designation', value)}>
                        <SelectTrigger><SelectValue placeholder="All Designations"/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Designations</SelectItem>
                            {allDesignations.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
      
       <EmployeeFormDialog 
          onEmployeeAdded={() => {}}
          onEmployeeUpdated={() => {}}
          employeeToEdit={editingEmployee}
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
       />

        {isLoading ? <TableSkeleton /> : (
            <div className="rounded-md border">
                <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-muted/50">
                    <TableRow>
                        <SortableTableHeader
                            label="Name"
                            sortKey="name"
                            requestSort={requestSort}
                            getSortDirection={getSortDirection}
                        />
                        <SortableTableHeader
                            label="Email"
                            sortKey="email"
                            requestSort={requestSort}
                            getSortDirection={getSortDirection}
                        />
                        <SortableTableHeader
                            label="Branch"
                            sortKey="branch"
                            requestSort={requestSort}
                            getSortDirection={getSortDirection}
                        />
                        <SortableTableHeader
                            label="Department"
                            sortKey="department"
                            requestSort={requestSort}
                            getSortDirection={getSortDirection}
                        />
                        <SortableTableHeader
                            label="Admin"
                            sortKey="isAdmin"
                            requestSort={requestSort}
                            getSortDirection={getSortDirection}
                        />
                        <SortableTableHeader
                            label="Actions"
                            className="text-right"
                            isSortable={false}
                        />
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {sortedData.length > 0 ? sortedData.map((employee) => (
                        <TableRow key={employee.id} className="odd:bg-muted/10">
                        <TableCell className="font-medium">{employee.name}</TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>{employee.branch}</TableCell>
                        <TableCell>{employee.department}</TableCell>
                        <TableCell>
                            {employee.isAdmin && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(employee)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the employee
                                    <span className="font-bold"> {employee.name}</span> from the database.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onRemoveEmployee(employee.id)}>
                                    Continue
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                            </AlertDialog>
                        </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                            No employees found. Add one or import a JSON file to get started.
                        </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
                </div>
            </div>
        )}
    </div>
  );
}
