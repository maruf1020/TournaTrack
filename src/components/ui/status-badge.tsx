import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import type { Match } from "@/lib/types"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
  {
    variants: {
      status: {
        finished: "border-transparent bg-emerald-500 text-emerald-950 dark:bg-emerald-600 dark:text-white",
        upcoming: "border-transparent bg-amber-400 text-amber-950 dark:bg-amber-500 dark:text-white",
        ongoing: "border-transparent bg-rose-500 text-rose-950 dark:bg-rose-600 dark:text-white",
        cancelled: "border-transparent bg-slate-400 text-slate-950 dark:bg-slate-600 dark:text-white",
        draft: "border-transparent bg-blue-500 text-white dark:bg-blue-500 dark:text-white",
      },
    },
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
        status: Match['status']
    }

function StatusBadge({ className, status, ...props }: StatusBadgeProps) {
  if (!status) return null;
  // Default to upcoming if status is something unexpected
  const displayStatus = ['finished', 'upcoming', 'ongoing', 'cancelled', 'draft'].includes(status) ? status : 'draft';

  return (
    <div className={cn(badgeVariants({ status: displayStatus as any }), className)} {...props}>
      {displayStatus}
    </div>
  )
}

export { StatusBadge, badgeVariants as statusBadgeVariants }
