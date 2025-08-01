
'use server';
/**
 * @fileOverview An AI flow for suggesting matchups.
 *
 * - suggestMatchups - A function that handles matchup suggestions.
 */

import { ai } from '@/ai/genkit';
import { getPlayers } from '@/lib/services';
import type { Player } from '@/lib/types';
import { SuggestMatchupsInputSchema, SuggestMatchupsOutputSchema, type SuggestMatchupsInput, type SuggestMatchupsOutput } from '@/lib/types';
import { z } from 'genkit';


// The main function to be called from the UI.
export async function suggestMatchups(input: SuggestMatchupsInput): Promise<SuggestMatchupsOutput> {
  // Fetch players from the specified branch.
  const allPlayers = await new Promise<Player[]>((resolve) => {
    const unsub = getPlayers((players) => {
      const filteredPlayers = players.filter(p => p.branch === input.branch);
      resolve(filteredPlayers);
      unsub();
    });
  });
  
  if (allPlayers.length < 2) {
    throw new Error('Not enough players in the selected branch to suggest a matchup.');
  }

  const playerNames = allPlayers.map(p => p.name);

  // Call the Genkit flow with the provided input and the fetched player names.
  return suggestMatchupsFlow({ ...input, playerNames });
}


// Define the prompt for the AI model.
const suggestMatchupsPrompt = ai.definePrompt({
    name: 'suggestMatchupsPrompt',
    // The prompt now also receives the list of player names.
    input: { schema: SuggestMatchupsInputSchema.extend({ playerNames: z.array(z.string()) }) },
    output: { schema: SuggestMatchupsOutputSchema },
    prompt: `You are a tournament organizer. Your task is to suggest {{numMatchups}} interesting matchups for a {{gameType}} tournament.
    
    The players are from the {{branch}} branch.
    
    Here is the list of available players:
    {{#each playerNames}}
    - {{{this}}}
    {{/each}}
    
    Please provide a list of matchups with a brief reason for each suggestion. The reason should be compelling, like a rivalry, similar skill level, or an interesting contrast in style.
    Avoid suggesting the same player in multiple matchups if possible.
    `,
});


// Define the Genkit flow.
const suggestMatchupsFlow = ai.defineFlow(
  {
    name: 'suggestMatchupsFlow',
    inputSchema: SuggestMatchupsInputSchema.extend({ playerNames: z.array(z.string()) }),
    outputSchema: SuggestMatchupsOutputSchema,
  },
  async (input) => {
    // Generate the response from the AI model.
    const { output } = await suggestMatchupsPrompt(input);
    return output!;
  }
);
