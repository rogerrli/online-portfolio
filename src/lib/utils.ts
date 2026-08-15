import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Small uppercase mono label used for `<dt>`s across the page. */
export const LABEL_CLASS =
  "font-mono text-xs tracking-wide text-muted-foreground uppercase"

/** Underlined inline link inside body copy. */
export const LINK_CLASS = "underline underline-offset-3 hover:text-accent-text"
