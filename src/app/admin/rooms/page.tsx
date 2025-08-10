
'use client';

import * as React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, BedDouble, PlusCircle, Trash2, Edit, Users } from 'lucide-react';
import type { Room, Event, Player, AssignedEmployee } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getEventsOnce, getRoomsForEvent, addRoom, updateRoom, deleteRoom, getPlayersOnce } from '@/lib/services';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
} from '@/components/ui/alert-dialog';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSortableTable } from '@/hooks/use-sortable-table';
import { SortableTableHeader } from '@/components/ui/sortable-table-header';
import PlayerSelectionDialog from './PlayerSelectionDialog';
import { branches } from '@/lib/placeholder-data';

const SkeletonLoader = () => (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <Skeleton className="h-9 w-64" />
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-10 w-1/4" />
                </div>
            </CardHeader>
            <CardContent>
                <Skeleton className="h-10 w-full mb-4" />
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                                <TableHead><Skeleton className="h-5 w-16" /></TableHead>
                                <TableHead><Skeleton className="h-5 w-full" /></TableHead>
                                <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    </div>
);


const RoomFormDialog = ({
    open,
    onOpenChange,
    onFinished,
    roomToEdit,
    eventId,
    allPlayers,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onFinished: () => void;
    roomToEdit?: Room | null;
    eventId: string;
    allPlayers: Player[];
}) => {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [name, setName] = React.useState('');
    const [capacity, setCapacity] = React.useState(2);
    const [assignedEmployees, setAssignedEmployees] = React.useState<AssignedEmployee[]>([]);
    const [isPlayerPickerOpen, setIsPlayerPickerOpen] = React.useState(false);

    const isEditMode = !!roomToEdit;

    React.useEffect(() => {
        if(open && roomToEdit) {
            setName(roomToEdit.name);
            setCapacity(roomToEdit.capacity);
            setAssignedEmployees(roomToEdit.assignedEmployees);
        } else if (open) {
            setName('');
            setCapacity(2); // Default capacity
            setAssignedEmployees([]);
        }
    }, [open, roomToEdit]);
    
    const handleSubmit = async () => {
        if (!name || capacity < 1) {
            toast({title: "Missing Fields", description: "Please provide a room name and a valid capacity.", variant: 'destructive'});
            return;
        }
        setIsSubmitting(true);
        try {
            if (isEditMode && roomToEdit) {
                await updateRoom(roomToEdit.id, { name, capacity, assignedEmployees });
                toast({title: "Room Updated"});
            } else {
                await addRoom({ eventId, name, capacity, assignedEmployees });
                toast({title: "Room Added"});
            }
            onFinished();
            onOpenChange(false);
        } catch (error: any) {
            toast({title: "Error", description: error.message, variant: 'destructive'});
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleEmployeeConfirm = (selectedPlayers: Player[]) => {
        const assigned = selectedPlayers.map(({ id, name, email, imageUrl, branch, designation }) => ({ id, name, email, imageUrl, branch, designation }));
        setAssignedEmployees(assigned);
    }

    return (
        <>
         <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Edit Room' : 'Add New Room'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="room-name">Room Name/Number</Label>
                        <Input id="room-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Room 101, Villa A" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="room-capacity">Capacity</Label>
                        <Input id="room-capacity" type="number" min="1" value={capacity} onChange={e => setCapacity(Number(e.target.value) || 1)} />
                    </div>
                     <div className="space-y-2">
                        <Label>Assigned Employees ({assignedEmployees.length} / {capacity})</Label>
                        <div className="p-2 border rounded-md min-h-[60px] bg-muted/50 text-sm text-muted-foreground">
                          {assignedEmployees.length > 0 ? assignedEmployees.map(e => e.name).join(', ') : 'No one assigned.'}
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => setIsPlayerPickerOpen(true)}>
                           <Users className="mr-2 h-4 w-4" /> Assign Employees
                        </Button>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditMode ? 'Save Changes' : 'Add Room'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        <PlayerSelectionDialog 
            open={isPlayerPickerOpen}
            onOpenChange={setIsPlayerPickerOpen}
            allPlayers={allPlayers}
            initialSelection={assignedEmployees}
            onConfirm={handleEmployeeConfirm}
            capacity={capacity}
        />
        </>
    )
};


export default function ManageRoomsPage() {
    const { isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const [events, setEvents] = React.useState<Event[]>([]);
    const [rooms, setRooms] = React.useState<Room[]>([]);
    const [allPlayers, setAllPlayers] = React.useState<Player[]>([]);
    const [selectedEventId, setSelectedEventId] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [editingRoom, setEditingRoom] = React.useState<Room | null>(null);
    const { toast } = useToast();
    const [filters, setFilters] = React.useState({
        search: '',
        branch: 'all',
        designation: 'all',
    });

    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        setFilters(prev => ({...prev, [key]: value}));
    };

    React.useEffect(() => {
        if (!authLoading && !isAdmin) {
            router.push('/');
        }
    }, [isAdmin, authLoading, router]);

    // Fetch initial data (events and all players)
    React.useEffect(() => {
        async function loadData() {
            setIsLoading(true);
            try {
                const [eventData, playerData] = await Promise.all([getEventsOnce(), getPlayersOnce()]);
                const sortedEvents = eventData.sort((a,b) => b.startTime.getTime() - a.startTime.getTime());
                setEvents(sortedEvents);
                setAllPlayers(playerData);
                if (sortedEvents.length > 0) {
                    setSelectedEventId(sortedEvents[0].id);
                } else {
                    setIsLoading(false);
                }
            } catch (error) {
                 toast({title: "Error", description: "Could not load initial data.", variant: "destructive"});
                 setIsLoading(false);
            }
        }
        loadData();
    }, [toast]);

    // Fetch rooms when event selection changes
    React.useEffect(() => {
        if (!selectedEventId) {
            setRooms([]);
            setIsLoading(false);
            return;
        };

        const fetchRooms = async () => {
            setIsLoading(true);
            try {
                const roomData = await getRoomsForEvent(selectedEventId);
                setRooms(roomData);
            } catch (error) {
                toast({ title: "Error fetching rooms", description: "Could not load rooms for the selected event.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        }

        fetchRooms();
    }, [selectedEventId, toast]);
    
    const handleRoomDelete = async (roomId: string) => {
        try {
            await deleteRoom(roomId);
            setRooms(prev => prev.filter(r => r.id !== roomId));
            toast({title: "Room Deleted"});
        } catch (error: any) {
            toast({title: "Error", description: error.message, variant: "destructive"});
        }
    };
    
    const allDesignations = React.useMemo(() => {
        const designations = new Set<string>();
        allPlayers.forEach(p => p.designation && designations.add(p.designation));
        return Array.from(designations).sort();
    }, [allPlayers]);


    const filteredRooms = React.useMemo(() => {
        const lowercasedFilter = filters.search.toLowerCase();
        return rooms.filter(room => {
          const nameMatch = room.name.toLowerCase().includes(lowercasedFilter);
          const personMatch = room.assignedEmployees.some(p => p.name.toLowerCase().includes(lowercasedFilter));
          
          const branchMatch = filters.branch === 'all' || room.assignedEmployees.some(p => p.branch === filters.branch);
          const designationMatch = filters.designation === 'all' || room.assignedEmployees.some(p => p.designation === filters.designation);

          return (nameMatch || personMatch) && branchMatch && designationMatch;
        });
    }, [rooms, filters]);
    
    const { sortedData, requestSort, getSortDirection } = useSortableTable(filteredRooms);


    const handleAddNewClick = () => {
        setEditingRoom(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (room: Room) => {
        setEditingRoom(room);
        setIsFormOpen(true);
    };

    if (authLoading || (isLoading && events.length === 0)) {
        return (
            <AppLayout>
                <SkeletonLoader />
            </AppLayout>
        );
    }
    
    if (!isAdmin) {
        return (
            <AppLayout>
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <Lock className="w-16 h-16 text-destructive mb-4" />
                    <h1 className="text-2xl font-bold">Access Denied</h1>
                    <p className="text-muted-foreground mt-2">
                        You do not have permission to view this page.
                    </p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                     <h1 className="text-3xl font-bold tracking-tight font-headline">Room Management</h1>
                     <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Select value={selectedEventId || ''} onValueChange={id => setSelectedEventId(id)} disabled={events.length === 0}>
                           <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="Select an Event..." /></SelectTrigger>
                           <SelectContent>
                            {events.map(event => <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>)}
                           </SelectContent>
                        </Select>
                        <Button onClick={handleAddNewClick} disabled={!selectedEventId || events.length === 0}>
                            <PlusCircle className="mr-2 h-4 w-4"/> Add Room
                        </Button>
                     </div>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BedDouble className="h-6 w-6" />
                            Manage Rooms for {events.find(e => e.id === selectedEventId)?.name || '...'}
                        </CardTitle>
                        <CardDescription>Add, edit, delete, and assign employees to rooms for the selected event.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       {events.length === 0 ? (
                            <div className="text-center py-16 text-muted-foreground space-y-4">
                                <p className="font-medium">No events found.</p>
                                <p>You must create an event before you can add rooms to it.</p>
                                <Button asChild>
                                    <Link href="/admin/events">
                                        <PlusCircle className="mr-2 h-4 w-4" /> Create Event
                                    </Link>
                                </Button>
                            </div>
                       ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Input 
                                    placeholder="Search by room or person..."
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    className="md:col-span-1"
                                />
                                <Select value={filters.branch} onValueChange={value => handleFilterChange('branch', value)}>
                                    <SelectTrigger><SelectValue placeholder="All Branches" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Branches</SelectItem>
                                        {branches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
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
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <SortableTableHeader label="Room Name" sortKey="name" requestSort={requestSort} getSortDirection={getSortDirection} />
                                            <SortableTableHeader label="Occupancy" sortKey="capacity" requestSort={requestSort} getSortDirection={getSortDirection} />
                                            <SortableTableHeader label="Assigned Employees" isSortable={false} />
                                            <SortableTableHeader label="Actions" isSortable={false} className="text-right"/>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin" /></TableCell></TableRow>
                                        ) : sortedData.length > 0 ? sortedData.map(room => (
                                            <TableRow key={room.id}>
                                                <TableCell className="font-medium">{room.name}</TableCell>
                                                <TableCell>{room.assignedEmployees.length} / {room.capacity}</TableCell>
                                                <TableCell>
                                                    {room.assignedEmployees.map(p => p.name).join(', ') || <span className="text-muted-foreground">Empty</span>}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(room)}><Edit className="h-4 w-4" /></Button>
                                                     <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                <AlertDialogDescription>This will permanently delete the room "{room.name}".</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleRoomDelete(room.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                                    No rooms found for this event with the current filters.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                       )}
                    </CardContent>
                </Card>
                 <RoomFormDialog 
                    open={isFormOpen}
                    onOpenChange={setIsFormOpen}
                    onFinished={async () => {
                        if (selectedEventId) {
                           const roomData = await getRoomsForEvent(selectedEventId);
                           setRooms(roomData);
                        }
                    }}
                    roomToEdit={editingRoom}
                    eventId={selectedEventId!}
                    allPlayers={allPlayers}
                />
            </div>
        </AppLayout>
    );
}
