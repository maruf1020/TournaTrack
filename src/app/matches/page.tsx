
'use client';

import * as React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MatchList } from '@/components/matches/MatchList';
import { Skeleton } from '@/components/ui/skeleton';

function MatchesPageSkeleton() {
    return (
        <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-48" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-64 mb-2" />
                    <Skeleton className="h-4 w-96" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[400px] w-full" />
                </CardContent>
            </Card>
        </div>
    )
}

export default function MatchesPage() {
  const [loading, setLoading] = React.useState(true);

  // A bit of a hack to show skeleton on first load.
  // MatchList handles its own loading state internally, but this
  // makes the initial page transition smoother.
  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500); // Adjust time as needed
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
      return (
          <AppLayout>
              <MatchesPageSkeleton />
          </AppLayout>
      )
  }

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
