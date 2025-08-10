
'use client';

import * as React from 'react';
import { v4 as uuidv4 } from 'uuid';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { addProgram, updateProgram } from '@/lib/services';
import type { Player, Program, ProgramRole, Location } from '@/lib/types';
import { format } from 'date-fns';
import { Loader2, PlusCircle, Trash2, MapPin, UserSearch } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { branches } from '@/lib/placeholder-data';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';


// Dynamically import the LocationPicker to avoid SSR issues with map libraries.
const LocationPicker = dynamic(() => import('@/components/admin/LocationPicker'), {
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
});

// --- Player Picker Dialog ---
const PlayerSelectionDialog = ({
    open,
    onOpenChange,
    allPlayers,
    initialSelection,
    onConfirm
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    allPlayers: Player[];
    initialSelection: Pick<Player, 'id'>[];
    onConfirm: (selected: Player[]) => void;
}) => {
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = React.useState('');
    const [branchFilter, setBranchFilter] = React.useState('all');

    React.useEffect(() => {
        if (open) {
            setSelectedIds(new Set(initialSelection.map(p => p.id)));
        }
    }, [initialSelection, open]);
    
    const filteredPlayers = allPlayers.filter(p =>
        (p.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (branchFilter === 'all' || p.branch === branchFilter)
    );

    const handleToggle = (playerId: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(playerId)) {
                newSet.delete(playerId);
            } else {
                newSet.add(playerId);
            }
            return newSet;
        });
    }

    const handleSelectAll = () => {
        const visibleIds = new Set(filteredPlayers.map(p => p.id));
        setSelectedIds(visibleIds);
    };

    const handleDeselectAll = () => {
        setSelectedIds(new Set());
    };

    const handleConfirmSelection = () => {
        const selectedPlayers = allPlayers.filter(p => selectedIds.has(p.id));
        onConfirm(selectedPlayers);
        onOpenChange(false);
    }
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Select Employees</DialogTitle>
                    <DialogDescription>Search, filter, and select employees to assign to this role.</DialogDescription>
                </DialogHeader>
                 <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Search employees..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        <Select value={branchFilter} onValueChange={setBranchFilter}>
                            <SelectTrigger><SelectValue placeholder="Filter by branch..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Branches</SelectItem>
                                {branches.map(branch => (
                                    <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">{selectedIds.size} selected</p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleSelectAll}>Select Visible</Button>
                            <Button variant="outline" size="sm" onClick={handleDeselectAll}>Deselect All</Button>
                        </div>
                    </div>
                    <ScrollArea className="h-72 border rounded-md">
                        <div className="p-2 space-y-1">
                        {filteredPlayers.map(player => (
                            <Label key={player.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 font-normal cursor-pointer">
                                <Checkbox checked={selectedIds.has(player.id)} onCheckedChange={() => handleToggle(player.id)} />
                                {player.name} <span className="text-xs text-muted-foreground">({player.branch})</span>
                            </Label>
                        ))}
                        </div>
                    </ScrollArea>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleConfirmSelection}>Confirm</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// --- Program Role Form ---
const ProgramRoleForm = ({ role, onUpdate, onDelete, allPlayers }: { role: ProgramRole; onUpdate: (updatedRole: ProgramRole) => void; onDelete: () => void; allPlayers: Player[] }) => {
    const [isPlayerPickerOpen, setIsPlayerPickerOpen] = React.useState(false);
    
    const handleRoleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate({ ...role, roleName: e.target.value });
    }

    const handlePriorityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const priorityValue = e.target.value;
        onUpdate({ ...role, priority: priorityValue === '' ? 0 : parseInt(priorityValue, 10) });
    }

    const handleEmployeeSelection = (selectedEmployees: Player[]) => {
        const assignedEmployees = selectedEmployees.map(({ id, name, email, imageUrl }) => ({ id, name, email, imageUrl }));
        onUpdate({ ...role, assignedEmployees });
    }

    return (
        <>
            <div className="p-3 border rounded-lg bg-muted/50 space-y-3 relative">
                <div className="absolute top-1 right-1">
                     <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onDelete}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label>Role Name</Label>
                        <Input value={role.roleName} onChange={handleRoleNameChange} placeholder="e.g., Host" />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Priority</Label>
                        <Input type="number" value={role.priority} onChange={handlePriorityChange} />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                         <Label>Assigned Employees ({role.assignedEmployees.length})</Label>
                         <Button type="button" variant="outline" size="sm" onClick={() => setIsPlayerPickerOpen(true)}>
                            <UserSearch className="h-4 w-4 mr-2" />
                            Select
                         </Button>
                    </div>
                     {role.assignedEmployees.length > 0 ? (
                        <div className="p-2 border rounded-md bg-background text-sm text-muted-foreground min-h-[40px]">
                            {role.assignedEmployees.map(e => e.name).join(', ')}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground p-2 min-h-[40px]">No employees assigned.</p>
                    )}
                </div>
            </div>
             <PlayerSelectionDialog 
                open={isPlayerPickerOpen} 
                onOpenChange={setIsPlayerPickerOpen}
                allPlayers={allPlayers}
                initialSelection={role.assignedEmployees}
                onConfirm={handleEmployeeSelection}
            />
        </>
    )
}

export default function ProgramForm({ eventId, programToEdit, allPlayers, onFinished }: { 
    eventId: string; 
    programToEdit?: Program | null; 
    allPlayers: Player[];
    onFinished: () => void;
}) {
    const [name, setName] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [startTime, setStartTime] = React.useState('');
    const [endTime, setEndTime] = React.useState('');
    const [startLocation, setStartLocation] = React.useState<Location | null>(null);
    const [endLocation, setEndLocation] = React.useState<Location | null>(null);
    const [roles, setRoles] = React.useState<ProgramRole[]>([]);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isLocationPickerOpen, setIsLocationPickerOpen] = React.useState(false);
    const [locationPickerTarget, setLocationPickerTarget] = React.useState<'start' | 'end' | null>(null);


    const { toast } = useToast();

    const isEditMode = !!programToEdit;

    React.useEffect(() => {
        if (isEditMode && programToEdit) {
            setName(programToEdit.name);
            setDescription(programToEdit.description || '');
            setStartTime(format(programToEdit.startTime, "yyyy-MM-dd'T'HH:mm"));
            setEndTime(format(programToEdit.endTime, "yyyy-MM-dd'T'HH:mm"));
            setStartLocation(programToEdit.startLocation);
            setEndLocation(programToEdit.endLocation || null);
            setRoles(programToEdit.roles.sort((a,b) => a.priority - b.priority));
        } else {
            setName('');
            setDescription('');
            setStartTime('');
            setEndTime('');
            setStartLocation(null);
            setEndLocation(null);
            setRoles([]);
        }
    }, [programToEdit, isEditMode]);

    const handleAddRole = () => {
        const newRole: ProgramRole = { id: uuidv4(), roleName: '', priority: 0, assignedEmployees: [] };
        setRoles([newRole, ...roles]);
    }

    const handleUpdateRole = (updatedRole: ProgramRole) => {
        setRoles(roles.map(r => r.id === updatedRole.id ? updatedRole : r));
    }

    const handleDeleteRole = (roleId: string) => {
        setRoles(roles.filter(r => r.id !== roleId));
    }

    const openLocationPicker = (target: 'start' | 'end') => {
        setLocationPickerTarget(target);
        setIsLocationPickerOpen(true);
    };

    const handleLocationSelect = (location: Location) => {
        if (locationPickerTarget === 'start') {
            setStartLocation(location);
        } else if (locationPickerTarget === 'end') {
            setEndLocation(location);
        }
        setIsLocationPickerOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !startTime || !endTime || !startLocation) {
            toast({ title: 'Missing Fields', description: 'Please fill out name, start/end times, and start location.', variant: 'destructive' });
            return;
        }
        setIsSubmitting(true);
        try {
            const programData: Omit<Program, 'id'> = { 
                eventId, 
                name, 
                description,
                roles, 
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                startLocation,
                endLocation: endLocation || null,
            };
            if (isEditMode && programToEdit) {
                await updateProgram(eventId, programToEdit.id, programData);
                toast({ title: 'Program Updated' });
            } else {
                await addProgram(eventId, programData);
                toast({ title: 'Program Created' });
            }
            onFinished();
        } catch (error: any) {
             toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="programName">Program Name</Label>
                    <Input id="programName" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Gala Night" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="programDescription">Description (Optional)</Label>
                    <Textarea id="programDescription" value={description} onChange={e => setDescription(e.target.value)} placeholder="Provide a brief description of the program..." />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="startTime">Start Time</Label>
                        <Input id="startTime" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="endTime">End Time</Label>
                        <Input id="endTime" type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="startLocation">Start Location</Label>
                        <div className="flex items-center gap-2">
                            <Input id="startLocation" value={startLocation?.label || ''} readOnly placeholder="Click to select" />
                            <Button type="button" variant="outline" onClick={() => openLocationPicker('start')}><MapPin className="h-4 w-4" /></Button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="endLocation">End Location (Optional)</Label>
                        <div className="flex items-center gap-2">
                            <Input id="endLocation" value={endLocation?.label || ''} readOnly placeholder="Click to select" />
                            <Button type="button" variant="outline" onClick={() => openLocationPicker('end')}><MapPin className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </div>
                
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label>Roles & Assignments</Label>
                        <Button type="button" variant="outline" size="sm" onClick={handleAddRole}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Role
                        </Button>
                    </div>
                    <ScrollArea className="h-[28rem] p-2 border rounded-md">
                        <div className="space-y-3">
                        {roles.length > 0 ? roles.sort((a,b) => a.priority - b.priority).map(role => (
                            <ProgramRoleForm key={role.id} role={role} onUpdate={handleUpdateRole} onDelete={() => handleDeleteRole(role.id)} allPlayers={allPlayers} />
                        )) : (
                            <p className="text-center text-sm text-muted-foreground py-4">No roles added yet.</p>
                        )}
                        </div>
                    </ScrollArea>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onFinished}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditMode ? 'Save Program' : 'Create Program'}
                    </Button>
                </div>
            </form>
           
            <LocationPicker
                open={isLocationPickerOpen}
                onOpenChange={setIsLocationPickerOpen}
                onLocationSelect={handleLocationSelect}
                initialLocation={locationPickerTarget === 'start' ? startLocation : endLocation}
            />
           
        </>
    )
}
