'use client';

import * as React from 'react';
import { MatchList } from '@/components/matches/MatchList';

export default function ManageMatches() {
  return <MatchList isAdmin={true} />;
}
