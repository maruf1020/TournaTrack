
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Group as GroupData, Standing } from '@/lib/bracket-utils';
import { GroupIcon, Info, Users } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import type { Player } from '@/lib/types';


const TeamInfoPopover = ({ players, teamName }: { players: Player[], teamName: string }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 text-primary hover:text-primary/80">
          <Info className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60">
        <div className="space-y-2">
          <h4 className="font-medium leading-none flex items-center gap-2">
            <Users className="h-4 w-4" /> Team Roster
          </h4>
          <p className="text-sm text-muted-foreground font-semibold">{teamName}</p>
          <div className="text-sm text-muted-foreground space-y-1">
            {players.map((p, index) => (
              <div key={p.id}>
                {index + 1}. {p.name}
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};


const TeamCell = ({ team }: { team: Standing }) => {
  if (team.players.length <= 1) {
    return <div className="font-medium">{team.name}</div>;
  }
  
  return (
    <div className="flex items-center">
      <span className="font-medium">{team.name}</span>
      <TeamInfoPopover players={team.players} teamName={team.name} />
    </div>
  );
};


export function GroupStageDisplay({ groups }: { groups: GroupData[] }) {
    if (!groups || groups.length === 0) {
        return (
            <div className="text-center py-16 text-muted-foreground">
                <p>No group stage data available for this tournament.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {groups.map(group => (
                <Card key={group.name}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><GroupIcon /> {group.name}</CardTitle>
                        <CardDescription>Standings and results for {group.name}.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40px]">Pos</TableHead>
                                    <TableHead>Team</TableHead>
                                    <TableHead className="text-center">P</TableHead>
                                    <TableHead className="text-center">W</TableHead>
                                    <TableHead className="text-center">D</TableHead>
                                    <TableHead className="text-center">L</TableHead>
                                    <TableHead className="text-center">Pts</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {group.standings.map((team, index) => (
                                    <TableRow key={team.id}>
                                        <TableCell className="font-medium">{index + 1}</TableCell>
                                        <TableCell><TeamCell team={team} /></TableCell>
                                        <TableCell className="text-center">{team.played}</TableCell>
                                        <TableCell className="text-center">{team.wins}</TableCell>
                                        <TableCell className="text-center">{team.draws}</TableCell>
                                        <TableCell className="text-center">{team.losses}</TableCell>
                                        <TableCell className="text-center font-bold">{team.points}</TableCell>
                                    </TableRow>
                                ))}
                                {group.standings.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24">
                                            No teams in this group.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
