/**
 * @fileoverview
 * Utility functions for processing tournament data for bracket visualization.
 * This file transforms Firestore match data into a format suitable for a custom bracket component.
 */
import type { Match as DBMatch } from './types';

export interface BracketRound {
    name: string;
    matches: DBMatch[];
}

/**
 * Groups matches by their round name (e.g., "Round 1", "Semi-Finals").
 * @param dbMatches - An array of match objects from Firestore.
 * @returns An array of BracketRound objects.
 */
export const groupMatchesByRound = (dbMatches: DBMatch[]): BracketRound[] => {
  if (!dbMatches || dbMatches.length === 0) {
    return [];
  }

  const grouped: { [key: string]: DBMatch[] } = {};

  dbMatches.forEach((match) => {
    // Extract the round name from the matchName, e.g., "Round 1" from "Round 1 - Match 3"
    const roundName = match.matchName.split(' - ')[0] || 'Uncategorized';
    if (!grouped[roundName]) {
      grouped[roundName] = [];
    }
    grouped[roundName].push(match);
  });
  
  // Predefined sort order for tournament rounds
  const roundOrder = [
    'Quarter-Finals',
    'Semi-Finals',
    'Final'
  ];

  const getRoundOrder = (name: string): number => {
      const lowerCaseName = name.toLowerCase();
      const num = parseInt(lowerCaseName.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(num)) {
          return num; // 'Round 1' becomes 1, 'Round 2' becomes 2
      }
      const indexInOrder = roundOrder.findIndex(r => lowerCaseName.startsWith(r.toLowerCase().split('-')[0]));
      // Start special rounds after a high number to ensure they come after numbered rounds
      return indexInOrder !== -1 ? 100 + indexInOrder : 999;
  };

  const roundKeys = Object.keys(grouped);

  roundKeys.sort((a, b) => {
    return getRoundOrder(a) - getRoundOrder(b);
  });

  return roundKeys.map(roundKey => {
    const roundMatches = grouped[roundKey];
    
    // Sort matches within the round by match number
    roundMatches.sort((a, b) => {
      const matchNumA = parseInt(a.matchName.split(' - Match ')[1] || '0');
      const matchNumB = parseInt(b.matchName.split(' - Match ')[1] || '0');
      return matchNumA - matchNumB;
    });

    return {
      name: roundKey,
      matches: roundMatches,
    };
  });
};
