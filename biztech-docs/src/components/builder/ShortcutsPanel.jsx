'use client'

/**
 * keyboard shortcuts help panel, shown with ? key.
 * overlays a modal with all available keyboard shortcuts.
 */
export function ShortcutsPanel({ onClose }) {
  const sections = [
    {
      title: 'General',
      shortcuts: [
        { keys: '⌘ S', desc: 'Save draft' },
        { keys: '⌘ E', desc: 'Export as Markdoc' },
        { keys: '⌘ Z', desc: 'Undo' },
        { keys: '⌘ ⇧ Z', desc: 'Redo' },
        { keys: '?', desc: 'Show this help' },
      ],
    },
    {
      title: 'View',
      shortcuts: [
        { keys: '⌘ 1', desc: 'Editor view' },
        { keys: '⌘ 2', desc: 'Split view' },
        { keys: '⌘ 3', desc: 'Preview view' },
      ],
    },
    {
      title: 'Block Editing',
      shortcuts: [
        { keys: 'Enter', desc: 'New block below (paragraph/heading)' },
        { keys: '⌘ Enter', desc: 'New block below (any block)' },
        { keys: 'Backspace', desc: 'Delete empty block' },
        { keys: '/', desc: 'Slash command (on empty block)' },
        { keys: '↑ ↓', desc: 'Navigate between blocks' },
      ],
    },
    {
      title: 'Inline Formatting',
      shortcuts: [
        { keys: '⌘ B', desc: 'Bold' },
        { keys: '⌘ I', desc: 'Italic' },
        { keys: '⌘ `', desc: 'Inline code' },
      ],
    },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-h-[85vh] rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:max-w-lg sm:rounded-2xl dark:bg-slate-800">
        {/* header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4 dark:border-slate-700">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
          >
            ✕
          </button>
        </div>

        {/* shortcuts */}
        <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-6">
          <div className="space-y-6">
            {sections.map((section) => (
              <div key={section.title}>
                <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {section.title}
                </h3>
                <div className="space-y-1.5">
                  {section.shortcuts.map((s) => (
                    <div
                      key={s.keys}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        {s.desc}
                      </span>
                      <div className="flex gap-1">
                        {s.keys.split(' ').map((key, i) => (
                          <kbd
                            key={i}
                            className="inline-flex h-6 min-w-[24px] items-center justify-center rounded bg-slate-100 px-1.5 font-mono text-[11px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* footer */}
        <div className="border-t border-slate-200 px-4 py-3 text-center sm:px-6 dark:border-slate-700">
          <span className="text-xs text-slate-400">
            Press <kbd className="rounded bg-slate-100 px-1 text-[10px] dark:bg-slate-700">Esc</kbd> or <kbd className="rounded bg-slate-100 px-1 text-[10px] dark:bg-slate-700">?</kbd> to close
          </span>
        </div>
      </div>
    </div>
  )
}
