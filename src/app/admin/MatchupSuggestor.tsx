'use client';

import * as React from 'react';
import { suggestMatchups } from '@/ai/flows/suggest-matchups';
import type { SuggestMatchupsOutput, SuggestMatchupsInput } from '@/ai/flows/suggest-matchups';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { games, branches } from '@/lib/placeholder-data';
import { Bot, AlertCircle, Sparkles, Users, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addMatches } from '@/lib/services';
import { useAuth } from '@/hooks/use-auth';

type FormState = {
  matchups?: SuggestMatchupsOutput['matchups'];
  gameType?: string;
  message: string;
  issues?: string[];
  fields?: {
      gameType: string;
      branch: string;
      numMatchups: string;
  };
}


export function MatchupSuggestor() {
  const [state, setState] = React.useState<FormState>({ message: '' });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSuggestMatchups = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsSubmitting(true);
      setState({ message: '' }); // Clear previous state

      const formData = new FormData(event.currentTarget);
      const gameType = formData.get('gameType') as string;
      const branch = formData.get('branch') as string;
      const numMatchups = formData.get('numMatchups') as string;

      try {
          const input: SuggestMatchupsInput = {
              gameType,
              branch,
              numMatchups: parseInt(numMatchups, 10),
          };

          const result = await suggestMatchups(input);
          
          if (result && result.matchups) {
              setState({ matchups: result.matchups, gameType, message: 'Suggestions generated successfully.'});
          } else {
              setState({ message: 'The AI did not return any matchups. Please try again.' });
          }

      } catch (error: any) {
          console.error('Error suggesting matchups:', error);
          setState({ message: 'An error occurred while suggesting matchups.', issues: [error.message || 'Unknown error'] });
      } finally {
          setIsSubmitting(false);
      }
  };


  const handleCreateMatches = async () => {
    if (!user) {
      toast({ title: 'Authentication Error', description: 'You must be logged in to create matches.', variant: 'destructive' });
      return;
    }
    if (state.matchups) {
      try {
        await addMatches(state.matchups.map(m => ({
          player1: [{ name: m.player1, id: m.player1.toLowerCase().replace(/\s/g, '-') }], // Dummy player object
          player2: [{ name: m.player2, id: m.player2.toLowerCase().replace(/\s/g, '-') }],
        })), state.gameType || '', 'AI Suggested Round', '1v1');
        toast({
          title: 'Matches Created',
          description: `${state.matchups.length} new matches have been added.`,
        });
         // Clear matchups after creation
        setState({ message: 'Matches created successfully!' });
      } catch (error: any) {
         console.error(error);
         toast({ title: 'Error', description: `Failed to create matches: ${error.message}`, variant: 'destructive' });
      }
    }
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Bot className="h-6 w-6 text-primary" />
                AI Matchup Suggestor
            </CardTitle>
            <CardDescription>
                Use AI to generate fair and interesting matchups based on player skills and history.
                This is a separate tool from the main tournament creator.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSuggestMatchups} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="gameType">Game Type</Label>
                    <Select name="gameType" required>
                    <SelectTrigger id="gameType">
                        <SelectValue placeholder="Select a game" />
                    </SelectTrigger>
                    <SelectContent>
                        {games.map((game) => (
                        <SelectItem key={game.id} value={game.name}>
                            {game.name}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="branch">Branch</Label>
                    <Select name="branch" required>
                    <SelectTrigger id="branch">
                        <SelectValue placeholder="Select a branch" />
                    </SelectTrigger>
                    <SelectContent>
                        {branches.map((branch) => (
                        <SelectItem key={branch} value={branch}>
                            {branch}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="numMatchups">Number of Matchups</Label>
                    <Input
                    id="numMatchups"
                    name="numMatchups"
                    type="number"
                    min="1"
                    max="10"
                    defaultValue="3"
                    required
                    />
                </div>
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? (
                    <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Thinking...
                    </>
                ) : (
                    <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Suggest Matchups
                    </>
                )}
                </Button>
            </form>
        </CardContent>
      </Card>

      {state.issues && state.issues.length > 0 && (
         <Alert variant="destructive">
           <AlertCircle className="h-4 w-4" />
           <AlertTitle>Error</AlertTitle>
           <AlertDescription>
            <ul>
                {state.issues.map((issue) => (
                    <li key={issue}>- {issue}</li>
                ))}
            </ul>
           </AlertDescription>
         </Alert>
       )}

      {state.matchups && state.matchups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                Suggested Matchups
            </CardTitle>
            <CardDescription>Here are the AI-powered suggestions. You can create these as one-off matches.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {state.matchups.map((matchup, index) => (
              <div key={index} className="p-4 border rounded-lg bg-secondary/50">
                <p className="font-semibold text-primary">
                  {matchup.player1} vs. {matchup.player2}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{matchup.reason}</p>
              </div>
            ))}
          </CardContent>
           <CardFooter>
            <Button onClick={handleCreateMatches}>Create these matches</Button>
          </CardFooter>
        </Card>
      )}

      {!state.matchups && state.message && state.message.length > 0 && !state.issues?.length && (
         <Alert>
           <AlertCircle className="h-4 w-4" />
           <AlertTitle>Notice</AlertTitle>
           <AlertDescription>
            {state.message}
           </AlertDescription>
         </Alert>
      )}
    </div>
  );
}
