'use client'

import { BLOCK_TYPES } from '@/lib/builder/blocks'

/**
 * floating toolbar that can be used to insert blocks.
 * currently exported but the main insertion UX is in the PageBuilder
 * and BlockEditor components. this is available as an alternative
 * toolbar widget if needed.
 */
export function BuilderToolbar({ onInsertBlock }) {
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <span className="px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        Insert
      </span>
      {Object.entries(BLOCK_TYPES).map(([type, meta]) => (
        <button
          key={type}
          onClick={() => onInsertBlock(type)}
          title={meta.label}
          className="flex h-7 items-center gap-1 rounded px-2 text-xs text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
        >
          <span>{meta.icon}</span>
          <span className="hidden sm:inline">{meta.label}</span>
        </button>
      ))}
    </div>
  )
}
