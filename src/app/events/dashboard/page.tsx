
'use client';

import * as React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Hourglass, ListTodo, PlayCircle, Users as UsersIcon, BarChart, ExternalLink, MapPin } from 'lucide-react';
import { getEventsOnce, getAllPrograms } from '@/lib/services';
import type { Event, Program } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { isToday, isFuture, isPast, format, differenceInMinutes } from 'date-fns';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

const StatCard = ({ title, value, icon: Icon, description }: { title: string, value: string | number, icon: React.ElementType, description: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

const EventProgramsChart = ({ events, programs }: { events: Event[], programs: Program[] }) => {
    const data = React.useMemo(() => {
        return events.map(event => ({
            name: event.name,
            programs: programs.filter(p => p.eventId === event.id).length
        })).filter(d => d.programs > 0);
    }, [events, programs]);

    return (
        <ResponsiveContainer width="100%" height={300}>
            <RechartsBarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-15} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} />
                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{backgroundColor: 'hsl(var(--background))'}}/>
                <Bar dataKey="programs" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </RechartsBarChart>
        </ResponsiveContainer>
    );
};

const RoleDistributionChart = ({ programs }: { programs: Program[] }) => {
    const data = React.useMemo(() => {
        const roleCounts: { [key: string]: number } = {};
        programs.forEach(program => {
            program.roles.forEach(role => {
                roleCounts[role.roleName] = (roleCounts[role.roleName] || 0) + 1;
            });
        });
        return Object.entries(roleCounts).map(([name, value]) => ({ name, value }));
    }, [programs]);

    const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

    if (data.length === 0) {
      return <div className="h-[300px] flex items-center justify-center text-muted-foreground">No role data available.</div>;
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                     {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip contentStyle={{backgroundColor: 'hsl(var(--background))'}}/>
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
};


const PageSkeleton = () => (
    <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-[400px]" />
            <Skeleton className="h-[400px]" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-[350px]" />
            <Skeleton className="h-[350px]" />
        </div>
    </div>
);


export default function EventsDashboardPage() {
  const [events, setEvents] = React.useState<Event[]>([]);
  const [programs, setPrograms] = React.useState<Program[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadData() {
        setIsLoading(true);
        try {
            const [eventData, programData] = await Promise.all([
                getEventsOnce(),
                getAllPrograms(),
            ]);
            setEvents(eventData.sort((a,b) => a.startTime.getTime() - b.startTime.getTime()));
            setPrograms(programData.sort((a,b) => a.startTime.getTime() - b.startTime.getTime()));
        } catch (error) {
            console.error("Failed to load event dashboard data", error);
        } finally {
            setIsLoading(false);
        }
    }
    loadData();
  }, []);

  const stats = React.useMemo(() => {
    const now = new Date();
    const isProgramOngoing = (p: Program) => p.startTime <= now && p.endTime >= now;

    return {
        totalEvents: events.length,
        programsToday: programs.filter(p => isToday(p.startTime)).length,
        ongoingPrograms: programs.filter(isProgramOngoing).length,
        upcomingEvents: events.filter(e => isFuture(e.startTime)).length
    };
  }, [events, programs]);
  
  const upcomingPrograms = React.useMemo(() => {
    return programs.filter(p => isFuture(p.startTime));
  }, [programs]);
  

  if (isLoading) {
      return (
          <AppLayout>
              <PageSkeleton />
          </AppLayout>
      )
  }

  return (
    <AppLayout>
      <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight font-headline">Events Dashboard</h1>
            <Button asChild>
                <Link href="/events/map"><ListTodo className="mr-2 h-4 w-4" /> View Timeline</Link>
            </Button>
        </div>
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Events" value={stats.totalEvents} icon={CalendarDays} description="All scheduled events" />
            <StatCard title="Programs Today" value={stats.programsToday} icon={Hourglass} description="Activities scheduled for today" />
            <StatCard title="Ongoing Programs" value={stats.ongoingPrograms} icon={PlayCircle} description="Currently active right now" />
            <StatCard title="Upcoming Events" value={stats.upcomingEvents} icon={ListTodo} description="Events that are yet to start" />
        </div>

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle>Upcoming Programs</CardTitle>
                    <CardDescription>A look at the next scheduled activities across all events.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[350px]">
                        <div className="space-y-4 pr-4">
                            {upcomingPrograms.length > 0 ? upcomingPrograms.map(program => {
                                const event = events.find(e => e.id === program.eventId);
                                return (
                                    <div key={program.id} className="p-3 bg-muted/50 rounded-lg">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-semibold text-primary">{program.name}</p>
                                                <p className="text-xs text-muted-foreground font-medium">{event?.name || 'Event'}</p>
                                            </div>
                                            <div className="text-right text-xs shrink-0">
                                                <p className="font-bold">{format(program.startTime, 'MMM d')}</p>
                                                <p className="text-muted-foreground">{format(program.startTime, 'p')}</p>
                                            </div>
                                        </div>
                                         <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                                            <MapPin className="h-3 w-3" />
                                            <span>{program.startLocation.label}</span>
                                        </div>
                                    </div>
                                )
                            }) : (
                                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                                    <p>No upcoming programs scheduled.</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
             <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BarChart /> Programs per Event</CardTitle>
                        <CardDescription>Distribution of scheduled programs across all events.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px] pt-6">
                       <EventProgramsChart events={events} programs={programs} />
                    </CardContent>
                </Card>
            </div>
        </div>
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><UsersIcon /> Role Distribution</CardTitle>
                <CardDescription>Breakdown of all assigned roles across all event programs.</CardDescription>
            </CardHeader>
            <CardContent>
                <RoleDistributionChart programs={programs} />
            </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
