

/**
 * @fileoverview
 * This file contains all the service functions for interacting with Firebase Firestore.
 * It handles all data fetching and manipulation for players, matches, and other collections.
 */

import { db } from './firebase';
import { collection, onSnapshot, doc, setDoc, addDoc, writeBatch, deleteDoc, updateDoc, query, getDocs, where, getDoc } from 'firebase/firestore';
import type { Player, Match, EmployeeUploadData, Game, PublicSettings } from './types';


// === Player Services ===

/**
 * Fetches all players from the Firestore 'employees' collection in real-time.
 * @param callback - Function to call with the player data.
 * @returns Unsubscribe function.
 */
export function getPlayers(callback: (players: Player[]) => void): () => void {
  try {
    const employeesCollection = collection(db, 'employees');
    const q = query(employeesCollection);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        callback([]);
        return;
      }
      const players = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Player));
      callback(players);
    });

    return unsubscribe;
  } catch (error) {
    console.error("Error fetching players in real-time:", error);
    throw error;
  }
}

/**
 * Adds a new player to the Firestore 'employees' collection.
 * @param playerData - The player data to add (excluding the ID).
 * @returns The newly created Player object with its Firestore ID.
 */
export async function addPlayer(playerData: Omit<Player, 'id'>): Promise<Player> {
   try {
     const newPlayerDoc = await addDoc(collection(db, "employees"), playerData);
     return {
      ...playerData,
      id: newPlayerDoc.id
     };
   } catch(error) {
      console.error("Error adding player: ", error);
      throw error;
   }
}

/**
 * Updates an existing player in the Firestore 'employees' collection.
 * @param playerId The ID of the player to update.
 * @param playerData The partial player data to update.
 */
export async function updatePlayer(playerId: string, playerData: Partial<Omit<Player, 'id' | 'isAdmin' | 'email'>>): Promise<void> {
  try {
    const playerRef = doc(db, 'employees', playerId);
    await updateDoc(playerRef, playerData);
  } catch (error) {
    console.error("Error updating player: ", error);
    throw error;
  }
}


/**
 * Deletes a player from the Firestore 'employees' collection.
 * @param playerId - The ID of the player to delete.
 */
export async function removePlayer(playerId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'employees', playerId));
  } catch(error) {
    console.error("Error removing player: ", error);
    throw error;
  }
}

/**
 * Imports a batch of employees from a JSON file into Firestore.
 * @param employees - An array of employee data from the uploaded JSON.
 */
export async function importEmployees(employees: EmployeeUploadData[]): Promise<{success: boolean; count: number; error?: string}> {
  const batch = writeBatch(db);
  let count = 0;

  try {
    const q = query(collection(db, 'employees'));
    const existingPlayersSnapshot = await getDocs(q);
    const existingEmails = new Set(existingPlayersSnapshot.docs.map(d => d.data().email));

    employees.forEach(emp => {
      const userEmail = emp.user_email;
      if (!userEmail) {
        console.warn(`Skipping employee with missing email.`);
        return;
      }
      
      if (existingEmails.has(userEmail)) {
          return;
      }

      const docRef = doc(collection(db, 'employees'));
      const newPlayer: Omit<Player, 'id'> = {
        employeeId: emp.employeeId,
        name: emp.name,
        email: userEmail,
        branch: emp.branch,
        department: emp.department,
        designation: emp.designation,
        joiningDate: emp.joiningDate,
        imageUrl: emp.user_profilePicture || `https://placehold.co/100x100.png`,
        isAdmin: userEmail === 'admin@echologyx.com',
      };
      batch.set(docRef, newPlayer);
      count++;
    });

    await batch.commit();
    return { success: true, count };
  } catch(error: any) {
    console.error("Error importing employees: ", error);
    return { success: false, count: 0, error: error.message };
  }
}

// === Match Services ===

/**
 * Adds new matches to the Firestore 'matches' collection.
 * This can be a single match or all matches for a tournament.
 * @param newMatches An array of match objects to be added.
 */
export async function addMatches(newMatches: Omit<Match, 'id' | 'date' | 'isDatePublished' | 'startTime' | 'endTime'>[]): Promise<void> {
    const batch = writeBatch(db);

    newMatches.forEach(match => {
        const matchRef = doc(collection(db, 'matches'));
        const newMatchData: Omit<Match, 'id'> = {
          ...match,
          date: null,
          startTime: null,
          endTime: null,
          isDatePublished: false,
        };
        batch.set(matchRef, newMatchData);
    });

    await batch.commit();
}


/**
 * Fetches all matches from the Firestore 'matches' collection in real-time.
 * @param callback - Function to be called with the matches data.
 * @returns Unsubscribe function.
 */
export function getMatches(callback: (matches: Match[]) => void): () => void {
    try {
        const matchesCollection = collection(db, 'matches');
        const q = query(matchesCollection);
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                callback([]);
                return;
            }
            const matches = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Match));
            callback(matches);
        });
        return unsubscribe;

    } catch (error) {
        console.error("Error fetching matches in real-time:", error);
        throw error;
    }
}


const findNextMatchForWinner = async (matchName: string, game: string): Promise<{ matchId: string, playerSlot: 'player1' | 'player2' } | null> => {
    const matchesRef = collection(db, "matches");
    
    // Check if any match has this matchName as a placeholder
    const q1 = query(matchesRef, where("player1Placeholder", "==", `Winner of ${matchName}`), where("game", "==", game));
    const snapshot1 = await getDocs(q1);
    if (!snapshot1.empty) {
        return { matchId: snapshot1.docs[0].id, playerSlot: 'player1' };
    }

    const q2 = query(matchesRef, where("player2Placeholder", "==", `Winner of ${matchName}`), where("game", "==", game));
    const snapshot2 = await getDocs(q2);
    if (!snapshot2.empty) {
        return { matchId: snapshot2.docs[0].id, playerSlot: 'player2' };
    }

    return null;
}

/**
 * Updates a match in Firestore, and advances winner to the next round if applicable.
 * @param matchId - The ID of the match to update.
 * @param updatedData - An object containing the fields to update.
 */
export async function updateMatch(matchId: string, updatedData: Partial<Match>): Promise<void> {
  const matchRef = doc(db, 'matches', matchId);
  await updateDoc(matchRef, updatedData);

  // If a winner is being set, try to advance them.
  if (updatedData.winnerId && updatedData.status === 'finished') {
    const matchDoc = await getDoc(matchRef);
    if (!matchDoc.exists()) return;

    const matchData = matchDoc.data() as Match;

    const nextMatchInfo = await findNextMatchForWinner(matchData.matchName, matchData.game);
    
    if (nextMatchInfo) {
      let winnerPlayers: Player[] = [];

      if (matchData.allPlayers) {
         // Handle battle royale winner
        const winner = matchData.allPlayers.find(p => p.id === updatedData.winnerId);
        if (winner) {
            winnerPlayers = [winner];
        }
      } else {
         // Handle bracketed winner
        const winnerIsPlayer1 = matchData.player1.some(p => p.id === updatedData.winnerId);
         if (winnerIsPlayer1) {
            winnerPlayers = matchData.player1;
        } else {
            winnerPlayers = matchData.player2;
        }
      }


      if (winnerPlayers.length > 0) {
        const nextMatchRef = doc(db, 'matches', nextMatchInfo.matchId);
        
        const placeholderKey = `${nextMatchInfo.playerSlot}Placeholder`;

        const updatePayload = {
          [nextMatchInfo.playerSlot]: winnerPlayers.map(p => ({...p})), // Ensure plain objects for Firestore
          [placeholderKey]: "" 
        };
        await updateDoc(nextMatchRef, updatePayload);
      }
    }
  }
}

/**
 * Deletes all matches for a specific tournament.
 * @param tournamentName - The name of the tournament (game name) to delete.
 */
export async function deleteMatchesByTournament(tournamentName: string): Promise<void> {
    const matchesCollection = collection(db, 'matches');
    const q = query(matchesCollection, where('game', '==', tournamentName));
    const matchesSnapshot = await getDocs(q);
    const batch = writeBatch(db);

    matchesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();
}


// === Game Services ===

/**
 * Fetches all games from the Firestore 'games' collection in real-time.
 * @param callback - Function to call with the games data.
 * @returns Unsubscribe function.
 */
export function getGames(callback: (games: Game[]) => void): () => void {
  try {
    const gamesCollection = collection(db, 'games');
    const q = query(gamesCollection);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        // Seed default games if the collection is empty
        const defaultGames = [
          { name: 'Football' }, { name: 'Carrom' }, { name: '8 Ball Pool' },
          { name: 'Ludo' }, { name: 'Table Tennis' }, { name: 'PUBG' }, { name: 'Chess' }
        ];
        const batch = writeBatch(db);
        defaultGames.forEach(game => {
            const docRef = doc(collection(db, 'games'));
            batch.set(docRef, game);
        });
        batch.commit().then(() => console.log('Default games seeded.'));
        return;
      }
      const games = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Game));
      callback(games);
    });

    return unsubscribe;
  } catch (error) {
    console.error("Error fetching games in real-time:", error);
    throw error;
  }
}

/**
 * Adds a new game to the Firestore 'games' collection.
 * @param gameName - The name of the game to add.
 */
export async function addGame(gameName: string): Promise<void> {
  if (!gameName) throw new Error('Game name cannot be empty.');
  // Check for duplicates
  const q = query(collection(db, 'games'), where("name", "==", gameName));
  const existing = await getDocs(q);
  if (!existing.empty) {
      throw new Error(`Game "${gameName}" already exists.`);
  }
  await addDoc(collection(db, "games"), { name: gameName });
}

/**
 * Deletes a game from the Firestore 'games' collection.
 * @param gameId - The ID of the game to delete.
 */
export async function deleteGame(gameId: string): Promise<void> {
  await deleteDoc(doc(db, 'games', gameId));
}


// === Settings Services ===

/**
 * Fetches the public settings from Firestore in real-time.
 * @param callback - Function to call with the settings data.
 * @returns Unsubscribe function.
 */
export function getPublicSettings(callback: (settings: PublicSettings | null) => void): () => void {
  try {
    const settingsDoc = doc(db, 'settings', 'public');
    
    const unsubscribe = onSnapshot(settingsDoc, (doc) => {
      if (doc.exists()) {
        callback(doc.data() as PublicSettings);
      } else {
        // If no settings exist, create a default one.
        const defaultSettings: PublicSettings = {
          visibleStatuses: {
            draft: true,
            upcoming: true,
            ongoing: true,
            finished: true,
            cancelled: true,
          }
        };
        setDoc(settingsDoc, defaultSettings).then(() => callback(defaultSettings));
      }
    });

    return unsubscribe;
  } catch (error) {
    console.error("Error fetching public settings in real-time:", error);
    throw error;
  }
}

/**
 * Updates the public settings in Firestore.
 * @param settings - The public settings object to save.
 */
export async function updatePublicSettings(settings: PublicSettings): Promise<void> {
  const settingsRef = doc(db, 'settings', 'public');
  await setDoc(settingsRef, settings, { merge: true }); // Use setDoc with merge to create if not exists
}

    

    