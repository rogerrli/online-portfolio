/** Row of tech/skill pills shared by experience roles and project cards. */
export function TagList({ tags }: { tags?: string[] }) {
  if (!tags || tags.length === 0) return null

  return (
    <ul aria-label="Technologies used" className="mt-3 flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <li
          key={tag}
          className="rounded-full border border-border px-2 py-0.5 font-mono text-xs text-muted-foreground"
        >
          {tag}
        </li>
      ))}
    </ul>
  )
}
