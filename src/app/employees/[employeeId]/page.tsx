
'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Mail, Briefcase, Building, Calendar, Hash, ArrowLeft, Loader2, User, Swords, Info } from 'lucide-react';
import { getPlayerById, getMatchesOnce, getAllPrograms, getEventsOnce } from '@/lib/services';
import type { Player, Match, Program, Event } from '@/lib/types';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


const ProfileSkeleton = () => (
    <AppLayout>
        <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6">
            <Skeleton className="h-9 w-32 mb-4" />
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <Skeleton className="h-32 w-32 rounded-full" />
                        <div className="space-y-2 text-center md:text-left">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-6 w-32" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <Skeleton className="h-64 w-full" />
                     <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
        </div>
    </AppLayout>
)

const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | undefined | null }) => (
    <div className="flex items-start gap-4 py-3">
        <Icon className="h-5 w-5 text-muted-foreground mt-1" />
        <div className="flex-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-medium text-base">{value || 'N/A'}</p>
        </div>
    </div>
);

const PlayerMatchCard = ({ match, playerId }: { match: Match, playerId: string }) => {
    const isP1 = match.player1.some(p => p.id === playerId);
    const p1IsWinner = match.winnerId && match.player1.some(p => p.id === match.winnerId);
    const p2IsWinner = match.winnerId && match.player2.some(p => p.id === match.winnerId);
    
    let result: 'win' | 'loss' | 'pending' | 'draw' = 'pending';
    if(match.status === 'finished') {
        if (!match.winnerId) result = 'draw';
        else if ((isP1 && p1IsWinner) || (!isP1 && p2IsWinner)) result = 'win';
        else result = 'loss';
    }


    return (
        <div className="p-3 border rounded-md">
            <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                <span>{match.tournamentName}</span>
                <span>{match.date ? format((match.date as any).toDate(), 'PP') : 'TBD'}</span>
            </div>
            <div className="text-sm flex items-center justify-between">
                <p className="font-medium">{isP1 ? match.player2[0]?.name : match.player1[0]?.name || 'TBD'}</p>
                <span className={cn(
                    'font-semibold text-xs uppercase px-2 py-0.5 rounded-full',
                    result === 'win' && 'bg-emerald-100 text-emerald-800',
                    result === 'loss' && 'bg-rose-100 text-rose-800',
                    result === 'draw' && 'bg-slate-100 text-slate-800',
                    result === 'pending' && 'bg-amber-100 text-amber-800'
                )}>
                    {result}
                </span>
            </div>
        </div>
    )
}

type AssignedRole = {
    event: Event;
    program: Program;
    role: string;
}

const AssignedRoleCard = ({ assignment }: { assignment: AssignedRole }) => (
    <div className="p-3 border rounded-md">
        <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="font-semibold truncate cursor-default">{assignment.event.name}</span>
                    </TooltipTrigger>
                    <TooltipContent><p>{assignment.event.name}</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <span>{format(assignment.program.startTime, 'PP')}</span>
        </div>
        <div className="text-sm font-medium">
            <p>{assignment.program.name}</p>
            <p className="text-primary font-semibold">{assignment.role}</p>
        </div>
    </div>
)


export default function EmployeeProfilePage() {
    const params = useParams();
    const employeeId = params.employeeId as string;
    const [player, setPlayer] = React.useState<Player | null>(null);
    const [matches, setMatches] = React.useState<Match[]>([]);
    const [assignedRoles, setAssignedRoles] = React.useState<AssignedRole[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        if (!employeeId) return;

        async function loadData() {
            setIsLoading(true);
            try {
                const [playerData, allMatches, allPrograms, allEvents] = await Promise.all([
                    getPlayerById(employeeId),
                    getMatchesOnce(),
                    getAllPrograms(),
                    getEventsOnce()
                ]);
                
                setPlayer(playerData);

                if (playerData) {
                    const playerMatches = allMatches.filter(m => 
                        m.player1.some(p => p.id === playerData.id) ||
                        m.player2.some(p => p.id === playerData.id)
                    ).sort((a,b) => {
                        const dateA = a.date ? (a.date as any).toDate().getTime() : 0;
                        const dateB = b.date ? (b.date as any).toDate().getTime() : 0;
                        return dateB - dateA;
                    });
                    setMatches(playerMatches);

                    const eventMap = new Map(allEvents.map(e => [e.id, e]));
                    const roles: AssignedRole[] = [];
                    allPrograms.forEach(program => {
                        program.roles.forEach(role => {
                            if (role.assignedEmployees.some(e => e.id === playerData.id)) {
                                const event = eventMap.get(program.eventId);
                                if (event) {
                                    roles.push({
                                        event,
                                        program,
                                        role: role.roleName
                                    });
                                }
                            }
                        })
                    })
                    setAssignedRoles(roles.sort((a,b) => b.program.startTime.getTime() - a.program.startTime.getTime()));
                }

            } catch (error) {
                console.error("Failed to load employee profile", error);
            } finally {
                setIsLoading(false);
            }
        }

        loadData();
    }, [employeeId]);
    
    if (isLoading) {
        return <ProfileSkeleton />;
    }

    if (!player) {
        return (
            <AppLayout>
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <User className="w-16 h-16 text-destructive mb-4" />
                    <h1 className="text-2xl font-bold">Employee Not Found</h1>
                    <p className="text-muted-foreground mt-2">
                        The profile you are looking for does not exist.
                    </p>
                    <Button asChild variant="outline" className="mt-4">
                       <Link href="/employees"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Directory</Link>
                    </Button>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6">
                 <Button asChild variant="ghost">
                    <Link href="/employees"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Directory</Link>
                 </Button>

                <Card className="overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b p-6">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <Avatar className="h-32 w-32 border-4 border-background shadow-md">
                                <AvatarImage src={player.imageUrl} alt={player.name} data-ai-hint="profile person" />
                                <AvatarFallback className="text-4xl">{player.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-1 text-center md:text-left">
                                <h1 className="text-3xl font-bold font-headline text-primary">{player.name}</h1>
                                <p className="text-xl text-muted-foreground">{player.designation}</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 p-6">
                        <div className="space-y-2">
                             <h3 className="text-lg font-semibold border-b pb-2 mb-2">Contact & Organizational Info</h3>
                             <div className="divide-y">
                                <InfoRow icon={Mail} label="Email" value={player.email} />
                                <InfoRow icon={Building} label="Branch" value={player.branch} />
                                <InfoRow icon={Briefcase} label="Department" value={player.department} />
                             </div>
                        </div>
                         <div className="space-y-2">
                            <h3 className="text-lg font-semibold border-b pb-2 mb-2">Employment Details</h3>
                             <div className="divide-y">
                                <InfoRow icon={Hash} label="Employee ID" value={player.employeeId} />
                                <InfoRow icon={Calendar} label="Joining Date" value={player.joiningDate ? format(new Date(player.joiningDate), 'PPP') : null} />
                                <InfoRow icon={User} label="Role" value={player.isAdmin ? 'Admin' : 'Player'} />
                             </div>
                        </div>
                        <div className="md:col-span-2 pt-4">
                             <h3 className="text-lg font-semibold border-b pb-2 mb-4 flex items-center gap-2">
                                <Swords />
                                Recent Matches ({matches.length})
                             </h3>
                             {matches.length > 0 ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                    {matches.slice(0, 6).map(match => (
                                        <PlayerMatchCard key={match.id} match={match} playerId={player.id} />
                                    ))}
                                </div>
                             ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">No recent match history.</p>
                             )}
                        </div>
                         <div className="md:col-span-2 pt-4">
                             <h3 className="text-lg font-semibold border-b pb-2 mb-4 flex items-center gap-2">
                                <Info />
                                Event Roles & Responsibilities ({assignedRoles.length})
                             </h3>
                             {assignedRoles.length > 0 ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                    {assignedRoles.slice(0, 6).map(assignment => (
                                        <AssignedRoleCard key={assignment.program.id} assignment={assignment} />
                                    ))}
                                </div>
                             ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">No assigned event roles.</p>
                             )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    )

}
