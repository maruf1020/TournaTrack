'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trophy, Loader2, Filter, Calendar as CalendarIcon, Pencil, Trash2 } from 'lucide-react';
import type { Match, Player } from '@/lib/types';
import { getMatches, updateMatch } from '@/lib/services';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { branches, departments } from '@/lib/placeholder-data';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';
import { StatusBadge } from '@/components/ui/status-badge';
import { MatchList } from '@/components/matches/MatchList';


export default function ManageMatches() {
    return <MatchList isAdmin={true} />;
}
