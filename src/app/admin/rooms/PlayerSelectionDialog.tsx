
'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { Player } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { branches } from '@/lib/placeholder-data';


export default function PlayerSelectionDialog({
    open,
    onOpenChange,
    allPlayers,
    initialSelection,
    onConfirm,
    capacity,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    allPlayers: Player[];
    initialSelection: Pick<Player, 'id'>[];
    onConfirm: (selected: Player[]) => void;
    capacity: number;
}) {
    const { toast } = useToast();
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = React.useState('');
    const [branchFilter, setBranchFilter] = React.useState('all');
    const [designationFilter, setDesignationFilter] = React.useState('all');

    const allDesignations = React.useMemo(() => {
        const designations = new Set<string>();
        allPlayers.forEach(p => p.designation && designations.add(p.designation));
        return Array.from(designations).sort();
    }, [allPlayers]);

    React.useEffect(() => {
        if (open) {
            setSelectedIds(new Set(initialSelection.map(p => p.id)));
        } else {
            // Reset filters on close
            setSearchTerm('');
            setBranchFilter('all');
            setDesignationFilter('all');
        }
    }, [initialSelection, open]);
    
    const filteredPlayers = allPlayers.filter(p =>
        (p.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (branchFilter === 'all' || p.branch === branchFilter) &&
        (designationFilter === 'all' || p.designation === designationFilter)
    );

    const handleToggle = (playerId: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(playerId)) {
                newSet.delete(playerId);
            } else {
                if (capacity > 0 && newSet.size >= capacity) {
                    toast({ title: "Capacity Reached", description: `This room has a capacity of ${capacity}.`, variant: 'destructive'});
                    return prev;
                }
                newSet.add(playerId);
            }
            return newSet;
        });
    }

    const handleConfirmSelection = () => {
        const selectedPlayers = allPlayers.filter(p => selectedIds.has(p.id));
        onConfirm(selectedPlayers);
        onOpenChange(false);
    }
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Assign Employees to Room</DialogTitle>
                    <DialogDescription>Select up to {capacity} employees.</DialogDescription>
                </DialogHeader>
                 <div className="space-y-4 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                         <Input 
                            placeholder="Search employees..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="sm:col-span-3"
                        />
                        <Select value={branchFilter} onValueChange={setBranchFilter}>
                            <SelectTrigger><SelectValue placeholder="All Branches" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Branches</SelectItem>
                                {branches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                            </SelectContent>
                        </Select>
                         <Select value={designationFilter} onValueChange={setDesignationFilter}>
                            <SelectTrigger className="sm:col-span-2"><SelectValue placeholder="All Designations"/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Designations</SelectItem>
                                {allDesignations.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">{selectedIds.size} / {capacity} selected</p>
                    <ScrollArea className="h-60 border rounded-md">
                        <div className="p-2 space-y-1">
                        {filteredPlayers.length > 0 ? filteredPlayers.map(player => (
                            <Label key={player.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 font-normal cursor-pointer">
                                <Checkbox checked={selectedIds.has(player.id)} onCheckedChange={() => handleToggle(player.id)} />
                                <div>
                                    {player.name}
                                    <span className="text-xs text-muted-foreground ml-2">({player.designation}, {player.branch})</span>
                                </div>
                            </Label>
                        )) : (
                            <p className="text-center text-sm text-muted-foreground py-4">No employees match the current filters.</p>
                        )}
                        </div>
                    </ScrollArea>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleConfirmSelection}>Confirm</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
