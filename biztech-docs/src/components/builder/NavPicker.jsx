'use client'

import { useState } from 'react'
import { navigation } from '@/lib/navigation'

/**
 * nav tree picker for choosing where a new page when u add the site
 * should appear in the docs sidebar.
 *
 * props:
 *   navPlacement - current placement: { type, sectionIndex, positionIndex, newSectionTitle }
 *   onPlacementChange - (placement) => void
 *   navTitle - the display title for the new page in the sidebar
 */
export function NavPicker({ navPlacement, onPlacementChange, navTitle }) {
  const [expandedSections, setExpandedSections] = useState(new Set())
  const [newSectionMode, setNewSectionMode] = useState(
    navPlacement?.type === 'new-section',
  )
  const [newSectionTitle, setNewSectionTitle] = useState(
    navPlacement?.newSectionTitle || '',
  )
  const [newSectionIndex, setNewSectionIndex] = useState(
    navPlacement?.type === 'new-section'
      ? navPlacement.sectionIndex
      : navigation.length,
  )

  const toggleSection = (idx) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const selectExisting = (sectionIndex, positionIndex) => {
    setNewSectionMode(false)
    onPlacementChange({
      type: 'existing',
      sectionIndex,
      positionIndex,
    })
  }

  const selectNewSection = (sectionIndex) => {
    setNewSectionMode(true)
    setNewSectionIndex(sectionIndex)
    onPlacementChange({
      type: 'new-section',
      sectionIndex,
      newSectionTitle: newSectionTitle || 'New Section',
    })
  }

  const handleNewSectionTitleChange = (title) => {
    setNewSectionTitle(title)
    if (newSectionMode) {
      onPlacementChange({
        type: 'new-section',
        sectionIndex: newSectionIndex,
        newSectionTitle: title || 'New Section',
      })
    }
  }

  const isSelected = (type, sectionIndex, positionIndex) => {
    if (!navPlacement) return false
    if (type === 'existing' && navPlacement.type === 'existing') {
      return (
        navPlacement.sectionIndex === sectionIndex &&
        navPlacement.positionIndex === positionIndex
      )
    }
    if (type === 'new-section' && navPlacement.type === 'new-section') {
      return navPlacement.sectionIndex === sectionIndex
    }
    return false
  }

  const newPageLabel = navTitle || 'Your new page'

  return (
    <div className="space-y-3">
      <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
        Click where your page should appear in the sidebar:
      </div>

      <div className="max-h-[280px] overflow-y-auto rounded-lg border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800">
        {/* new section insertion point at top */}
        <InsertionLine
          label="+ New section here"
          isNewSection
          selected={isSelected('new-section', 0)}
          onClick={() => selectNewSection(0)}
        />

        {navigation.map((section, sIdx) => {
          const isExpanded = expandedSections.has(sIdx)

          return (
            <div key={sIdx}>
              {/* section header */}
              <button
                type="button"
                onClick={() => toggleSection(sIdx)}
                className="flex w-full items-center gap-2 border-b border-slate-100 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700/50"
              >
                <span
                  className={`text-[10px] text-slate-400 transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                >
                  ▶
                </span>
                <span className="flex-1">{section.title}</span>
                <span className="text-[10px] text-slate-400">
                  {section.links.length} page{section.links.length !== 1 ? 's' : ''}
                </span>
              </button>

              {/* expanded links with insertion points */}
              {isExpanded && (
                <div className="bg-slate-50/50 dark:bg-slate-900/30">
                  {/* insert at top of section */}
                  <InsertionLine
                    label={newPageLabel}
                    selected={isSelected('existing', sIdx, 0)}
                    onClick={() => selectExisting(sIdx, 0)}
                  />

                  {section.links.map((link, lIdx) => (
                    <div key={lIdx}>
                      {/* existing link */}
                      <div className="flex items-center gap-2 px-3 py-1.5 pl-8 text-xs text-slate-500 dark:text-slate-400">
                        <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                        <span className="truncate">{link.title}</span>
                      </div>

                      {/* insert after this link */}
                      <InsertionLine
                        label={newPageLabel}
                        selected={isSelected('existing', sIdx, lIdx + 1)}
                        onClick={() => selectExisting(sIdx, lIdx + 1)}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* new section insertion point between sections */}
              <InsertionLine
                label="+ New section here"
                isNewSection
                selected={isSelected('new-section', sIdx + 1)}
                onClick={() => selectNewSection(sIdx + 1)}
              />
            </div>
          )
        })}
      </div>

      {/* new section title input (shown when new-section is selected) */}
      {newSectionMode && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-900/20">
          <label className="mb-1 block text-xs font-medium text-emerald-700 dark:text-emerald-400">
            New section title
          </label>
          <input
            type="text"
            value={newSectionTitle}
            onChange={(e) => handleNewSectionTitleChange(e.target.value)}
            placeholder="e.g. Deep Dive: My Feature"
            className="w-full rounded-md border border-emerald-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 dark:border-emerald-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
      )}

      {/* selection summary */}
      {navPlacement && (
        <div className="rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-700 dark:bg-sky-900/20 dark:text-sky-400">
          {navPlacement.type === 'existing' ? (
            <>
              <strong>{newPageLabel}</strong> will be added to{' '}
              <strong>{navigation[navPlacement.sectionIndex]?.title}</strong>
              {navPlacement.positionIndex === 0
                ? ' (at the top)'
                : navPlacement.positionIndex >=
                  navigation[navPlacement.sectionIndex]?.links.length
                ? ' (at the bottom)'
                : ` (after "${
                    navigation[navPlacement.sectionIndex]?.links[
                      navPlacement.positionIndex - 1
                    ]?.title
                  }")`}
            </>
          ) : (
            <>
              <strong>{newPageLabel}</strong> will be the first page in a new{' '}
              <strong>{navPlacement.newSectionTitle}</strong> section
              {navPlacement.sectionIndex === 0
                ? ' (at the top of the sidebar)'
                : navPlacement.sectionIndex >= navigation.length
                ? ' (at the bottom of the sidebar)'
                : ` (before "${navigation[navPlacement.sectionIndex]?.title}")`}
            </>
          )}
        </div>
      )}
    </div>
  )
}

/** very cool clickable insertion line between existing items */
function InsertionLine({ label, selected, onClick, isNewSection }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-2 px-3 py-0.5 text-left transition-all ${
        selected
          ? isNewSection
            ? 'bg-emerald-50 dark:bg-emerald-900/20'
            : 'bg-sky-50 dark:bg-sky-900/20'
          : 'hover:bg-slate-100 dark:hover:bg-slate-700/30'
      }`}
    >
      <div
        className={`flex-1 border-t border-dashed transition-colors ${
          selected
            ? isNewSection
              ? 'border-emerald-400'
              : 'border-sky-400'
            : 'border-transparent group-hover:border-slate-300 dark:group-hover:border-slate-600'
        }`}
      />
      <span
        className={`whitespace-nowrap text-[10px] font-medium transition-colors ${
          selected
            ? isNewSection
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-sky-600 dark:text-sky-400'
            : 'text-transparent group-hover:text-slate-400'
        }`}
      >
        {selected ? (isNewSection ? `✓ ${label}` : `✓ ${label}`) : label}
      </span>
      <div
        className={`flex-1 border-t border-dashed transition-colors ${
          selected
            ? isNewSection
              ? 'border-emerald-400'
              : 'border-sky-400'
            : 'border-transparent group-hover:border-slate-300 dark:group-hover:border-slate-600'
        }`}
      />
    </button>
  )
}
