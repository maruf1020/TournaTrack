
'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, Edit, CalendarDays, ArrowLeft, Clock, MapPin, ArrowRight } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { getEvent, getProgramsForEvent, deleteProgram, getPlayersOnce } from '@/lib/services';
import type { Event, Program, Player } from '@/lib/types';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import ProgramForm from './ProgramForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

// Helper function to truncate text
const truncateText = (text: string, wordLimit: number) => {
    if (!text) return '';
    const words = text.split(' ');
    if (words.length > wordLimit) {
        return words.slice(0, wordLimit).join(' ') + '...';
    }
    return text;
};


export default function ManageProgramsPage() {
    const params = useParams();
    const eventId = params.eventId as string;
    const [event, setEvent] = React.useState<Event | null>(null);
    const [programs, setPrograms] = React.useState<Program[]>([]);
    const [allPlayers, setAllPlayers] = React.useState<Player[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [editingProgram, setEditingProgram] = React.useState<Program | null>(null);
    const { toast } = useToast();

    React.useEffect(() => {
        if (!eventId) return;

        async function loadData() {
            try {
                const [eventData, playersData] = await Promise.all([
                    getEvent(eventId),
                    getPlayersOnce(),
                ]);
                setEvent(eventData);
                setAllPlayers(playersData);
            } catch (error) {
                console.error("Failed to load initial data", error);
            }
        }
        loadData();

        const unsubPrograms = getProgramsForEvent(eventId, (data) => {
            setPrograms(data.sort((a,b) => a.startTime.getTime() - b.startTime.getTime()));
            setIsLoading(false);
        });

        return () => {
            unsubPrograms();
        };
    }, [eventId]);

     const handleAddNew = () => {
        setEditingProgram(null);
        setIsFormOpen(true);
    };

    const handleEdit = (program: Program) => {
        setEditingProgram(program);
        setIsFormOpen(true);
    }
    
    const handleDelete = async (programId: string) => {
        try {
            await deleteProgram(eventId, programId);
            toast({ title: "Program Deleted" });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: 'destructive' });
        }
    };
    
    if (isLoading || !event) {
        return (
            <AppLayout>
                <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6">
                    <Skeleton className="h-9 w-64" />
                    <Skeleton className="h-4 w-96" />
                    <Skeleton className="h-10 w-48 mt-4" />
                    <Card>
                        <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
                        <CardContent><Skeleton className="h-40 w-full" /></CardContent>
                    </Card>
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout>
            <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6">
                 <div>
                    <Button asChild variant="ghost" className="mb-4">
                       <Link href="/admin/events"><ArrowLeft className="mr-2 h-4 w-4" /> Back to All Events</Link>
                    </Button>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border rounded-lg bg-card shadow-sm">
                        <h1 className="text-3xl font-bold tracking-tight font-headline flex-grow">{event.name}</h1>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground shrink-0">
                            <div className="flex items-center gap-2">
                                <CalendarDays className="h-5 w-5 text-primary" />
                                <span className="font-medium">{format(event.startTime, 'PP')}</span>
                            </div>
                            <ArrowRight className="h-4 w-4" />
                             <div className="flex items-center gap-2">
                                <CalendarDays className="h-5 w-5 text-primary" />
                                <span className="font-medium">{format(event.endTime, 'PP')}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                 <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                             <div>
                                <CardTitle>Programs</CardTitle>
                                <CardDescription>All scheduled programs for "{event.name}".</CardDescription>
                             </div>
                             <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                                <DialogTrigger asChild>
                                     <Button onClick={handleAddNew}>
                                        <PlusCircle className="h-4 w-4 sm:mr-2" />
                                        <span className="hidden sm:inline">Add Program</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
                                    <DialogHeader>
                                        <DialogTitle>{editingProgram ? 'Edit Program' : 'Create New Program'}</DialogTitle>
                                    </DialogHeader>
                                    <div className="flex-grow overflow-y-auto pr-6 -mr-6">
                                        <ProgramForm 
                                            eventId={eventId} 
                                            programToEdit={editingProgram} 
                                            allPlayers={allPlayers} 
                                            onFinished={() => setIsFormOpen(false)}
                                        />
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent>
                       <div className="space-y-4">
                        {programs.length > 0 ? programs.map(program => (
                           <Card key={program.id}>
                               <CardHeader className="flex flex-row items-center justify-between gap-4 p-4">
                                   <CardTitle className="text-lg flex-grow truncate">{program.name}</CardTitle>
                                   <div className="flex items-center gap-2 shrink-0">
                                       <Button variant="outline" size="sm" onClick={() => handleEdit(program)}>
                                            <Edit className="h-4 w-4 sm:mr-2" />
                                            <span className="hidden sm:inline">Edit</span>
                                       </Button>
                                       <AlertDialog>
                                           <AlertDialogTrigger asChild>
                                               <Button variant="destructive" size="sm">
                                                    <Trash2 className="h-4 w-4 sm:mr-2" />
                                                    <span className="hidden sm:inline">Delete</span>
                                                </Button>
                                           </AlertDialogTrigger>
                                           <AlertDialogContent>
                                               <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the program "{program.name}".</AlertDialogDescription></AlertDialogHeader>
                                               <AlertDialogFooter>
                                                   <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                   <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDelete(program.id)}>Delete</AlertDialogAction>
                                               </AlertDialogFooter>
                                           </AlertDialogContent>
                                       </AlertDialog>
                                   </div>
                               </CardHeader>
                               <CardContent className="p-4 pt-0 space-y-4">
                                   {program.description && (
                                       <p className="text-sm text-muted-foreground">{program.description}</p>
                                   )}
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-4 border-t">
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-start gap-3">
                                                <Clock className="h-4 w-4 mt-1 shrink-0 text-muted-foreground" />
                                                <div>
                                                    <span className="font-semibold">Start:</span> {format(program.startTime, 'p, MMM d')}
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                 <Clock className="h-4 w-4 mt-1 shrink-0 text-muted-foreground" />
                                                 <div>
                                                    <span className="font-semibold">End:</span> {format(program.endTime, 'p, MMM d')}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-start gap-3">
                                                <div className="h-full flex items-center justify-center pt-1">
                                                    <MapPin className="h-4 w-4 shrink-0 text-muted-foreground"/>
                                                </div>
                                                 <div>
                                                    <p><span className="font-semibold">{program.endLocation ? 'From:' : 'Location:'}</span> {truncateText(program.startLocation.label, 8)}</p>
                                                    {program.endLocation && (
                                                        <p><span className="font-semibold">To:</span> {truncateText(program.endLocation.label, 8)}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                   {program.roles.length > 0 && <Separator />}
                                   <div className="space-y-2">
                                       {program.roles.sort((a,b) => b.priority - a.priority).map(role => (
                                           <div key={role.id} className="text-sm p-2 bg-muted/30 rounded-md">
                                               <span className="font-semibold">{role.roleName}: </span>
                                               <span className="text-muted-foreground">{role.assignedEmployees.map(e => e.name).join(', ')}</span>
                                           </div>
                                       ))}
                                   </div>
                               </CardContent>
                           </Card>
                        )) : (
                            <p className="text-center text-muted-foreground py-8">No programs created for this event yet.</p>
                        )}
                    </div>
                    </CardContent>
                 </Card>
            </div>
        </AppLayout>
    );
}
