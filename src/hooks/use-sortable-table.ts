
'use client';

import * as React from 'react';

export type SortDirection = 'asc' | 'desc';

interface SortConfig<T> {
    key: keyof T;
    direction: SortDirection;
}

interface UseSortableTableProps<T> {
    initialSort?: SortConfig<T>[];
}

export function useSortableTable<T>(items: T[], config?: UseSortableTableProps<T>) {
    const [sortConfig, setSortConfig] = React.useState<SortConfig<T>[]>(config?.initialSort || []);

    const requestSort = (key: keyof T) => {
        setSortConfig(prevConfig => {
            const existingSort = prevConfig.find(item => item.key === key);

            if (existingSort) {
                // If the same column is clicked, cycle its direction or remove it
                if (existingSort.direction === 'asc') {
                    return [{ key, direction: 'desc' }];
                } else {
                    // It was 'desc', so remove sort
                    return [];
                }
            } else {
                // If a new column is clicked, sort it by 'asc' and clear others
                return [{ key, direction: 'asc' }];
            }
        });
    };

    const getSortDirection = (key: keyof T): SortDirection | null => {
        const configItem = sortConfig.find(item => item.key === key);
        return configItem ? configItem.direction : null;
    };

    const sortedData = React.useMemo(() => {
        if (sortConfig.length === 0) {
            return [...items];
        }

        return [...items].sort((a, b) => {
            for (const config of sortConfig) {
                const aValue = a[config.key];
                const bValue = b[config.key];

                let comparison = 0;
                
                // Handle null/undefined values to always appear at the bottom
                if (aValue == null && bValue != null) comparison = 1;
                else if (aValue != null && bValue == null) comparison = -1;
                else if (aValue == null && bValue == null) comparison = 0;
                
                // Handle date objects
                else if (aValue instanceof Date && bValue instanceof Date) {
                    comparison = aValue.getTime() - bValue.getTime();
                } else if ((aValue as any)?.toDate instanceof Function && (bValue as any)?.toDate instanceof Function) {
                    // Firebase Timestamps
                    comparison = (aValue as any).toDate().getTime() - (bValue as any).toDate().getTime();
                }
                
                // Handle strings (case-insensitive)
                else if (typeof aValue === 'string' && typeof bValue === 'string') {
                    comparison = aValue.localeCompare(bValue);
                }
                
                // Handle numbers and booleans
                else if (typeof aValue === 'number' && typeof bValue === 'number') {
                    comparison = aValue - bValue;
                } else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
                    comparison = (aValue === bValue) ? 0 : aValue ? -1 : 1;
                }

                if (comparison !== 0) {
                    return config.direction === 'asc' ? comparison : -comparison;
                }
            }
            return 0;
        });
    }, [items, sortConfig]);

    return { sortedData, requestSort, getSortDirection };
}
