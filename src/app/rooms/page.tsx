
'use client';

import * as React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BedDouble, Loader2 } from 'lucide-react';
import { getRoomsForEvent, getEventsOnce, getPlayersOnce } from '@/lib/services';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useSortableTable } from '@/hooks/use-sortable-table';
import { SortableTableHeader } from '@/components/ui/sortable-table-header';
import type { Room, Event, Player } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { branches } from '@/lib/placeholder-data';


const SkeletonLoader = () => (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-10 w-64" />
        </div>
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-1/3" />
                </div>
                 <Skeleton className="h-4 w-3/4" />
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
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    </div>
);


export default function ViewRoomsPage() {
  const [rooms, setRooms] = React.useState<Room[]>([]);
  const [events, setEvents] = React.useState<Event[]>([]);
  const [allPlayers, setAllPlayers] = React.useState<Player[]>([]);
  const [selectedEventId, setSelectedEventId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [filters, setFilters] = React.useState({
      search: '',
      branch: 'all',
      designation: 'all',
  });

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({...prev, [key]: value}));
  };

  // Fetch initial data
  React.useEffect(() => {
      async function loadData() {
          setIsLoading(true);
          try {
              const [eventData, playerData] = await Promise.all([getEventsOnce(), getPlayersOnce()]);
              setAllPlayers(playerData);
              const sortedEvents = eventData.sort((a,b) => b.startTime.getTime() - a.startTime.getTime());
              setEvents(sortedEvents);
              if (sortedEvents.length > 0) {
                  setSelectedEventId(sortedEvents[0].id);
              } else {
                  setIsLoading(false);
              }
          } catch (error) {
              console.error(error);
              setIsLoading(false);
          }
      }
      loadData();
  }, []);

  // Fetch rooms when event changes
  React.useEffect(() => {
      if (!selectedEventId) {
          setRooms([]);
          setIsLoading(false); // Stop loading if there's no event to fetch for
          return;
      };

      const fetchRooms = async () => {
        setIsLoading(true);
        try {
            const roomData = await getRoomsForEvent(selectedEventId);
            setRooms(roomData);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
      };

      fetchRooms();
  }, [selectedEventId]);
  
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


  if (isLoading && events.length === 0) {
    return (
        <AppLayout>
            <SkeletonLoader />
        </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight font-headline">Room Assignments</h1>
            <div className="w-full sm:w-64">
                <Select value={selectedEventId || ''} onValueChange={id => setSelectedEventId(id)} disabled={events.length === 0}>
                    <SelectTrigger><SelectValue placeholder="Select an Event..." /></SelectTrigger>
                    <SelectContent>
                        {events.map(event => <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </div>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BedDouble className="h-6 w-6" />
                    Room Plan: {events.find(e => e.id === selectedEventId)?.name || '...'}
                </CardTitle>
                <CardDescription>View all room assignments for the selected event. Search by room name or employee.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={3} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin" /></TableCell></TableRow>
                            ) : sortedData.length > 0 ? (
                                sortedData.map(room => (
                                    <TableRow key={room.id}>
                                        <TableCell className="font-medium">{room.name}</TableCell>
                                        <TableCell>{room.assignedEmployees.length} / {room.capacity}</TableCell>
                                        <TableCell>
                                            {room.assignedEmployees.map(p => p.name).join(', ') || <span className="text-muted-foreground">Empty</span>}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                 <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                       No rooms found for this event.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
