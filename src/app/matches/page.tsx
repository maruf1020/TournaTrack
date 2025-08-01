'use client';

import * as React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MatchList } from '@/components/matches/MatchList';

export default function MatchesPage() {
  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight font-headline">All Matches</h1>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Match Schedule</CardTitle>
                <CardDescription>Browse and filter all matches in the tournament.</CardDescription>
            </CardHeader>
            <CardContent>
                 <MatchList isAdmin={false} />
            </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
