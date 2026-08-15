import { useEffect, useState } from 'react'

export function useActiveSection(sectionIds: string[]) {
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)

    if (sections.length === 0) return

    // A callback only carries the sections whose intersection *changed*, so the
    // running set is what tells us everything currently in the band — sorting
    // one callback's entries would pick the topmost of the ones that just
    // moved, not the topmost of the ones on screen.
    const intersecting = new Set<HTMLElement>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const section = entry.target as HTMLElement
          if (entry.isIntersecting) intersecting.add(section)
          else intersecting.delete(section)
        }

        const topmost = [...intersecting].sort(
          (a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top,
        )[0]

        if (topmost) {
          setActiveId(topmost.id)
        }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
    )

    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [sectionIds])

  return activeId
}
