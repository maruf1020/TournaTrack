
'use client';

import * as React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { BedDouble, Loader2, Users2, Star, Shield, User, Search } from 'lucide-react';
import { getTeamsOnce, getEventsOnce, getPlayersOnce } from '@/lib/services';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { Team, Event, Player } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { branches } from '@/lib/placeholder-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const SkeletonLoader = () => (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Skeleton className="h-9 w-64" />
        </div>
        <Card>
            <CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
                </div>
            </CardContent>
        </Card>
    </div>
);

const TeamCard = ({ team, eventName }: { team: Team, eventName: string }) => {
    return (
        <Card>
            <CardHeader className="bg-muted/40">
                <CardTitle className="flex items-center gap-2 text-primary">{team.name}</CardTitle>
                <CardDescription>{eventName}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><Star className="text-amber-400" /> Leader</h4>
                    <div className="flex items-center gap-2 p-2 rounded-md bg-amber-50 dark:bg-amber-900/20">
                         <Avatar className="h-8 w-8">
                            <AvatarImage src={team.leader.imageUrl} />
                            <AvatarFallback>{team.leader.name.charAt(0)}</AvatarFallback>
                         </Avatar>
                         <span className="font-medium text-sm">{team.leader.name}</span>
                    </div>
                </div>
                {team.managers.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><Shield /> Managers</h4>
                        <div className="space-y-1">
                          {team.managers.map(m => (
                              <div key={m.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="h-3 w-3" /> {m.name}
                              </div>
                          ))}
                        </div>
                    </div>
                )}
                 {team.members.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><Users2 /> Members</h4>
                         <div className="space-y-1">
                          {team.members.map(m => (
                               <div key={m.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="h-3 w-3" /> {m.name}
                              </div>
                          ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export default function ViewGroupsPage() {
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [events, setEvents] = React.useState<Event[]>([]);
  const [allPlayers, setAllPlayers] = React.useState<Player[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [filters, setFilters] = React.useState({
      search: '',
      branch: 'all',
      designation: 'all',
      event: 'all',
  });

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({...prev, [key]: value}));
  };

  React.useEffect(() => {
      async function loadData() {
          setIsLoading(true);
          try {
              const [eventData, playerData, teamData] = await Promise.all([getEventsOnce(), getPlayersOnce(), getTeamsOnce()]);
              setAllPlayers(playerData);
              setTeams(teamData);
              const sortedEvents = eventData.sort((a,b) => b.startTime.getTime() - a.startTime.getTime());
              setEvents(sortedEvents);
          } catch (error) {
              console.error(error);
          } finally {
              setIsLoading(false);
          }
      }
      loadData();
  }, []);
  
  const allDesignations = React.useMemo(() => {
    const designations = new Set<string>();
    allPlayers.forEach(p => p.designation && designations.add(p.designation));
    return Array.from(designations).sort();
  }, [allPlayers]);

  const filteredTeams = React.useMemo(() => {
    const lowercasedFilter = filters.search.toLowerCase();
    return teams.filter(team => {
      const nameMatch = team.name.toLowerCase().includes(lowercasedFilter);
      const allTeamMembers = [team.leader, ...team.managers, ...team.members];
      const personMatch = allTeamMembers.some(p => p.name.toLowerCase().includes(lowercasedFilter));

      const eventMatch = filters.event === 'all' || team.eventId === filters.event;
      const branchMatch = filters.branch === 'all' || allTeamMembers.some(p => p.branch === filters.branch);
      const designationMatch = filters.designation === 'all' || allTeamMembers.some(p => p.designation === filters.designation);

      return (nameMatch || personMatch) && eventMatch && branchMatch && designationMatch;
    });
  }, [teams, filters]);
  
  if (isLoading) {
    return ( <AppLayout><SkeletonLoader /></AppLayout> );
  }

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight font-headline">All Groups</h1>
        </div>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Search /> Filter Groups</CardTitle>
            </CardHeader>
            <CardContent>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Input 
                        placeholder="Search by team or person..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                     <Select value={filters.event} onValueChange={value => handleFilterChange('event', value)}>
                        <SelectTrigger><SelectValue placeholder="All Events" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Events</SelectItem>
                            {events.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
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
            </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.length > 0 ? filteredTeams.map(team => {
                const eventName = events.find(e => e.id === team.eventId)?.name || "Unknown Event";
                return <TeamCard key={team.id} team={team} eventName={eventName}/>
            }) : (
                <div className="md:col-span-2 lg:col-span-3 text-center py-16 text-muted-foreground">
                    <p>No teams found for the current filters.</p>
                </div>
            )}
        </div>
      </div>
    </AppLayout>
  );
}
