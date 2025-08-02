

'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getPlayersOnce, addMatches, getPublicSettings, getGamesOnce } from '@/lib/services';
import { branches } from '@/lib/placeholder-data';
import type { Player, Match, PublicSettings, Game } from '@/lib/types';
import { Loader2, Shuffle, Users, Sword, UserCheck, GitBranch, Gamepad2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '../ui/scroll-area';

const createMatchesSchema = z.object({
  branch: z.array(z.string()).min(1, 'Please select at least one branch.'),
  gameId: z.string().min(1, 'Please select a game.'),
  tournamentName: z.string().min(3, 'Tournament name must be at least 3 characters.'),
  numPlayers: z.string(),
  matchType: z.string().min(1, 'Please select a match type.'),
}).refine(data => {
    if (data.matchType !== 'Battle Royale') {
        return Number(data.numPlayers) > 0;
    }
    return true;
}, {
    message: "Please select number of players.",
    path: ["numPlayers"],
});

type CreateMatchesFormInputs = z.infer<typeof createMatchesSchema>;

type GeneratedMatch = Omit<Match, 'id' | 'date' | 'startTime' | 'endTime' | 'isDatePublished'>;

const PlayerListDisplay = ({ players, placeholder }: { players: Player[], placeholder?: string }) => {
  if (placeholder) {
    return <div className="text-sm font-semibold italic text-muted-foreground">{placeholder}</div>;
  }
  return (
    <div>
      {players.map((p, index) => (
        <div key={p.id} className="text-sm">
          {players.length > 1 && `${index + 1}. `}{p.name}
        </div>
      ))}
    </div>
  );
};


function PlayerSelectionDialog({
  open,
  onOpenChange,
  players,
  selectedPlayerIds,
  onConfirm,
  numPlayersToSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  players: Player[];
  selectedPlayerIds: string[];
  onConfirm: (selectedIds: string[]) => void;
  numPlayersToSelect: number;
}) {
  const [internalSelection, setInternalSelection] = React.useState<string[]>(selectedPlayerIds);
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    setInternalSelection(selectedPlayerIds);
  }, [selectedPlayerIds, open]);

  const filteredPlayers = players.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleTogglePlayer = (playerId: string) => {
    setInternalSelection(prev => {
        const isSelected = prev.includes(playerId);
        if (isSelected) {
            return prev.filter(id => id !== playerId);
        } else {
            if (numPlayersToSelect > 0 && prev.length >= numPlayersToSelect) {
                // Optional: Show a toast or alert that the limit is reached
                toast({
                    title: 'Player limit reached',
                    description: `You can only select ${numPlayersToSelect} players for this tournament.`,
                    variant: 'destructive'
                });
                return prev;
            }
            return [...prev, playerId];
        }
    });
  };

  const handleSelectAll = () => {
    const allIds = filteredPlayers.map(p => p.id);
    const slicedIds = numPlayersToSelect > 0 ? allIds.slice(0, numPlayersToSelect) : allIds;
    setInternalSelection(slicedIds);
  };
  

  const handleDeselectAll = () => {
    setInternalSelection([]);
  };

  const handleConfirm = () => {
    onConfirm(internalSelection);
    onOpenChange(false);
  };

   const { toast } = useToast();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select Players</DialogTitle>
          <DialogDescription>
            Choose {numPlayersToSelect > 0 ? `exactly ${numPlayersToSelect}` : 'all'} players to include in the tournament.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            placeholder="Search players..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{internalSelection.length} / {numPlayersToSelect > 0 ? numPlayersToSelect : players.length} selected</p>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>Select All</Button>
                <Button variant="outline" size="sm" onClick={handleDeselectAll}>Deselect All</Button>
            </div>
          </div>
          <ScrollArea className="h-60 rounded-md border p-2">
            <div className="space-y-2">
              {filteredPlayers.map(player => (
                <Label key={player.id} className="flex items-center gap-3 font-normal text-base">
                  <Checkbox
                    className="h-4 w-4"
                    checked={internalSelection.includes(player.id)}
                    onCheckedChange={() => handleTogglePlayer(player.id)}
                  />
                  {player.name}
                </Label>
              ))}
            </div>
          </ScrollArea>
        </div>
        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleConfirm}>Confirm Selection</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CreateMatches({ onMatchesCreated }: { onMatchesCreated: () => void }) {
  const [players, setPlayers] = React.useState<Player[]>([]);
  const [games, setGames] = React.useState<Game[]>([]);
  const [generatedTournament, setGeneratedTournament] = React.useState<GeneratedMatch[][]>([]);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const { toast } = useToast();
  const [branchSearch, setBranchSearch] = React.useState("");
  const [selectedPlayerIds, setSelectedPlayerIds] = React.useState<string[]>([]);
  const [isPlayerSelectionOpen, setIsPlayerSelectionOpen] = React.useState(false);
  const [settings, setSettings] = React.useState<PublicSettings | null>(null);

  const { register, handleSubmit, control, watch, formState: { errors }, setValue } = useForm<CreateMatchesFormInputs>({
    resolver: zodResolver(createMatchesSchema),
    defaultValues: {
        branch: [],
        gameId: "",
        tournamentName: "",
        numPlayers: "0",
        matchType: ""
    }
  });

  const selectedBranches = watch('branch');
  const numPlayersRaw = watch('numPlayers');
  const matchType = watch('matchType');
  const tournamentName = watch('tournamentName');
  const numPlayers = parseInt(numPlayersRaw || '0', 10);
  
  React.useEffect(() => {
    async function loadData() {
        try {
            const [playerData, gameData] = await Promise.all([
                getPlayersOnce(),
                getGamesOnce()
            ]);
            setPlayers(playerData);
            setGames(gameData);
        } catch (error) {
            toast({
                title: 'Error loading data',
                description: 'Could not fetch players or games.',
                variant: 'destructive',
            });
        }
    }
    loadData();

    const unsubSettings = getPublicSettings(setSettings);
    return () => {
        unsubSettings();
    }
  }, [toast]);

  const playersInSelectedBranches = React.useMemo(() => {
    if (!selectedBranches || selectedBranches.length === 0) return [];
    return players.filter(p => selectedBranches.includes(p.branch));
  }, [players, selectedBranches]);
  
  const selectedPlayersFull = React.useMemo(() => {
    return players.filter(p => selectedPlayerIds.includes(p.id));
  }, [players, selectedPlayerIds]);


  React.useEffect(() => {
    setSelectedPlayerIds([]);
    setGeneratedTournament([]);
  }, [selectedBranches]);
  
  const getRoundName = (roundIndex: number, totalRounds: number) => {
    if (totalRounds === 1) return 'Final';
    if (roundIndex === totalRounds - 1) return 'Final';
    if (roundIndex === totalRounds - 2) return 'Semi-Finals';
    if (roundIndex === totalRounds - 3) return 'Quarter-Finals';
    return `Round ${roundIndex + 1}`;
  };

  const getTeamSize = (matchType: string): number => {
    if (matchType === '1v1') return 1;
    if (matchType === '2v2') return 2;
    if (matchType === '4v4') return 4;
    return 1; // Default
  }

  const onGenerateTournament = (data: CreateMatchesFormInputs) => {
    setIsGenerating(true);
    setGeneratedTournament([]);
    
    const teamSize = getTeamSize(data.matchType);
    const numTeams = data.matchType === 'Battle Royale' ? 1 : numPlayers;
    const totalPlayersRequired = numTeams * teamSize;

    if (selectedPlayerIds.length === 0) {
      toast({ title: 'No Players Selected', description: 'Please select players manually to generate matchups.', variant: 'destructive' });
      setIsGenerating(false);
      return;
    }
    
    const selectedPlayers = players.filter(p => selectedPlayerIds.includes(p.id));
    const selectedGame = games.find(g => g.id === data.gameId);

    if (!selectedGame) {
         toast({ title: 'Game not found', description: 'Please select a valid game.', variant: 'destructive' });
         setIsGenerating(false);
         return;
    }

    if (data.matchType === 'Battle Royale') {
        if (selectedPlayers.length < 2) {
            toast({ title: 'Not Enough Players', description: 'Need at least 2 players for a Battle Royale match.', variant: 'destructive' });
            setIsGenerating(false);
            return;
        }
        const battleRoyaleMatch: GeneratedMatch = {
            tournamentName: data.tournamentName,
            game: selectedGame.name,
            matchName: `${data.tournamentName} - Final`,
            matchType: 'Battle Royale',
            player1: [], player2: [],
            allPlayers: selectedPlayers,
            status: 'draft',
            winnerId: null,
            score: { player1: 0, player2: 0 }
        };
        setGeneratedTournament([[battleRoyaleMatch]]);
    } else {
        if (selectedPlayers.length !== totalPlayersRequired) {
            toast({ title: 'Incorrect Player Count', description: `You have selected ${selectedPlayers.length} players, but this tournament configuration requires ${totalPlayersRequired}.`, variant: 'destructive' });
            setIsGenerating(false);
            return;
        }

        const shuffled = [...selectedPlayers].sort(() => 0.5 - Math.random());

        // Create teams
        const teams: Player[][] = [];
        for (let i = 0; i < shuffled.length; i += teamSize) {
            teams.push(shuffled.slice(i, i + teamSize));
        }

        const totalRounds = Math.log2(numTeams);
        if (!Number.isInteger(totalRounds)) {
            toast({ title: 'Invalid Number of Teams', description: `The number of teams (${numTeams}) must be a power of 2 (e.g., 4, 8, 16).`, variant: 'destructive' });
            setIsGenerating(false);
            return;
        }

        let previousRoundMatches: GeneratedMatch[] = [];
        const tournamentRounds: GeneratedMatch[][] = [];

        // Generate Round 1
        const round1Matches: GeneratedMatch[] = [];
        for (let i = 0; i < numTeams / 2; i++) {
            const match: GeneratedMatch = {
                tournamentName: data.tournamentName,
                game: selectedGame.name,
                matchName: `${getRoundName(0, totalRounds)} - Match ${i + 1}`,
                matchType: data.matchType,
                player1: teams[i * 2],
                player2: teams[i * 2 + 1],
                status: 'draft',
                winnerId: null,
                score: { player1: 0, player2: 0 }
            };
            round1Matches.push(match);
        }
        tournamentRounds.push(round1Matches);
        previousRoundMatches = round1Matches;

        // Generate subsequent rounds
        for (let roundIndex = 1; roundIndex < totalRounds; roundIndex++) {
            const currentRoundMatches: GeneratedMatch[] = [];
            const roundName = getRoundName(roundIndex, totalRounds);
            for (let i = 0; i < previousRoundMatches.length / 2; i++) {
                const match: GeneratedMatch = {
                    tournamentName: data.tournamentName,
                    game: selectedGame.name,
                    matchName: `${roundName} - Match ${i + 1}`,
                    matchType: data.matchType,
                    player1: [],
                    player2: [],
                    player1Placeholder: `Winner of ${previousRoundMatches[i*2].matchName}`,
                    player2Placeholder: `Winner of ${previousRoundMatches[i*2+1].matchName}`,
                    status: 'draft',
                    winnerId: null,
                    score: { player1: 0, player2: 0 }
                };
                currentRoundMatches.push(match);
            }
            tournamentRounds.push(currentRoundMatches);
            previousRoundMatches = currentRoundMatches;
        }
        setGeneratedTournament(tournamentRounds);
    }
    setIsGenerating(false);
  };
  
   const handlePlayerSwap = (roundIndex: number, matchIndex: number, playerSlot: 'player1' | 'player2', teamIndex: number, newPlayerId: string) => {
        const newTournament = [...generatedTournament];
        const match = newTournament[roundIndex][matchIndex];
        const newPlayer = players.find(p => p.id === newPlayerId);
        if (!newPlayer) return;

        const currentSlotPlayer = match[playerSlot][teamIndex];

        // Find if the newPlayer is already in this match
        let otherSlot: 'player1' | 'player2' | null = null;
        let otherIndex = -1;

        if (match.player1.some((p, i) => { if (p.id === newPlayerId) { otherIndex = i; return true; } return false; })) {
            otherSlot = 'player1';
        } else if (match.player2.some((p, i) => { if (p.id === newPlayerId) { otherIndex = i; return true; } return false; })) {
            otherSlot = 'player2';
        }

        if (otherSlot && otherIndex !== -1) {
            // It's a swap within the same match
            const otherSlotPlayer = match[otherSlot][otherIndex];
            match[otherSlot][otherIndex] = currentSlotPlayer;
            match[playerSlot][teamIndex] = otherSlotPlayer;
        } else {
            // It's a simple replacement (player is from outside this match)
            match[playerSlot][teamIndex] = newPlayer;
        }
        
        setGeneratedTournament(newTournament);
    };

  const handleCreateTournament = async () => {
    if (generatedTournament.length === 0) return;
    
    setIsCreating(true);
    try {
      const allMatches = generatedTournament.flat();
      const gameInfo = games.find(g => g.id === watch('gameId'));
      if (!gameInfo) throw new Error("Selected game not found.");
      
      await addMatches(allMatches, gameInfo.name, tournamentName, matchType);
      toast({
        title: 'Tournament Created!',
        description: `${allMatches.length} matches across ${generatedTournament.length} rounds have been created.`
      });
      onMatchesCreated();
      setGeneratedTournament([]);
      setSelectedPlayerIds([]);
      setValue('tournamentName', '');
      setValue('branch', []);
      setValue('numPlayers', '0');
      setValue('matchType', '');
      setValue('gameId', '');
    } catch (error: any) {
      toast({
        title: 'Error Creating Tournament',
        description: error.message || 'An unknown error occurred.',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };


  const filteredBranches = React.useMemo(() => 
     branches.filter(b => b.toLowerCase().includes(branchSearch.toLowerCase()))
  , [branchSearch]);

  const numPlayersOptions = [2, 4, 8, 16, 32, 64, 128];
  
  const teamSize = getTeamSize(matchType);
  const totalPlayersToSelect = matchType === 'Battle Royale' ? 0 : numPlayers * teamSize;


  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onGenerateTournament)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
                 <Label>Branches</Label>
                 <Controller
                    name="branch"
                    control={control}
                    render={({ field }) => (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start font-normal">
                                    <GitBranch className="mr-2 h-4 w-4" />
                                    {field.value?.length > 0 ? field.value.join(', ') : 'Select branches'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                               <div className="flex flex-col gap-2 p-2">
                                <Input 
                                  placeholder="Search branches..." 
                                  value={branchSearch}
                                  onChange={e => setBranchSearch(e.target.value)}
                                  className="mb-2"
                                />
                                <ScrollArea className="max-h-40">
                                  {filteredBranches.map(branch => (
                                      <Label key={branch} className="flex items-center gap-3 font-normal text-lg">
                                          <Checkbox
                                              className="h-4 w-4"
                                              checked={field.value?.includes(branch)}
                                              onCheckedChange={(checked) => {
                                                  const newValue = checked
                                                      ? [...(field.value || []), branch]
                                                      : (field.value || []).filter(v => v !== branch);
                                                  field.onChange(newValue);
                                              }}
                                          />
                                          {branch}
                                      </Label>
                                  ))}
                                </ScrollArea>
                               </div>
                            </PopoverContent>
                        </Popover>
                    )}
                 />
                 {errors.branch && <p className="text-sm text-destructive">{errors.branch.message}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="gameId">Game Name</Label>
                <Controller
                    name="gameId"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger id="gameId">
                                <SelectValue placeholder="Select a game" />
                            </SelectTrigger>
                            <SelectContent>
                                {games.length > 0 ? (
                                    games.map((game) => (
                                        <SelectItem key={game.id} value={game.id}>
                                            {game.name}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="none" disabled>No games found</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    )}
                />
                {errors.gameId && <p className="text-sm text-destructive">{errors.gameId.message}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="tournamentName">Tournament Name</Label>
                 <Input 
                    id="tournamentName"
                    placeholder="e.g. Carrom Female 2025"
                    {...register('tournamentName')}
                 />
                {errors.tournamentName && <p className="text-sm text-destructive">{errors.tournamentName.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="matchType">Match Type</Label>
                <Controller
                    name="matchType"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger id="matchType">
                                <SelectValue placeholder="Select match type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1v1">1 vs 1</SelectItem>
                                <SelectItem value="2v2">2 vs 2</SelectItem>
                                <SelectItem value="4v4">4 vs 4</SelectItem>
                                <SelectItem value="Battle Royale">Battle Royale</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
                 {errors.matchType && <p className="text-sm text-destructive">{errors.matchType.message}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="numPlayers">Number of Teams/Players</Label>
                <Controller
                    name="numPlayers"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value} disabled={matchType === 'Battle Royale'}>
                            <SelectTrigger id="numPlayers">
                                <SelectValue placeholder={matchType === 'Battle Royale' ? 'All selected players' : 'Select count'} />
                            </SelectTrigger>
                            <SelectContent>
                                {numPlayersOptions.map(num => 
                                    <SelectItem key={num} value={String(num)}>{num} {matchType === '1v1' ? 'Players' : 'Teams'}</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    )}
                />
                 {errors.numPlayers && <p className="text-sm text-destructive">{errors.numPlayers.message}</p>}
            </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setIsPlayerSelectionOpen(true)} disabled={!selectedBranches || selectedBranches.length === 0 || (matchType !== 'Battle Royale' && numPlayersRaw === '0') || !matchType}>
                <UserCheck className="mr-2 h-4 w-4" />
                Select Players ({selectedPlayerIds.length})
            </Button>
            <Button type="submit" disabled={isGenerating} className="w-full sm:w-auto">
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shuffle className="mr-2 h-4 w-4" />}
              Generate Tournament
            </Button>
        </div>
      </form>
      
      <PlayerSelectionDialog
        open={isPlayerSelectionOpen}
        onOpenChange={setIsPlayerSelectionOpen}
        players={playersInSelectedBranches}
        selectedPlayerIds={selectedPlayerIds}
        onConfirm={setSelectedPlayerIds}
        numPlayersToSelect={totalPlayersToSelect}
      />

      {generatedTournament.length > 0 && (
        <div className="space-y-6">
            <Separator />
            <h3 className="text-xl font-bold flex items-center gap-2">
                <Users /> Generated Tournament Bracket
            </h3>
            {generatedTournament.map((round, roundIndex) => (
                <div key={roundIndex} className="space-y-3">
                    <h4 className="font-semibold text-lg">{getRoundName(roundIndex, generatedTournament.length)} ({round.length} matches)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {round.map((match, matchIndex) => (
                            <div key={matchIndex} className="border rounded-md p-3 bg-muted/50 space-y-2">
                                <p className="font-bold text-sm mb-2">{match.matchName}</p>
                                {match.allPlayers ? (
                                   <p className="font-semibold">Battle Royale ({match.allPlayers.length} players)</p>
                                ) : (
                                    <div className="space-y-1">
                                        <div>
                                            {match.player1.map((p, teamIndex) => (
                                                <div key={p.id}>
                                                  {settings?.allowBracketEditing ? (
                                                    <Select
                                                        defaultValue={p.id}
                                                        onValueChange={(newPlayerId) => handlePlayerSwap(roundIndex, matchIndex, 'player1', teamIndex, newPlayerId)}
                                                    >
                                                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            {selectedPlayersFull.map(player => <SelectItem key={player.id} value={player.id}>{player.name}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                  ) : (
                                                    <PlayerListDisplay players={[p]} />
                                                  )}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="font-sans font-bold text-center text-xs py-1">vs</div>
                                        <div>
                                            {match.player2.map((p, teamIndex) => (
                                                <div key={p.id}>
                                                  {settings?.allowBracketEditing ? (
                                                     <Select
                                                        defaultValue={p.id}
                                                        onValueChange={(newPlayerId) => handlePlayerSwap(roundIndex, matchIndex, 'player2', teamIndex, newPlayerId)}
                                                    >
                                                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            {selectedPlayersFull.map(player => <SelectItem key={player.id} value={player.id}>{player.name}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                  ) : (
                                                    <PlayerListDisplay players={[p]} />
                                                  )}
                                                </div>
                                            ))}
                                        </div>
                                        {(match.player1Placeholder || match.player2Placeholder) && (
                                            <>
                                                <PlayerListDisplay players={[]} placeholder={match.player1Placeholder} />
                                                <div className="font-sans font-bold text-center text-xs py-1">vs</div>
                                                <PlayerListDisplay players={[]} placeholder={match.player2Placeholder} />
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
             <div className="flex items-center gap-4 pt-4">
                <Button onClick={handleCreateTournament} disabled={isCreating}>
                  {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sword className="mr-2 h-4 w-4" />}
                  Create Tournament
                </Button>
             </div>
        </div>
      )}
    </div>
  );
}
