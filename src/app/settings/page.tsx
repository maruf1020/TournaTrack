
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
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
import { Loader2, Lock, Palette, Trash2, ShieldX, Gamepad, Eye } from 'lucide-react';
import type { Game, Match, PublicSettings } from '@/lib/types';
import { getGames, addGame, deleteGame, getMatches, deleteMatchesByTournament, getPublicSettings, updatePublicSettings } from '@/lib/services';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';

const matchStatuses: Match['status'][] = ['draft', 'upcoming', 'ongoing', 'finished', 'cancelled'];

function PublicVisibilityCard() {
    const { toast } = useToast();
    const [settings, setSettings] = React.useState<PublicSettings | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);

    React.useEffect(() => {
        const unsubscribe = getPublicSettings((settingsData) => {
            if (settingsData) {
                setSettings(settingsData);
            } else {
                // Initialize with default settings if none exist
                setSettings({
                    visibleStatuses: {
                        draft: true,
                        upcoming: true,
                        ongoing: true,
                        finished: true,
                        cancelled: true,
                    }
                });
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleCheckedChange = (status: Match['status'], checked: boolean) => {
        setSettings(prev => {
            if (!prev) return null;
            return {
                ...prev,
                visibleStatuses: {
                    ...prev.visibleStatuses,
                    [status]: checked,
                }
            };
        });
    };

    const handleSave = async () => {
        if (!settings) return;
        setIsSaving(true);
        try {
            await updatePublicSettings(settings);
            toast({ title: 'Settings Saved', description: 'Public match visibility has been updated.' });
        } catch (error: any) {
            toast({ title: 'Error', description: `Failed to save settings: ${error.message}`, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Eye /> Public Match Visibility</CardTitle>
                    <CardDescription>Control which match statuses are visible to the public on the "All Matches" page.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Eye /> Public Match Visibility</CardTitle>
                <CardDescription>Control which match statuses are visible to the public on the "All Matches" page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Select the statuses you want to show to non-admin users.</p>
                <div className="grid grid-cols-2 gap-4">
                    {matchStatuses.map(status => (
                        <div key={status} className="flex items-center space-x-2">
                            <Checkbox
                                id={`status-${status}`}
                                checked={settings?.visibleStatuses[status] ?? true}
                                onCheckedChange={(checked) => handleCheckedChange(status, !!checked)}
                            />
                            <Label htmlFor={`status-${status}`} className="capitalize font-normal">{status}</Label>
                        </div>
                    ))}
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Settings
                </Button>
            </CardFooter>
        </Card>
    );
}

function GameManagementCard() {
    const [games, setGames] = React.useState<Game[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [newGameName, setNewGameName] = React.useState('');
    const [isAdding, setIsAdding] = React.useState(false);
    const { toast } = useToast();

    React.useEffect(() => {
        setIsLoading(true);
        const unsubscribe = getGames((gameData) => {
            setGames(gameData);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleAddGame = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGameName.trim()) {
            toast({ title: 'Error', description: 'Game name cannot be empty.', variant: 'destructive' });
            return;
        }
        setIsAdding(true);
        try {
            await addGame(newGameName.trim());
            toast({ title: 'Game Added', description: `"${newGameName.trim()}" has been added.` });
            setNewGameName('');
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteGame = async (gameId: string, gameName: string) => {
        try {
            await deleteGame(gameId);
            toast({ title: 'Game Deleted', description: `"${gameName}" has been deleted.` });
        } catch (error: any) {
            toast({ title: 'Error', description: `Failed to delete game: ${error.message}`, variant: 'destructive' });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Gamepad /> Manage Games</CardTitle>
                <CardDescription>Add or remove game types available for tournaments.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <form onSubmit={handleAddGame} className="flex items-center gap-2">
                    <Input
                        placeholder="Enter new game name"
                        value={newGameName}
                        onChange={(e) => setNewGameName(e.target.value)}
                        disabled={isAdding}
                    />
                    <Button type="submit" disabled={isAdding}>
                        {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add
                    </Button>
                </form>
                <div className="space-y-2 rounded-md border p-2 h-48 overflow-y-auto">
                    {isLoading ? (
                        <div className="space-y-2 p-2">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                        </div>
                    ) : games.length > 0 ? (
                        games.map(game => (
                            <div key={game.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                                <span className="font-medium">{game.name}</span>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently delete the game "{game.name}". This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteGame(game.id, game.name)}>
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-muted-foreground p-4">No games found.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function AppearanceCard() {
    const { toast } = useToast();

    const hexToHsl = (hex: string): string => {
        hex = hex.replace(/^#/, '');
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        h = Math.round(h * 360);
        s = Math.round(s * 100);
        l = Math.round(l * 100);

        return `${h} ${s}% ${l}%`;
    };


    const handleColorChange = (hexColor: string) => {
        const hslColor = hexToHsl(hexColor);
        document.documentElement.style.setProperty('--primary', hslColor);
        // Also update ring color for consistency
        document.documentElement.style.setProperty('--ring', hslColor);
        toast({ title: 'Theme Updated', description: 'Primary color has been changed.' });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Palette /> Appearance</CardTitle>
                <CardDescription>Customize the look and feel of the application.</CardDescription>
            </CardHeader>
            <CardContent>
                <div>
                    <Label htmlFor="color-picker">Primary Color</Label>
                    <p className="text-sm text-muted-foreground mb-2">Select a new primary color for the UI.</p>
                    <Input 
                      id="color-picker"
                      type="color" 
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="p-1 h-10 w-24"
                      defaultValue="#ff6600"
                    />
                </div>
            </CardContent>
        </Card>
    );
}

function DangerZoneCard() {
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
    const [tournaments, setTournaments] = React.useState<string[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

     React.useEffect(() => {
        setIsLoading(true);
        const unsubscribe = getMatches((matches) => {
            const tournamentNames = [...new Set(matches.map(m => m.game))].sort();
            setTournaments(tournamentNames);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleDeleteTournament = async (tournamentName: string) => {
        setIsDeleting(tournamentName);
        try {
            await deleteMatchesByTournament(tournamentName);
            toast({ title: 'Tournament Deleted', description: `All matches for "${tournamentName}" have been cleared.` });
        } catch (error: any) {
            toast({ title: 'Error', description: `Failed to delete tournament matches: ${error.message}`, variant: 'destructive' });
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <Card className="border-destructive">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive"><ShieldX /> Danger Zone</CardTitle>
                <CardDescription>These actions are irreversible. Proceed with caution.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <h4 className="font-semibold text-foreground">Delete Tournament Data</h4>
                 <p className="text-sm text-muted-foreground">This will permanently remove all created matches and bracket data for a specific tournament.</p>
                
                 <ScrollArea className="h-48 rounded-md border">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : tournaments.length > 0 ? (
                        <div className="p-2 space-y-2">
                        {tournaments.map(name => (
                            <div key={name} className="flex items-center justify-between p-2 bg-destructive/10 rounded-md">
                                <span className="font-medium text-destructive">{name}</span>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm" disabled={isDeleting === name}>
                                            {isDeleting === name ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                            Delete
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action is permanent. All match data for the <span className="font-bold">"{name}"</span> tournament will be lost forever.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDeleteTournament(name)}>
                                                Yes, delete this tournament
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-muted-foreground">No tournaments found.</p>
                        </div>
                    )}
                 </ScrollArea>
            </CardContent>
        </Card>
    );
}


export default function SettingsPage() {
    const { user, isAdmin, loading } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
        if (!loading && !isAdmin) {
            router.push('/');
        }
    }, [user, isAdmin, loading, router]);

    if (loading) {
        return (
            <AppLayout>
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </AppLayout>
        );
    }

    if (!isAdmin) {
        return (
            <AppLayout>
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <Lock className="w-16 h-16 text-destructive mb-4" />
                    <h1 className="text-2xl font-bold">Access Denied</h1>
                    <p className="text-muted-foreground mt-2">
                        You do not have permission to view this page.
                    </p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Settings</h1>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <PublicVisibilityCard />
                        <GameManagementCard />
                        <AppearanceCard />
                    </div>
                    <div className="space-y-6">
                        <DangerZoneCard />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

    

    