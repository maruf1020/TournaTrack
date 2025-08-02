/**
 * @fileoverview
 * This file contains placeholder data for the ELX-TournaTrack application.
 * In a production environment, this data would be fetched from a database like Firestore.
 * It includes games, branches, departments, players, and generated tournament structures.
 */

import type { Player, Game, Match, Round, Tournament } from './types';

// This is intentionally left empty. Games are now managed in the database via the Settings page.
export const games: Game[] = [
  { id: '1', name: 'Test Game' }  
];


export const branches: string[] = ['Dhanmondi', 'Uttara', 'Chittagong'];
export const departments: string[] = [ 'Development', 'Quality Assurance', 'UI/UX Design', 'Management', 'Human Resources', 'Accounting', 'Staff'];

// This file no longer holds player or match data.
// It is now fetched from Firestore via functions in /lib/services.ts

export const currentUser: Player = {
  id: 'admin-user',
  name: 'Admin User',
  email: 'admin@echologyx.com',
  branch: 'Head Office',
  department: 'Management',
  designation: 'Administrator',
  employeeId: 'ADMIN01',
  joiningDate: new Date().toISOString(),
  imageUrl: `https://placehold.co/100x100.png`,
  isAdmin: true,
};
