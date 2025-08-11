
'use client';

import * as React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, PlusCircle, Trash2, Edit, Users, Users2, Star } from 'lucide-react';
import type { Team, Event, Player, TeamMember } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getEventsOnce, getTeams, addTeam, updateTeam, deleteTeam, getPlayersOnce } from '@/lib/services';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSortableTable } from '@/hooks/use-sortable-table';
import { SortableTableHeader } from '@/components/ui/sortable-table-header';
import PlayerSelectionDialog from '@/app/admin/rooms/PlayerSelectionDialog'; // Reusing this dialog
import { ScrollArea } from '@/components/ui/scroll-area';

const SkeletonLoader = () => (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <Skeleton className="h-9 w-64" />
        <Card>
            <CardHeader><div className="flex justify-between items-center"><Skeleton className="h-8 w-1/3" /><Skeleton className="h-10 w-1/4" /></div></CardHeader>
            <CardContent><Skeleton className="h-64 w-full" /></CardContent>
        </Card>
    </div>
);

const TeamFormDialog = ({
    open,
    onOpenChange,
    onFinished,
    teamToEdit,
    events,
    allPlayers,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onFinished: () => void;
    teamToEdit?: Team | null;
    events: Event[];
    allPlayers: Player[];
}) => {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [eventId, setEventId] = React.useState('');
    const [name, setName] = React.useState('');
    const [leader, setLeader] = React.useState<TeamMember | null>(null);
    const [managers, setManagers] = React.useState<TeamMember[]>([]);
    const [members, setMembers] = React.useState<TeamMember[]>([]);
    
    const [pickerState, setPickerState] = React.useState<{ open: boolean; target: 'leader' | 'managers' | 'members' | null }>({ open: false, target: null });

    const isEditMode = !!teamToEdit;

    React.useEffect(() => {
        if (open && teamToEdit) {
            setEventId(teamToEdit.eventId);
            setName(teamToEdit.name);
            setLeader(teamToEdit.leader);
            setManagers(teamToEdit.managers);
            setMembers(teamToEdit.members);
        } else if (open) {
            setEventId('');
            setName('');
            setLeader(null);
            setManagers([]);
            setMembers([]);
        }
    }, [open, teamToEdit]);
    
    const handleSubmit = async () => {
        if (!eventId || !name || !leader) {
            toast({ title: "Missing Fields", description: "Event, Team Name, and Team Leader are required.", variant: 'destructive' });
            return;
        }
        setIsSubmitting(true);
        try {
            const teamData = { eventId, name, leader, managers, members };
            if (isEditMode && teamToEdit) {
                await updateTeam(teamToEdit.id, teamData);
                toast({ title: "Team Updated" });
            } else {
                await addTeam(teamData);
                toast({ title: "Team Created" });
            }
            onFinished();
            onOpenChange(false);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const openPicker = (target: 'leader' | 'managers' | 'members') => {
        setPickerState({ open: true, target });
    };

    const handlePlayerConfirm = (selectedPlayers: Player[]) => {
        const selectedMembers = selectedPlayers.map(({ id, name, email, imageUrl, branch, designation }) => ({ id, name, email, imageUrl, branch, designation }));
        switch (pickerState.target) {
            case 'leader':
                setLeader(selectedMembers[0] || null);
                break;
            case 'managers':
                setManagers(selectedMembers);
                break;
            case 'members':
                setMembers(selectedMembers);
                break;
        }
    };

    const getInitialSelection = () => {
        switch (pickerState.target) {
            case 'leader': return leader ? [leader] : [];
            case 'managers': return managers;
            case 'members': return members;
            default: return [];
        }
    };
    
    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{isEditMode ? 'Edit Team' : 'Create New Team'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="event-select">Event</Label>
                                <Select value={eventId} onValueChange={setEventId}>
                                    <SelectTrigger id="event-select"><SelectValue placeholder="Select an event" /></SelectTrigger>
                                    <SelectContent>
                                        {events.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="team-name">Team Name</Label>
                                <Input id="team-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., The Titans" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Team Leader</Label>
                             <div className="flex items-center gap-2 p-2 border rounded-md min-h-[40px] bg-muted/50">
                                {leader ? (
                                    <span className="text-sm text-primary font-semibold">{leader.name}</span>
                                ) : (
                                    <span className="text-sm text-muted-foreground">No leader selected.</span>
                                )}
                                <Button type="button" variant="outline" size="sm" className="ml-auto" onClick={() => openPicker('leader')}>Select</Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Managers ({managers.length})</Label>
                             <div className="flex items-center gap-2 p-2 border rounded-md min-h-[40px] bg-muted/50">
                                <span className="flex-1 text-sm text-muted-foreground">{managers.map(m => m.name).join(', ') || 'No managers assigned.'}</span>
                                <Button type="button" variant="outline" size="sm" className="ml-auto flex-shrink-0" onClick={() => openPicker('managers')}>Select</Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Members ({members.length})</Label>
                            <div className="flex items-center gap-2 p-2 border rounded-md min-h-[40px] bg-muted/50">
                               <span className="flex-1 text-sm text-muted-foreground">{members.map(m => m.name).join(', ') || 'No members assigned.'}</span>
                                <Button type="button" variant="outline" size="sm" className="ml-auto flex-shrink-0" onClick={() => openPicker('members')}>Select</Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditMode ? 'Save Changes' : 'Create Team'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <PlayerSelectionDialog
                open={pickerState.open}
                onOpenChange={(o) => setPickerState(prev => ({ ...prev, open: o }))}
                allPlayers={allPlayers}
                initialSelection={getInitialSelection()}
                onConfirm={handlePlayerConfirm}
                capacity={pickerState.target === 'leader' ? 1 : 0} // 0 means no limit
            />
        </>
    );
};

export default function ManageGroupsPage() {
    const { isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const [events, setEvents] = React.useState<Event[]>([]);
    const [teams, setTeams] = React.useState<Team[]>([]);
    const [allPlayers, setAllPlayers] = React.useState<Player[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [editingTeam, setEditingTeam] = React.useState<Team | null>(null);
    const { toast } = useToast();

    React.useEffect(() => {
        if (!authLoading && !isAdmin) {
            router.push('/');
        }
    }, [isAdmin, authLoading, router]);

    React.useEffect(() => {
        async function loadData() {
            setIsLoading(true);
            try {
                const [eventData, playerData] = await Promise.all([getEventsOnce(), getPlayersOnce()]);
                const sortedEvents = eventData.sort((a,b) => b.startTime.getTime() - a.startTime.getTime());
                setEvents(sortedEvents);
                setAllPlayers(playerData);
            } catch (error) {
                 toast({ title: "Error", description: "Could not load initial data.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        }
        loadData();

        const unsubTeams = getTeams(setTeams);
        return () => unsubTeams();
    }, [toast]);
    
    const handleTeamDelete = async (teamId: string) => {
        try {
            await deleteTeam(teamId);
            toast({ title: "Team Deleted" });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };
    
    const handleAddNewClick = () => {
        setEditingTeam(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (team: Team) => {
        setEditingTeam(team);
        setIsFormOpen(true);
    };

    if (authLoading || isLoading) {
        return (
            <AppLayout><SkeletonLoader /></AppLayout>
        );
    }
    
    if (!isAdmin) {
        return (
            <AppLayout>
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <Lock className="w-16 h-16 text-destructive mb-4" />
                    <h1 className="text-2xl font-bold">Access Denied</h1>
                    <p className="text-muted-foreground mt-2">You do not have permission to view this page.</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                     <h1 className="text-3xl font-bold tracking-tight font-headline">Group Management</h1>
                     <Button onClick={handleAddNewClick} disabled={events.length === 0}>
                         <PlusCircle className="mr-2 h-4 w-4"/> Create Team
                     </Button>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Users2 /> All Teams</CardTitle>
                        <CardDescription>Create, view, edit, and delete teams for all events.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       {events.length === 0 ? (
                           <p className="text-center text-muted-foreground py-8">You must create an event before you can add a team.</p>
                       ) : (
                        <div className="rounded-md border">
                           <Table>
                               <TableHeader>
                                   <TableRow>
                                       <TableHead>Team Name</TableHead>
                                       <TableHead>Event</TableHead>
                                       <TableHead>Leader</TableHead>
                                       <TableHead>Total Members</TableHead>
                                       <TableHead className="text-right">Actions</TableHead>
                                   </TableRow>
                               </TableHeader>
                               <TableBody>
                                   {teams.length > 0 ? teams.map(team => {
                                      const event = events.find(e => e.id === team.eventId);
                                      return (
                                          <TableRow key={team.id}>
                                              <TableCell className="font-medium">{team.name}</TableCell>
                                              <TableCell>{event?.name || 'N/A'}</TableCell>
                                              <TableCell>{team.leader.name}</TableCell>
                                              <TableCell>{1 + team.managers.length + team.members.length}</TableCell>
                                              <TableCell className="text-right">
                                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(team)}><Edit className="h-4 w-4" /></Button>
                                                   <AlertDialog>
                                                      <AlertDialogTrigger asChild>
                                                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                                      </AlertDialogTrigger>
                                                      <AlertDialogContent>
                                                          <AlertDialogHeader>
                                                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                              <AlertDialogDescription>This will permanently delete the team "{team.name}".</AlertDialogDescription>
                                                          </AlertDialogHeader>
                                                          <AlertDialogFooter>
                                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                              <AlertDialogAction onClick={() => handleTeamDelete(team.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                          </AlertDialogFooter>
                                                      </AlertDialogContent>
                                                  </AlertDialog>
                                              </TableCell>
                                          </TableRow>
                                      );
                                   }) : (
                                       <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No teams created yet.</TableCell></TableRow>
                                   )}
                               </TableBody>
                           </Table>
                        </div>
                       )}
                    </CardContent>
                </Card>
                 <TeamFormDialog
                    open={isFormOpen}
                    onOpenChange={setIsFormOpen}
                    onFinished={() => {}}
                    teamToEdit={editingTeam}
                    events={events}
                    allPlayers={allPlayers}
                />
            </div>
        </AppLayout>
    );
}
