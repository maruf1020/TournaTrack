
'use client';

import * as React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarClock } from 'lucide-react';

export default function UpcomingEventsPage() {
  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight font-headline">Upcoming Events</h1>
        </div>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CalendarClock className="h-6 w-6" />
                     Upcoming Events
                </CardTitle>
                <CardDescription>This is a test page for upcoming events. More features will be added soon.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="text-center py-16 text-muted-foreground">
                    <p>No upcoming events scheduled yet.</p>
                </div>
            </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
