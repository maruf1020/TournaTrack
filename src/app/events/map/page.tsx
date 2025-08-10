
'use client';

import * as React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Map } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getEvents, getProgramsForEvent } from '@/lib/services';
import type { Event, Program } from '@/lib/types';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EventTimeline from '@/components/events/EventTimeline';


const PageSkeleton = () => (
     <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6">
        <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-10 w-72" />
        </div>
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                   <Skeleton className="h-24 w-full" />
                   <Skeleton className="h-24 w-full" />
                   <Skeleton className="h-24 w-full" />
                </div>
            </CardContent>
        </Card>
    </div>
);


export default function EventMapPage() {
    const [events, setEvents] = React.useState<Event[]>([]);
    const [selectedEventId, setSelectedEventId] = React.useState<string | null>(null);
    const [programs, setPrograms] = React.useState<Program[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const { toast } = useToast();

    // Fetch all events on component mount
    React.useEffect(() => {
        setIsLoading(true);
        const unsubEvents = getEvents((data) => {
            const sortedEvents = data.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
            setEvents(sortedEvents);

            if (sortedEvents.length > 0 && !selectedEventId) {
                const now = new Date();
                const upcomingEvents = sortedEvents.filter(e => e.startTime >= now);

                if (upcomingEvents.length > 0) {
                    // The first event in the sorted upcoming list is the next one
                    setSelectedEventId(upcomingEvents[0].id);
                } else {
                    // If no upcoming events, select the most recent past event
                    const pastEvents = sortedEvents.filter(e => e.startTime < now).sort((a,b) => b.startTime.getTime() - a.startTime.getTime());
                    if (pastEvents.length > 0) {
                        setSelectedEventId(pastEvents[0].id);
                    }
                }
            }
            
            if (data.length === 0) {
                 setIsLoading(false);
            }
        });
        return () => unsubEvents();
    }, [selectedEventId]); // Re-run if selectedEventId changes, to avoid re-selecting

    // Fetch programs when an event is selected
    React.useEffect(() => {
        if (!selectedEventId) {
            if (events.length === 0) setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const unsubPrograms = getProgramsForEvent(selectedEventId, (data) => {
            setPrograms(data);
            setIsLoading(false);
        });

        return () => unsubPrograms();
    }, [selectedEventId, events]);

    const selectedEvent = events.find(e => e.id === selectedEventId);

    return (
        <AppLayout>
            {isLoading && !selectedEvent ? (
                <PageSkeleton />
            ) : (
                <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <h1 className="text-3xl font-bold tracking-tight font-headline">Event Timeline</h1>
                        <div className="w-full sm:w-72">
                             <Select value={selectedEventId || ''} onValueChange={setSelectedEventId} disabled={events.length === 0}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an event..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {events.map(event => (
                                        <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    <Card>
                        <CardHeader>
                            {selectedEvent ? (
                                <>
                                    <CardTitle className="flex items-center gap-2">
                                        <Map className="h-6 w-6" />
                                        {selectedEvent.name}
                                    </CardTitle>
                                    <CardDescription>
                                        A chronological view of all scheduled programs. From {format(selectedEvent.startTime, 'PPP')} to {format(selectedEvent.endTime, 'PPP')}.
                                    </CardDescription>
                                </>
                            ) : (
                                <>
                                 <CardTitle>No Event Selected</CardTitle>
                                 <CardDescription>Please select an event from the dropdown to see its timeline, or create one in the admin panel.</CardDescription>
                                </>
                            )}
                        </CardHeader>
                        <CardContent>
                           {isLoading ? (
                               <div className="h-64 flex items-center justify-center">
                                   <Loader2 className="h-8 w-8 animate-spin" />
                               </div>
                           ) : (
                               <EventTimeline programs={programs} />
                           )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </AppLayout>
    );
}
