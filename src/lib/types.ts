

import { z } from 'zod';

export type Player = {
  id: string; // This will be the document ID from Firestore
  employeeId: string;
  email: string;
  name: string;
  mobile?: string;
  branch: string;
  department: string;
  designation: string;
  joiningDate: string;
  imageUrl?: string;
  isAdmin: boolean;
  // Stats for group stage view
  played?: number;
  wins?: number;
  losses?: number;
  draws?: number;
  points?: number;
};

export type Game = {
  id: string;
  name: string;
};

export type Matchup = {
  player1: string; // email
  player2: string; // email
  reason: string;
}

export type Match = {
  id:string;
  eventId?: string; // Link to the event
  tournamentName: string; // e.g. "Dhanmondi Carrom Championship 2024"
  game: string; // e.g. "Carrom"
  matchName: string; // e.g. "Round 1 - Match 1" or "Group A - Match 1"
  matchType: string;
  tournamentType: 'Knockout' | 'Group Stage';
  groupName?: string; // e.g., "Group A"
  player1: Player[]; // Now an array to support teams
  player2: Player[]; // Now an array to support teams
  player1Placeholder?: string;
  player2Placeholder?: string;
  allPlayers?: Player[]; // For battle-royale style matches
  winnerId: string | null; // Can be a player ID or a team ID (e.g., player1[0].id)
  score: { player1: number; player2: number };
  status: 'upcoming' | 'ongoing' | 'finished' | 'cancelled' | 'draft';
  date: Date | null;
  startTime?: string;
  endTime?: string;
  isDatePublished: boolean;
};

export type Round = {
  id: string;
  name: string;
  matches: Match[];
};

export type Tournament = {
  id: string;
  name: string;
  game: string;
  branch: string;
  rounds: Round[];
  tournamentType: 'Knockout' | 'Group Stage';
};

// Represents the structure of the uploaded JSON data for employees
export type EmployeeUploadData = {
  id?: number;
  employeeId: string;
  name: string;
  email: string;
  mobile?: string;
  joiningDate: string;
  designation: string;
  branch: string;
  department: string;
  imageUrl: string | null;
};

// Represents the structure for public-facing settings
export type PublicSettings = {
  visibleStatuses: {
    [key in Match['status']]: boolean;
  };
  allowBracketEditing: boolean;
  primaryColor?: string;
  showMobileNumber?: boolean;
  requireLoginToView?: boolean;
};

// Schemas for AI Flow
// Define the schema for the input of the matchup suggestion flow.
export const SuggestMatchupsInputSchema = z.object({
  gameType: z.string().describe('The type of game for which to suggest matchups (e.g., "Football", "Chess").'),
  branch: z.string().describe('The branch from which to select players.'),
  numMatchups: z.number().int().positive().describe('The number of matchups to suggest.'),
});
export type SuggestMatchupsInput = z.infer<typeof SuggestMatchupsInputSchema>;


// Define the schema for a single suggested matchup.
const MatchupSchema = z.object({
    player1: z.string().describe("The name of the first player."),
    player2: z.string().describe("The name of the second player."),
    reason: z.string().describe("The reason for suggesting this matchup (e.g., skill level, rivalry)."),
});

// Define the schema for the output of the matchup suggestion flow.
export const SuggestMatchupsOutputSchema = z.object({
  matchups: z.array(MatchupSchema).describe('An array of suggested matchups.'),
});
export type SuggestMatchupsOutput = z.infer<typeof SuggestMatchupsOutputSchema>;


// === Event Management Types ===

export type Location = {
  lat: number;
  lng: number;
  label: string;
};

export type ProgramRole = {
  id: string; // unique id for the role within a program, e.g. a UUID
  roleName: string;
  priority: number; // 1-5
  assignedEmployees: Pick<Player, 'id' | 'name' | 'email' | 'imageUrl'>[];
};

export type Program = {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  startLocation: Location;
  endLocation?: Location | null;
  roles: ProgramRole[];
};

export type Event = {
  id: string;
  name: string;
  description?: string;
  startTime: Date;
  endTime: Date;
};

// === Room Planner Types ===
export type AssignedEmployee = Pick<Player, 'id' | 'name' | 'email' | 'imageUrl' | 'branch' | 'designation'>;

export type Room = {
  id: string;
  name: string; // e.g., "Room 101", "Villa A"
  capacity: number;
  assignedEmployees: AssignedEmployee[];
  eventId: string; 
};

// === Group Management Types ===
export type TeamMember = Pick<Player, 'id' | 'name' | 'email' | 'imageUrl' | 'branch' | 'designation'>;

export type Team = {
  id: string;
  eventId: string;
  name: string;
  leader: TeamMember;
  managers: TeamMember[];
  members: TeamMember[];
};

    