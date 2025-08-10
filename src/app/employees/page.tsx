
'use client';

import * as React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { getPlayersOnce } from '@/lib/services';
import type { Player } from '@/lib/types';
import { branches, departments } from '@/lib/placeholder-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building, Briefcase, Mail, UserSearch } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const PlayerCard = ({ player }: { player: Player }) => (
    <Link href={`/employees/${player.id}`} className="group">
        <Card className="h-full transition-all duration-200 group-hover:bg-muted/80 group-hover:shadow-md">
            <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-16 w-16">
                    <AvatarImage src={player.imageUrl} alt={player.name} data-ai-hint="profile person" />
                    <AvatarFallback>{player.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                    <h3 className="font-semibold text-lg text-primary group-hover:underline">{player.name}</h3>
                    <p className="text-sm text-muted-foreground">{player.designation}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                        <div className="flex items-center gap-1.5"><Building className="h-3 w-3" /> {player.branch}</div>
                        <div className="flex items-center gap-1.5"><Briefcase className="h-3 w-3" /> {player.department}</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    </Link>
);

const PageSkeleton = () => (
    <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6">
        <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-64" />
        </div>
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
            </CardContent>
        </Card>
    </div>
);


export default function EmployeeDirectoryPage() {
    const [employees, setEmployees] = React.useState<Player[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [filters, setFilters] = React.useState({
        search: '',
        branch: 'all',
        department: 'all',
    });

    React.useEffect(() => {
        async function loadData() {
            setIsLoading(true);
            try {
                const data = await getPlayersOnce();
                setEmployees(data);
            } catch (error) {
                console.error("Failed to load employees", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const filteredEmployees = React.useMemo(() => {
        return employees
            .filter(employee => {
                const searchLower = filters.search.toLowerCase();
                const nameMatch = employee.name.toLowerCase().includes(searchLower);
                const emailMatch = employee.email.toLowerCase().includes(searchLower);
                const branchMatch = filters.branch === 'all' || employee.branch === filters.branch;
                const departmentMatch = filters.department === 'all' || employee.department === filters.department;

                return (nameMatch || emailMatch) && branchMatch && departmentMatch;
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [employees, filters]);

    if (isLoading) {
        return (
            <AppLayout>
                <PageSkeleton />
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Employee Directory</h1>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><UserSearch /> Find a Colleague</CardTitle>
                        <CardDescription>Search and filter to find contact information for employees across the company.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                            <Input
                                placeholder="Search by name or email..."
                                value={filters.search}
                                onChange={e => handleFilterChange('search', e.target.value)}
                            />
                            <Select value={filters.branch} onValueChange={value => handleFilterChange('branch', value)}>
                                <SelectTrigger><SelectValue placeholder="Filter by branch..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Branches</SelectItem>
                                    {branches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={filters.department} onValueChange={value => handleFilterChange('department', value)}>
                                <SelectTrigger><SelectValue placeholder="Filter by department..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Departments</SelectItem>
                                    {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredEmployees.map(player => (
                                <PlayerCard key={player.id} player={player} />
                            ))}
                        </div>

                        {filteredEmployees.length === 0 && (
                            <div className="text-center py-16 text-muted-foreground">
                                <p>No employees found matching your criteria.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
