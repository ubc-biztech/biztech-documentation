'use client'

import { PAGE_TEMPLATES } from '@/lib/builder/templates'

/**
 * template picker shown when creating a new draft
 * displays a grid of template cards that the user can click to start with
 */
export function TemplatePicker({ onSelect, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="max-h-[85vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl dark:bg-slate-800">
        {/* header */}
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-4 sm:px-6 sm:py-5 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            Choose a Template
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Start with a pre-built layout, or pick blank to build from scratch.
          </p>
        </div>

        {/* template grid */}
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-6 md:grid-cols-3">
          {PAGE_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => onSelect(tmpl)}
              className="group flex flex-col items-start rounded-xl border border-slate-200 p-4 text-left transition hover:border-sky-300 hover:bg-sky-50/50 hover:shadow-md active:border-sky-400 active:bg-sky-50 dark:border-slate-700 dark:hover:border-sky-600 dark:hover:bg-sky-900/10"
            >
              <span className="mb-2 text-2xl">{tmpl.icon}</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {tmpl.name}
              </span>
              <span className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {tmpl.description}
              </span>
            </button>
          ))}
        </div>

        {/* footer */}
        <div className="sticky bottom-0 flex items-center justify-end border-t border-slate-200 bg-white px-4 py-3 sm:px-6 dark:border-slate-700 dark:bg-slate-800">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
