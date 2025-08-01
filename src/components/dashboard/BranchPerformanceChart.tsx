'use client';
import * as React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

type ChartData = {
    branch: string;
    wins: number;
}

export default function BranchPerformanceChart({ data, branch }: { data: ChartData[], branch: string }) {
    const chartData = React.useMemo(() => {
        if (branch === 'all') {
            return data;
        }
        return data.filter(d => d.branch === branch);
    }, [data, branch]);
    
    return (
        <ChartContainer config={{
            wins: {
              label: "Wins",
              color: "hsl(var(--primary))",
            },
          }} className="h-[300px] w-full">
          <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="branch"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="wins" fill="var(--color-wins)" radius={4} />
          </BarChart>
        </ChartContainer>
    )
}
