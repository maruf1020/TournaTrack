

/**
 * @fileoverview
 * This file contains all the service functions for interacting with Firebase Firestore.
 * It handles all data fetching and manipulation for players, matches, and other collections.
 */

import { db } from './firebase';
import { collection, onSnapshot, doc, setDoc, addDoc, writeBatch, deleteDoc, updateDoc, query, getDocs, where, getDoc, Timestamp, collectionGroup } from 'firebase/firestore';
import type { Player, Match, EmployeeUploadData, Game, PublicSettings, Event, Program, Room, Team } from './types';


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
 * Fetches all players from the Firestore 'employees' collection once.
 * @returns A promise that resolves with an array of players.
 */
export async function getPlayersOnce(): Promise<Player[]> {
    try {
        const employeesCollection = collection(db, 'employees');
        const q = query(employeesCollection);
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Player));
    } catch (error) {
        console.error("Error fetching players once:", error);
        throw error;
    }
}

/**
 * Fetches a single player profile from Firestore by email.
 * @param email The email of the player to fetch.
 * @returns A promise that resolves with the Player object or null if not found.
 */
export async function getPlayerByEmail(email: string): Promise<Player | null> {
  try {
    const q = query(collection(db, 'employees'), where('email', '==', email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }
    const docData = snapshot.docs[0];
    return { id: docData.id, ...docData.data() } as Player;
  } catch (error) {
    console.error("Error fetching player by email:", error);
    return null;
  }
}

/**
 * Fetches a single player profile from Firestore by ID.
 * @param playerId The ID of the player to fetch.
 * @returns A promise that resolves with the Player object or null if not found.
 */
export async function getPlayerById(playerId: string): Promise<Player | null> {
  try {
    const playerRef = doc(db, 'employees', playerId);
    const playerSnap = await getDoc(playerRef);

    if (!playerSnap.exists()) {
      return null;
    }
    return { id: playerSnap.id, ...playerSnap.data() } as Player;
  } catch (error) {
    console.error("Error fetching player by ID:", error);
    return null;
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
export async function updatePlayer(playerId: string, playerData: Partial<Omit<Player, 'id' | 'email'>>): Promise<void> {
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
export async function importEmployees(employees: EmployeeUploadData[]): Promise<{success: boolean; count: number; errors?: string[]}> {
  const batch = writeBatch(db);
  let count = 0;
  const errors: string[] = [];

  try {
    const q = query(collection(db, 'employees'));
    const existingPlayersSnapshot = await getDocs(q);
    const existingEmails = new Set(existingPlayersSnapshot.docs.map(d => d.data().email));

    employees.forEach((emp, index) => {
      // Validation
      const requiredFields = ['employeeId', 'name', 'email', 'joiningDate', 'designation', 'branch', 'department'];
      const missingFields = requiredFields.filter(field => !emp[field as keyof EmployeeUploadData]);

      if (missingFields.length > 0) {
        errors.push(`Row ${index + 1} (Name: ${emp.name || 'N/A'}): Missing required fields: ${missingFields.join(', ')}.`);
        return;
      }
      
      const userEmail = emp.email;
      if (existingEmails.has(userEmail)) {
          // We can silently skip existing users or report it. Let's skip.
          return;
      }

      const docRef = doc(collection(db, 'employees'));
      const newPlayer: Omit<Player, 'id'> = {
        employeeId: emp.employeeId,
        name: emp.name,
        email: userEmail,
        mobile: emp.mobile || '',
        branch: emp.branch,
        department: emp.department,
        designation: emp.designation,
        joiningDate: emp.joiningDate,
        imageUrl: emp.imageUrl || `https://placehold.co/100x100.png`,
        isAdmin: userEmail === 'admin@echologyx.com',
      };
      batch.set(docRef, newPlayer);
      count++;
    });

    if (errors.length > 0) {
        return { success: false, count: 0, errors };
    }

    await batch.commit();
    return { success: true, count };
  } catch(error: any) {
    console.error("Error importing employees: ", error);
    return { success: false, count: 0, errors: [error.message] };
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

/**
 * Fetches all matches from the Firestore 'matches' collection once.
 * @returns A promise that resolves with an array of matches.
 */
export async function getMatchesOnce(): Promise<Match[]> {
    try {
        const matchesCollection = collection(db, 'matches');
        const q = query(matchesCollection);
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Match));
    } catch (error) {
        console.error("Error fetching matches once:", error);
        throw error;
    }
}


const findNextMatchForWinner = async (matchName: string, tournamentName: string): Promise<{ matchId: string, playerSlot: 'player1' | 'player2' } | null> => {
    const matchesRef = collection(db, "matches");
    const placeholder = `Winner of ${matchName}`;
    
    // Check if any match has this matchName as a placeholder
    const q1 = query(matchesRef, where("player1Placeholder", "==", placeholder), where("tournamentName", "==", tournamentName));
    const snapshot1 = await getDocs(q1);
    if (!snapshot1.empty) {
        return { matchId: snapshot1.docs[0].id, playerSlot: 'player1' };
    }

    const q2 = query(matchesRef, where("player2Placeholder", "==", placeholder), where("tournamentName", "==", tournamentName));
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

  // If a winner is being set for a knockout match, try to advance them.
  if (updatedData.winnerId && updatedData.status === 'finished') {
    const matchDoc = await getDoc(matchRef);
    if (!matchDoc.exists()) return;

    const matchData = matchDoc.data() as Match;

    // Only advance winners in Knockout tournaments
    if (matchData.tournamentType !== 'Knockout') return;

    const nextMatchInfo = await findNextMatchForWinner(matchData.matchName, matchData.tournamentName);
    
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
    const q = query(matchesCollection, where('tournamentName', '==', tournamentName));
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
        callback([]);
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
 * Fetches all games from the Firestore 'games' collection once.
 * @returns A promise that resolves with an array of games.
 */
export async function getGamesOnce(): Promise<Game[]> {
    try {
        const gamesCollection = collection(db, 'games');
        const q = query(gamesCollection);
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Game));
    } catch (error) {
        console.error("Error fetching games once:", error);
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
          },
          allowBracketEditing: false,
          primaryColor: '#ff6600',
          showMobileNumber: false,
          requireLoginToView: false,
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


// === Backup & Restore Services ===

const COLLECTIONS_TO_BACKUP = ['employees', 'matches', 'games', 'settings', 'events', 'rooms', 'teams'];

// Helper to serialize data, converting Timestamps to a specific object format
const serializeData = (data: any): any => {
    for (const key in data) {
        if (data[key] instanceof Timestamp) {
            data[key] = {
                _type: 'timestamp',
                value: data[key].toDate().toISOString()
            };
        } else if (data[key] instanceof Object) {
            serializeData(data[key]);
        }
    }
    return data;
};

// Helper to deserialize data, converting objects back to Timestamps
const deserializeData = (data: any): any => {
    for (const key in data) {
        if (data[key] && data[key]._type === 'timestamp') {
            data[key] = Timestamp.fromDate(new Date(data[key].value));
        } else if (data[key] instanceof Object) {
            deserializeData(data[key]);
        }
    }
    return data;
};


/**
 * Fetches all data from the specified collections for a full database backup.
 * @returns A JSON object containing all data.
 */
export async function exportFullDatabase(): Promise<any> {
    const backup: { [key: string]: any[] } = {};
    for (const collectionName of COLLECTIONS_TO_BACKUP) {
        const collectionRef = collection(db, collectionName);
        const snapshot = await getDocs(collectionRef);
        
        if (collectionName === 'events') {
            const eventsData = [];
            for (const eventDoc of snapshot.docs) {
                const eventData = eventDoc.data();
                const programsCollectionRef = collection(db, 'events', eventDoc.id, 'programs');
                const programsSnapshot = await getDocs(programsCollectionRef);
                const programs = programsSnapshot.docs.map(progDoc => ({
                    id: progDoc.id,
                    ...serializeData(progDoc.data())
                }));
                eventsData.push({ id: eventDoc.id, ...serializeData(eventData), programs });
            }
            backup[collectionName] = eventsData;
        } else {
             backup[collectionName] = snapshot.docs.map(doc => {
                const data = doc.data();
                return { id: doc.id, ...serializeData(data) };
            });
        }
    }
    return backup;
}

/**
 * Restores the database from a backup object. This is a destructive operation.
 * It will delete all existing data in the collections before importing.
 * @param backupData - The backup data object.
 */
export async function importFullDatabase(backupData: { [key: string]: any[] }): Promise<void> {
    // Step 1: Delete all existing documents in the collections
    for (const collectionName of COLLECTIONS_TO_BACKUP) {
        if (!backupData[collectionName]) continue; // Skip if collection not in backup
        
        // Handle subcollections for 'events'
        if (collectionName === 'events') {
             const eventsCollectionRef = collection(db, 'events');
             const existingEventsSnapshot = await getDocs(eventsCollectionRef);
             for(const eventDoc of existingEventsSnapshot.docs) {
                 const programsCollectionRef = collection(db, 'events', eventDoc.id, 'programs');
                 const programsSnapshot = await getDocs(programsCollectionRef);
                 if (!programsSnapshot.empty) {
                     const deleteProgramsBatch = writeBatch(db);
                     programsSnapshot.docs.forEach(doc => deleteProgramsBatch.delete(doc.ref));
                     await deleteProgramsBatch.commit();
                 }
             }
        }
        
        const collectionRef = collection(db, collectionName);
        const snapshot = await getDocs(collectionRef);
        if (snapshot.empty) continue;
        const deleteBatch = writeBatch(db);
        snapshot.docs.forEach(doc => deleteBatch.delete(doc.ref));
        await deleteBatch.commit();
    }
    
    // Step 2: Import new documents from the backup
    for (const collectionName of COLLECTIONS_TO_BACKUP) {
        const importBatch = writeBatch(db);
        if (backupData[collectionName]) {
            for (const docDataWithId of backupData[collectionName]) {
                const { id, programs, ...data } = docDataWithId;
                const deserialized = deserializeData(data);
                const docRef = doc(db, collectionName, id);
                importBatch.set(docRef, deserialized);

                // Handle subcollection for 'events'
                if (collectionName === 'events' && programs && Array.isArray(programs)) {
                    for (const programDataWithId of programs) {
                        const { id: programId, ...programData } = programDataWithId;
                        const deserializedProgram = deserializeData(programData);
                        const programRef = doc(db, 'events', id, 'programs', programId);
                        importBatch.set(programRef, deserializedProgram);
                    }
                }
            }
        }
         await importBatch.commit();
    }
}


// === Event Management Services ===

// --- Events ---

export function getEvents(callback: (events: Event[]) => void): () => void {
  const eventsCollection = collection(db, 'events');
  const q = query(eventsCollection);
  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        description: data.description || '',
        startTime: (data.startTime as Timestamp).toDate(),
        endTime: (data.endTime as Timestamp).toDate(),
      } as Event;
    });
    callback(events);
  });
}

export async function getEventsOnce(): Promise<Event[]> {
    const eventsCollection = collection(db, 'events');
    const q = query(eventsCollection);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.name,
            description: data.description || '',
            startTime: (data.startTime as Timestamp).toDate(),
            endTime: (data.endTime as Timestamp).toDate(),
        } as Event;
    });
}

export async function getEvent(eventId: string): Promise<Event | null> {
    const eventRef = doc(db, 'events', eventId);
    const eventSnap = await getDoc(eventRef);

    if (!eventSnap.exists()) {
        return null;
    }
    const data = eventSnap.data();
    return {
        id: eventSnap.id,
        name: data.name,
        description: data.description || '',
        startTime: (data.startTime as Timestamp).toDate(),
        endTime: (data.endTime as Timestamp).toDate(),
    } as Event;
}

export async function addEvent(eventData: Omit<Event, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'events'), {
    ...eventData,
    startTime: Timestamp.fromDate(eventData.startTime),
    endTime: Timestamp.fromDate(eventData.endTime),
  });
  return docRef.id;
}

export async function updateEvent(eventId: string, eventData: Partial<Omit<Event, 'id'>>): Promise<void> {
  const eventRef = doc(db, 'events', eventId);
  const dataToUpdate: { [key: string]: any } = { ...eventData };
  if (eventData.startTime) {
    dataToUpdate.startTime = Timestamp.fromDate(eventData.startTime);
  }
  if (eventData.endTime) {
    dataToUpdate.endTime = Timestamp.fromDate(eventData.endTime);
  }
  await updateDoc(eventRef, dataToUpdate);
}

export async function deleteEvent(eventId: string): Promise<void> {
  // Also delete all sub-collection programs
  const programsCollection = collection(db, 'events', eventId, 'programs');
  const programsSnapshot = await getDocs(programsCollection);
  const batch = writeBatch(db);
  programsSnapshot.forEach(doc => batch.delete(doc.ref));
  await batch.commit();

  await deleteDoc(doc(db, 'events', eventId));
}

// --- Programs ---

export function getProgramsForEvent(eventId: string, callback: (programs: Program[]) => void): () => void {
  const programsCollection = collection(db, 'events', eventId, 'programs');
  const q = query(programsCollection);
  return onSnapshot(q, (snapshot) => {
    const programs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            startTime: (data.startTime as Timestamp).toDate(),
            endTime: (data.endTime as Timestamp).toDate(),
        } as Program;
    });
    callback(programs);
  });
}

export async function getAllPrograms(): Promise<Program[]> {
    const programsCollectionGroup = collectionGroup(db, 'programs');
    const q = query(programsCollectionGroup);
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return [];
    }

    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            startTime: (data.startTime as Timestamp).toDate(),
            endTime: (data.endTime as Timestamp).toDate(),
        } as Program;
    });
}

export async function getProgramForEvent(eventId: string, programId: string): Promise<Program | null> {
    const programRef = doc(db, 'events', eventId, 'programs', programId);
    const programSnap = await getDoc(programRef);
    if (!programSnap.exists()) {
        return null;
    }
    const data = programSnap.data();
    return {
        id: programSnap.id,
        ...data,
        startTime: (data.startTime as Timestamp).toDate(),
        endTime: (data.endTime as Timestamp).toDate(),
    } as Program;
}

export async function addProgram(eventId: string, programData: Omit<Program, 'id'>): Promise<string> {
  const programsCollection = collection(db, 'events', eventId, 'programs');
  const docRef = await addDoc(programsCollection, {
    ...programData,
    startTime: Timestamp.fromDate(programData.startTime),
    endTime: Timestamp.fromDate(programData.endTime),
    endLocation: programData.endLocation === undefined ? null : programData.endLocation,
  });
  return docRef.id;
}

export async function updateProgram(eventId: string, programId: string, programData: Partial<Omit<Program, 'id'>>): Promise<void> {
  const programRef = doc(db, 'events', eventId, 'programs', programId);
  const dataToUpdate: { [key: string]: any } = { ...programData };
    if (programData.startTime) {
        dataToUpdate.startTime = Timestamp.fromDate(programData.startTime);
    }
    if (programData.endTime) {
        dataToUpdate.endTime = Timestamp.fromDate(programData.endTime);
    }
    if (programData.hasOwnProperty('endLocation')) {
        dataToUpdate.endLocation = programData.endLocation === undefined ? null : programData.endLocation;
    }
  await updateDoc(programRef, dataToUpdate);
}

export async function deleteProgram(eventId: string, programId: string): Promise<void> {
  const programRef = doc(db, 'events', eventId, 'programs', programId);
  await deleteDoc(programRef);
}


// === Room Planner Services ===

export function getRooms(callback: (rooms: Room[]) => void): () => void {
  const q = query(collection(db, 'rooms'));
  return onSnapshot(q, (snapshot) => {
    const rooms = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Room));
    callback(rooms);
  });
}

export async function getAllRoomsOnce(): Promise<Room[]> {
    const roomsCollection = collection(db, 'rooms');
    const q = query(roomsCollection);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
}


export async function getRoomsForEvent(eventId: string): Promise<Room[]> {
    const q = query(collection(db, 'rooms'), where('eventId', '==', eventId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
}


export async function addRoom(roomData: Omit<Room, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'rooms'), roomData);
  return docRef.id;
}

export async function updateRoom(roomId: string, roomData: Partial<Omit<Room, 'id'>>): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  await updateDoc(roomRef, roomData);
}

export async function deleteRoom(roomId: string): Promise<void> {
  await deleteDoc(doc(db, 'rooms', roomId));
}


// === Group/Team Services ===

export function getTeams(callback: (teams: Team[]) => void): () => void {
  const teamsCollection = collection(db, 'teams');
  const q = query(teamsCollection);
  return onSnapshot(q, (snapshot) => {
    const teams = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Team));
    callback(teams);
  });
}

export async function getTeamsOnce(): Promise<Team[]> {
    const teamsCollection = collection(db, 'teams');
    const q = query(teamsCollection);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
}

export async function addTeam(teamData: Omit<Team, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'teams'), teamData);
    return docRef.id;
}

export async function updateTeam(teamId: string, teamData: Partial<Omit<Team, 'id'>>): Promise<void> {
    const teamRef = doc(db, 'teams', teamId);
    await updateDoc(teamRef, teamData);
}

export async function deleteTeam(teamId: string): Promise<void> {
    await deleteDoc(doc(db, 'teams', teamId));
}

    