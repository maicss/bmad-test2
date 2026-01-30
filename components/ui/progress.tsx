"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Progress({
  className,
  value,
  max = 100,
  ...props
}: React.ComponentProps<"div"> & {
  value: number
  max?: number
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div
      data-slot="progress"
      className={cn(
        "bg-secondary h-2 w-full overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className="bg-primary h-full rounded-full transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

export { Progress }
