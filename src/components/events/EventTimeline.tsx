
'use client';

import * as React from 'react';
import type { Program } from '@/lib/types';
import { format } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, MapPin, Clock, Users, Route, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '../ui/card';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const ProgramMapViewer = dynamic(() => import('./ProgramMapViewer'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
});


const TimelineItem = ({ program, isLast }: { program: Program, isLast: boolean }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMapOpen, setIsMapOpen] = React.useState(false);

  const handleOpenNativeMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    const { startLocation, endLocation } = program;
    let url = '';

    if (endLocation) {
        // Create a directions URL if both start and end locations exist
        const origin = `${startLocation.lat},${startLocation.lng}`;
        const destination = `${endLocation.lat},${endLocation.lng}`;
        url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
    } else {
        // Fallback to searching for the single start location
        const { lat, lng } = startLocation;
        url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    }
    
    window.open(url, '_blank');
  };

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex gap-4">
          {/* Timestamp and line - HIDDEN ON MOBILE */}
          <div className="hidden md:flex flex-col items-center">
            <div className="w-24 text-right pr-4 shrink-0">
                <p className="font-bold text-base">{format(program.startTime, 'MMM d')}</p>
                <p className="font-semibold text-sm text-muted-foreground">{format(program.startTime, 'p')}</p>
            </div>
            {!isLast && <div className="w-px h-full bg-border" />}
          </div>
          
          {/* Card content */}
          <div className="pb-8 -translate-y-2 w-full">
              <Card className="group transition-all duration-300 hover:shadow-md">
                  <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                          <h3 className="font-semibold text-base text-primary">{program.name}</h3>
                          <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm">
                                  Details <ChevronDown className={cn("ml-2 h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                              </Button>
                          </CollapsibleTrigger>
                      </div>

                      {/* Mobile-only timestamp */}
                      <div className="md:hidden mt-2 text-sm text-muted-foreground">
                        <p>{format(program.startTime, 'MMM d, yyyy')} &middot; {format(program.startTime, 'p')} - {format(program.endTime, 'p')}</p>
                      </div>

                       {program.description && (
                            <p className="text-sm text-muted-foreground mt-2">{program.description}</p>
                       )}

                      <CollapsibleContent className="space-y-4 pt-4 mt-4 border-t">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-3">
                                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <div><span className="font-semibold">Start:</span> {format(program.startTime, 'p, PP')}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <div><span className="font-semibold">End:</span> {format(program.endTime, 'p, PP')}</div>
                                </div>
                            </div>
                             <div className="space-y-3 text-sm">
                                 <div className="flex items-start gap-3">
                                     <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                     <div>
                                        <p className="font-semibold">{program.endLocation ? 'Start Location' : 'Location'}</p>
                                        <p className="text-muted-foreground">{program.startLocation.label}</p>
                                     </div>
                                 </div>
                                 {program.endLocation && (
                                      <div className="flex items-start gap-3">
                                          <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                          <div>
                                            <p className="font-semibold">End Location</p>
                                            <p className="text-muted-foreground">{program.endLocation.label}</p>
                                          </div>
                                      </div>
                                 )}
                                  {program.startLocation && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <Button variant="outline" size="sm" onClick={() => setIsMapOpen(true)}>
                                          <Route className="mr-2 h-4 w-4" /> View Map
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={handleOpenNativeMap}>
                                           <ExternalLink className="mr-2 h-4 w-4" /> Open in Maps
                                        </Button>
                                    </div>
                                  )}
                             </div>
                         </div>
                         {program.roles.length > 0 && (
                            <div className="space-y-3 text-sm pt-4 border-t">
                                <h4 className="font-semibold flex items-center gap-2"><Users className="h-4 w-4" /> Roles & Assignments</h4>
                                <div className="space-y-2">
                                    {program.roles.sort((a,b) => b.priority - a.priority).map(role => (
                                        <div key={role.id} className="p-2 bg-muted/50 rounded-md">
                                            <span className="font-semibold text-primary">{role.roleName}: </span>
                                            <span className="text-muted-foreground">{role.assignedEmployees.map(e => e.name).join(', ')}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                         )}
                      </CollapsibleContent>
                  </CardContent>
              </Card>
          </div>
        </div>
      </Collapsible>
      {program.startLocation && (
        <ProgramMapViewer
          open={isMapOpen}
          onOpenChange={setIsMapOpen}
          startLocation={program.startLocation}
          endLocation={program.endLocation}
        />
      )}
    </>
  );
};


export default function EventTimeline({ programs }: { programs: Program[] }) {
  if (programs.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>No programs found for this event.</p>
        <p className="text-sm">Select another event or add programs in the admin panel.</p>
      </div>
    );
  }

  const sortedPrograms = programs.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  return (
    <div className="relative">
      {sortedPrograms.map((program, index) => (
        <TimelineItem key={program.id} program={program} isLast={index === sortedPrograms.length - 1} />
      ))}
    </div>
  );
}
