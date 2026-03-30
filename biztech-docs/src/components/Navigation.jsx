import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

import { navigation } from '@/lib/navigation'

/** strip trailing slash for consistent comparison  */
function normalize(path) {
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path
}

function ChevronIcon(props) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" {...props}>
      <path
        d="M6 8l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Navigation({ className, onLinkClick }) {
  let pathname = usePathname()
  let [openSections, setOpenSections] = useState(() =>
    Object.fromEntries(navigation.map((section) => [section.title, true])),
  )

  useEffect(() => {
    let activeSection = navigation.find((section) =>
      section.links.some((link) => normalize(link.href) === normalize(pathname)),
    )

    if (!activeSection) return

    setOpenSections((previous) => {
      if (previous[activeSection.title]) return previous
      return { ...previous, [activeSection.title]: true }
    })
  }, [pathname])

  function toggleSection(sectionTitle) {
    setOpenSections((previous) => ({
      ...previous,
      [sectionTitle]: !previous[sectionTitle],
    }))
  }

  return (
    <nav className={clsx('text-base lg:text-sm', className)}>
      <ul role="list" className="space-y-9">
        {navigation.map((section) => {
          let isOpen = openSections[section.title] ?? true

          return (
            <li key={section.title}>
              <h2 className="font-display font-medium text-slate-900 dark:text-white">
                <button
                  type="button"
                  onClick={() => toggleSection(section.title)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-2 text-left"
                >
                  <span>{section.title}</span>
                  <ChevronIcon
                    className={clsx(
                      'h-4 w-4 shrink-0 text-slate-500 transition-transform dark:text-slate-400',
                      isOpen ? 'rotate-0' : '-rotate-90',
                    )}
                  />
                </button>
              </h2>
              {isOpen && (
                <ul
                  role="list"
                  className="mt-2 space-y-2 border-l-2 border-slate-100 dark:border-slate-800 lg:mt-4 lg:space-y-4 lg:border-slate-200"
                >
                  {section.links.map((link) => (
                    <li key={link.href} className="relative">
                      <Link
                        href={link.href}
                        onClick={onLinkClick}
                        className={clsx(
                          'block w-full pl-3.5 before:pointer-events-none before:absolute before:-left-1 before:top-1/2 before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full',
                          normalize(link.href) === normalize(pathname)
                            ? 'font-semibold text-sky-500 before:bg-sky-500'
                            : 'text-slate-500 before:hidden before:bg-slate-300 hover:text-slate-600 hover:before:block dark:text-slate-400 dark:before:bg-slate-700 dark:hover:text-slate-300',
                        )}
                      >
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
