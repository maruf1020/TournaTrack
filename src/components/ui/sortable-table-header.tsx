
'use client';

import * as React from 'react';
import { ChevronsUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { TableHead } from './table';
import { Button } from './button';
import { cn } from '@/lib/utils';
import type { SortDirection } from '@/hooks/use-sortable-table';

interface SortableTableHeaderProps<T> extends React.HTMLAttributes<HTMLTableCellElement> {
    label: string;
    sortKey?: keyof T;
    isSortable?: boolean;
    requestSort: (key: keyof T) => void;
    getSortDirection: (key: keyof T) => SortDirection | null;
}

export function SortableTableHeader<T>({
    label,
    sortKey,
    isSortable = true,
    requestSort,
    getSortDirection,
    className,
    ...props
}: SortableTableHeaderProps<T>) {

    const renderSortIcon = () => {
        if (!isSortable || !sortKey) return null;
        
        const direction = getSortDirection(sortKey);
        
        if (direction === 'asc') {
            return <ArrowUp className="ml-2 h-4 w-4" />;
        }
        if (direction === 'desc') {
            return <ArrowDown className="ml-2 h-4 w-4" />;
        }
        return <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground/50" />;
    };

    const handleClick = () => {
        if (isSortable && sortKey) {
            requestSort(sortKey);
        }
    };

    return (
        <TableHead className={cn("whitespace-nowrap", className)} {...props}>
            {isSortable ? (
                <Button variant="ghost" onClick={handleClick} className="-ml-4 h-8">
                    {label}
                    {renderSortIcon()}
                </Button>
            ) : (
                label
            )}
        </TableHead>
    );
}

