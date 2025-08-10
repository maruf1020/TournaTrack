
'use client';

import * as React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, Trash2, Edit, CalendarDays, MoreVertical, Briefcase, Calendar as CalendarIcon } from 'lucide-react';
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
import { getEvents, addEvent, updateEvent, deleteEvent } from '@/lib/services';
import type { Event } from '@/lib/types';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

// --- Event Form ---
const EventForm = ({ eventToEdit, onFinished }: { eventToEdit?: Event | null; onFinished: () => void }) => {
  const [name, setName] = React.useState('');
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();

  const isEditMode = !!eventToEdit;

  React.useEffect(() => {
    if (isEditMode) {
      setName(eventToEdit.name);
      setDateRange({ from: eventToEdit.startTime, to: eventToEdit.endTime });
    } else {
      setName('');
      setDateRange(undefined);
    }
  }, [eventToEdit, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dateRange?.from || !dateRange?.to) {
      toast({ title: 'Missing Fields', description: 'Please fill out the event name and select a date range.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const eventData = {
        name,
        startTime: dateRange.from,
        endTime: dateRange.to,
      };
      if (isEditMode) {
        await updateEvent(eventToEdit.id, eventData);
        toast({ title: 'Event Updated', description: 'The event details have been saved.' });
      } else {
        await addEvent(eventData);
        toast({ title: 'Event Created', description: 'The new event has been created.' });
      }
      onFinished();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="eventName">Event Name</Label>
        <Input id="eventName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Annual Tour 2025" />
      </div>
       <div className="space-y-2">
          <Label htmlFor="eventDateRange">Event Date Range</Label>
           <Popover>
            <PopoverTrigger asChild>
              <Button
                id="eventDateRange"
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      <DialogFooter>
        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditMode ? 'Save Changes' : 'Create Event'}
        </Button>
      </DialogFooter>
    </form>
  );
};


export default function EventManagementPage() {
    const [events, setEvents] = React.useState<Event[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [editingEvent, setEditingEvent] = React.useState<Event | null>(null);
    const { toast } = useToast();

    React.useEffect(() => {
        const unsubEvents = getEvents((data) => {
            setEvents(data.sort((a, b) => b.startTime.getTime() - a.startTime.getTime()));
            setIsLoading(false);
        });
        return () => {
            unsubEvents();
        };
    }, []);
    
    const handleAddNew = () => {
        setEditingEvent(null);
        setIsFormOpen(true);
    };

    const handleEdit = (event: Event) => {
        setEditingEvent(event);
        setIsFormOpen(true);
    }

    const handleDelete = async (eventId: string) => {
        try {
            await deleteEvent(eventId);
            toast({ title: "Event Deleted", description: "The event and all its programs have been removed." });
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    }

    return (
        <AppLayout>
            <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Event Management</h1>
                    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={handleAddNew}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Create Event
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
                            </DialogHeader>
                            <EventForm eventToEdit={editingEvent} onFinished={() => setIsFormOpen(false)} />
                        </DialogContent>
                    </Dialog>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>All Events</CardTitle>
                        <CardDescription>View, edit, or delete events. Click "Manage Programs" to add specific activities to an event.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                            </div>
                        ) : events.length > 0 ? (
                            <div className="space-y-4">
                                {events.map(event => (
                                    <Card key={event.id}>
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div>
                                                <h3 className="font-semibold text-lg">{event.name}</h3>
                                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                    <CalendarDays className="h-4 w-4" />
                                                    {format(event.startTime, 'PPP')} - {format(event.endTime, 'PPP')}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button asChild variant="outline">
                                                    <Link href={`/admin/events/${event.id}`}>
                                                        <Briefcase className="mr-2 h-4 w-4" /> Manage Programs
                                                    </Link>
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEdit(event)}><Edit className="mr-2 h-4 w-4"/> Edit Event</DropdownMenuItem>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/> Delete Event</DropdownMenuItem></AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                    <AlertDialogDescription>This will permanently delete the event "{event.name}" and all its programs. This action cannot be undone.</AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDelete(event.id)}>Delete</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 text-muted-foreground">
                                <p>No events found. Get started by creating a new event.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
