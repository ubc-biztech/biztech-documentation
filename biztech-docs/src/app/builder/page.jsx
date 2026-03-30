'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { PageBuilder } from '@/components/builder/PageBuilder'
import { BuilderPreview } from '@/components/builder/BuilderPreview'
import { PreviewFrame } from '@/components/builder/PreviewFrame'
import { ExportModal } from '@/components/builder/ExportModal'
import { TemplatePicker } from '@/components/builder/TemplatePicker'
import { ShortcutsPanel } from '@/components/builder/ShortcutsPanel'
import { SubmitPRModal } from '@/components/builder/SubmitPRModal'
import { generateMarkdoc } from '@/lib/builder/generateMarkdoc'
import { createEmptyBlock } from '@/lib/builder/blocks'
import { PAGE_TEMPLATES } from '@/lib/builder/templates'

const STORAGE_KEY = 'biztech-builder-drafts'
const CURRENT_DRAFT_KEY = 'biztech-builder-current'
const MAX_HISTORY = 50

function loadDrafts() {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveDrafts(drafts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
}

function loadCurrentDraftId() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(CURRENT_DRAFT_KEY)
}

function saveCurrentDraftId(id) {
  localStorage.setItem(CURRENT_DRAFT_KEY, id)
}

function Toast({ message, visible }) {
  return (
    <div
      className={`pointer-events-none fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 transition-all duration-300 ${
        visible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-2 opacity-0'
      }`}
    >
      <div className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg dark:bg-slate-100 dark:text-slate-900">
        {message}
      </div>
    </div>
  )
}

// mobile menu
function MobileOverflowMenu({ onExport, onSubmitPR, onShortcuts, onFocusMode, focusMode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative sm:hidden" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-sm text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400"
      >
        ⋯
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-800">
          <button
            onClick={() => { onExport(); setOpen(false) }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50"
          >
            <span className="text-base">📦</span> Export Markdoc
          </button>
          <button
            onClick={() => { onSubmitPR(); setOpen(false) }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
          >
            <span className="text-base">🚀</span> Submit PR
          </button>
          <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
          <button
            onClick={() => { onFocusMode(); setOpen(false) }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50"
          >
            <span className="text-base">{focusMode ? '🔓' : '🎯'}</span>
            {focusMode ? 'Exit Focus Mode' : 'Focus Mode'}
          </button>
          <button
            onClick={() => { onShortcuts(); setOpen(false) }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50"
          >
            <span className="text-base">⌨️</span> Shortcuts
          </button>
        </div>
      )}
    </div>
  )
}

// word count
function countWords(blocks) {
  return blocks.reduce((n, b) => {
    const text = b.content || ''
    const words = text.trim().split(/\s+/).filter(Boolean)
    return n + words.length
  }, 0)
}

// undo/redo
function useHistory(blocks, setBlocks) {
  const past = useRef([])
  const future = useRef([])
  const skipRecord = useRef(false)

  // record history on blocks change, unless skipRecord is true
  const lastSnapshot = useRef(null)
  useEffect(() => {
    if (skipRecord.current) {
      skipRecord.current = false
      return
    }
    const snap = JSON.stringify(blocks)
    if (snap === lastSnapshot.current) return
    if (lastSnapshot.current !== null) {
      past.current = [...past.current.slice(-(MAX_HISTORY - 1)), lastSnapshot.current]
      future.current = []
    }
    lastSnapshot.current = snap
  }, [blocks])

  const undo = useCallback(() => {
    if (past.current.length === 0) return
    const prev = past.current[past.current.length - 1]
    past.current = past.current.slice(0, -1)
    future.current = [...future.current, JSON.stringify(blocks)]
    skipRecord.current = true
    setBlocks(JSON.parse(prev))
  }, [blocks, setBlocks])

  const redo = useCallback(() => {
    if (future.current.length === 0) return
    const next = future.current[future.current.length - 1]
    future.current = future.current.slice(0, -1)
    past.current = [...past.current, JSON.stringify(blocks)]
    skipRecord.current = true
    setBlocks(JSON.parse(next))
  }, [blocks, setBlocks])

  const canUndo = past.current.length > 0
  const canRedo = future.current.length > 0

  return { undo, redo, canUndo, canRedo }
}

// scroll sync hook
function useScrollSync(enabled, trigger) {
  const editorRef = useRef(null)
  const previewRef = useRef(null)
  const isSyncing = useRef(false)

  useEffect(() => {
    if (!enabled) return
    const editor = editorRef.current

    const previewHandle = previewRef.current
    const preview = previewHandle?.scrollElement ?? previewHandle
    if (!editor || !preview) return

    function syncScroll(source, target) {
      if (isSyncing.current) return
      isSyncing.current = true
      const pct = source.scrollTop / (source.scrollHeight - source.clientHeight || 1)
      target.scrollTop = pct * (target.scrollHeight - target.clientHeight || 1)
      requestAnimationFrame(() => { isSyncing.current = false })
    }

    const onEditorScroll = () => syncScroll(editor, preview)
    const onPreviewScroll = () => syncScroll(preview, editor)

    editor.addEventListener('scroll', onEditorScroll, { passive: true })
    preview.addEventListener('scroll', onPreviewScroll, { passive: true })
    return () => {
      editor.removeEventListener('scroll', onEditorScroll)
      preview.removeEventListener('scroll', onPreviewScroll)
    }
  }, [enabled, trigger])

  return { editorRef, previewRef }
}

export default function BuilderPage() {
  const [blocks, setBlocks] = useState([
    createEmptyBlock('leadParagraph'),
    createEmptyBlock('divider'),
    createEmptyBlock('heading2'),
  ])
  const [pageTitle, setPageTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [sectionName, setSectionName] = useState('')
  const [view, setView] = useState('split')
  const [showExport, setShowExport] = useState(false)
  const [drafts, setDrafts] = useState({})
  const [currentDraftId, setCurrentDraftId] = useState(null)
  const [draftName, setDraftName] = useState('Untitled')
  const [showDraftList, setShowDraftList] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [toast, setToast] = useState({ message: '', visible: false })
  const [lastSaved, setLastSaved] = useState(null)
  const [splitPercent, setSplitPercent] = useState(50)
  const [metaCollapsed, setMetaCollapsed] = useState(false)
  const [scrollSyncEnabled, setScrollSyncEnabled] = useState(true)
  const [focusMode, setFocusMode] = useState(false)
  const [iframeReady, setIframeReady] = useState(0)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showSubmitPR, setShowSubmitPR] = useState(false)
  const dropdownRef = useRef(null)
  const splitContainerRef = useRef(null)
  const isDraggingSplit = useRef(false)
  const [isDraggingVisual, setIsDraggingVisual] = useState(false)

  const showToast = useCallback((message) => {
    setToast({ message, visible: true })
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2000)
  }, [])

  const { undo, redo, canUndo, canRedo } = useHistory(blocks, setBlocks)

  // scroll sync between editor and preview
  const { editorRef, previewRef } = useScrollSync(scrollSyncEnabled && view === 'split', iframeReady)

  // draggable split pane
  const handleSplitMouseDown = useCallback((e) => {
    e.preventDefault()
    isDraggingSplit.current = true
    setIsDraggingVisual(true)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    function onMouseMove(ev) {
      if (!isDraggingSplit.current || !splitContainerRef.current) return
      const rect = splitContainerRef.current.getBoundingClientRect()
      const pct = ((ev.clientX - rect.left) / rect.width) * 100
      setSplitPercent(Math.min(80, Math.max(20, pct)))
    }

    function onMouseUp() {
      isDraggingSplit.current = false
      setIsDraggingVisual(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [])

  // close dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setShowDraftList(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // load drafts from localStorage on mount
  useEffect(() => {
    const loaded = loadDrafts()
    setDrafts(loaded)
    const lastId = loadCurrentDraftId()
    if (lastId && loaded[lastId]) {
      const d = loaded[lastId]
      setBlocks(d.blocks)
      setPageTitle(d.title || '')
      setMetaDescription(d.description || '')
      setSectionName(d.section || '')
      setDraftName(d.name || 'Untitled')
      setCurrentDraftId(lastId)
    }
    setMounted(true)
  }, [])

  // auto-save current draft every 3 seconds
  useEffect(() => {
    if (!mounted) return
    const interval = setInterval(() => {
      if (currentDraftId) {
        const updated = {
          ...loadDrafts(),
          [currentDraftId]: {
            name: draftName,
            title: pageTitle,
            description: metaDescription,
            section: sectionName,
            blocks,
            updatedAt: Date.now(),
          },
        }
        saveDrafts(updated)
        setDrafts(updated)
        setLastSaved(new Date())
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [mounted, currentDraftId, blocks, pageTitle, metaDescription, sectionName, draftName])

  const handleNewDraft = useCallback(() => {
    setShowDraftList(false)
    setShowTemplatePicker(true)
  }, [])

  const handleCreateFromTemplate = useCallback((template) => {
    const data = template.create()
    const id = `draft-${Date.now()}`
    setBlocks(data.blocks)
    setPageTitle(data.title)
    setMetaDescription(data.description)
    setSectionName(data.section)
    setDraftName(template.id === 'blank' ? 'Untitled' : template.name)
    setCurrentDraftId(id)
    saveCurrentDraftId(id)
    const updated = {
      ...loadDrafts(),
      [id]: {
        name: template.id === 'blank' ? 'Untitled' : template.name,
        title: data.title,
        description: data.description,
        section: data.section,
        blocks: data.blocks,
        updatedAt: Date.now(),
      },
    }
    saveDrafts(updated)
    setDrafts(updated)
    setShowTemplatePicker(false)
    showToast(`Created from "${template.name}"`)
  }, [showToast])

  const handleNewBlankDraft = useCallback(() => {
    const blank = PAGE_TEMPLATES.find((t) => t.id === 'blank')
    if (blank) handleCreateFromTemplate(blank)
  }, [handleCreateFromTemplate])

  const handleLoadDraft = useCallback(
    (id) => {
      const all = loadDrafts()
      const d = all[id]
      if (!d) return
      setBlocks(d.blocks)
      setPageTitle(d.title || '')
      setMetaDescription(d.description || '')
      setSectionName(d.section || '')
      setDraftName(d.name || 'Untitled')
      setCurrentDraftId(id)
      saveCurrentDraftId(id)
      setShowDraftList(false)
      showToast(`Loaded "${d.name || 'Untitled'}"`)
    },
    [showToast],
  )

  const handleDeleteDraft = useCallback(
    (id) => {
      const all = loadDrafts()
      const name = all[id]?.name || 'draft'
      delete all[id]
      saveDrafts(all)
      setDrafts(all)
      if (currentDraftId === id) {
        setCurrentDraftId(null)
        setBlocks([
          createEmptyBlock('leadParagraph'),
          createEmptyBlock('divider'),
          createEmptyBlock('heading2'),
        ])
        setPageTitle('')
        setMetaDescription('')
        setSectionName('')
        setDraftName('Untitled')
        saveCurrentDraftId('')
      }
      showToast(`Deleted "${name}"`)
    },
    [currentDraftId, showToast],
  )

  const handleSaveNow = useCallback(() => {
    let id = currentDraftId
    if (!id) {
      id = `draft-${Date.now()}`
      setCurrentDraftId(id)
      saveCurrentDraftId(id)
    }
    const updated = {
      ...loadDrafts(),
      [id]: {
        name: draftName,
        title: pageTitle,
        description: metaDescription,
        section: sectionName,
        blocks,
        updatedAt: Date.now(),
      },
    }
    saveDrafts(updated)
    setDrafts(updated)
    setLastSaved(new Date())
    showToast('Saved!')
  }, [currentDraftId, draftName, pageTitle, metaDescription, sectionName, blocks, showToast])

  // keyboard shortcuts
  useEffect(() => {
    function handler(e) {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === 's') {
        e.preventDefault()
        handleSaveNow()
      }
      if (mod && e.key === 'e') {
        e.preventDefault()
        setShowExport(true)
      }
      if (mod && e.key === '1') {
        e.preventDefault()
        setView('editor')
      }
      if (mod && e.key === '2') {
        e.preventDefault()
        setView('split')
      }
      if (mod && e.key === '3') {
        e.preventDefault()
        setView('preview')
      }
      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
      if (mod && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        redo()
      }
      // ? key opens shortcuts help (only when not typing in an input)
      if (
        e.key === '?' &&
        !mod &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)
      ) {
        e.preventDefault()
        setShowShortcuts((v) => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSaveNow, undo, redo])

  const markdocOutput = generateMarkdoc(
    { title: pageTitle, description: metaDescription },
    blocks,
  )

  const wordCount = countWords(blocks)

  useEffect(() => {
    if (mounted && !currentDraftId) {
      handleNewBlankDraft()
    }
  }, [mounted, currentDraftId, handleNewBlankDraft])

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-slate-900">
        <div className="text-slate-500">Loading builder...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-white dark:bg-slate-900">
      {/* top bar */}
      <div className="flex-none border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        {/* logo, draft name, key actions */}
        <div className="flex items-center justify-between px-3 py-2 sm:px-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <a
              href="/"
              className="hidden text-sm font-medium text-slate-500 hover:text-slate-700 sm:block dark:text-slate-400 dark:hover:text-slate-200"
            >
              ← Docs
            </a>
            <a
              href="/"
              className="text-sm font-medium text-slate-500 sm:hidden dark:text-slate-400"
            >
              ←
            </a>
            <div className="hidden h-5 w-px bg-slate-200 sm:block dark:bg-slate-700" />
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              className="min-w-0 flex-1 border-0 bg-transparent px-1 py-0.5 font-display text-sm font-medium text-slate-900 outline-none focus:ring-0 sm:flex-initial dark:text-white"
              placeholder="Draft name..."
            />
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDraftList(!showDraftList)}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Drafts ▾
              </button>

              {/* draft list dropdown */}
              {showDraftList && (
                <div className="absolute right-0 top-full z-50 mt-1 w-72 rounded-lg border border-slate-200 bg-white p-2 shadow-xl sm:left-0 sm:right-auto dark:border-slate-700 dark:bg-slate-800">
                  <div className="mb-2 flex items-center justify-between px-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Your Drafts
                    </span>
                    <button
                      onClick={handleNewDraft}
                      className="rounded bg-sky-500 px-2 py-0.5 text-xs text-white hover:bg-sky-600"
                    >
                      + New
                    </button>
                  </div>
                  {Object.keys(drafts).length === 0 ? (
                    <p className="px-2 py-4 text-center text-xs text-slate-400">
                      No drafts yet
                    </p>
                  ) : (
                    <ul className="max-h-64 space-y-1 overflow-y-auto">
                      {Object.entries(drafts)
                        .sort(
                          ([, a], [, b]) =>
                            (b.updatedAt || 0) - (a.updatedAt || 0),
                        )
                        .map(([id, draft]) => (
                          <li
                            key={id}
                            className={`group flex items-center justify-between rounded-md px-2 py-1.5 ${
                              id === currentDraftId
                                ? 'bg-sky-50 dark:bg-sky-900/20'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                            }`}
                          >
                            <button
                              onClick={() => handleLoadDraft(id)}
                              className="flex-1 text-left"
                            >
                              <div className="text-sm font-medium text-slate-900 dark:text-white">
                                {draft.name || 'Untitled'}
                              </div>
                              <div className="text-xs text-slate-400">
                                {draft.updatedAt
                                  ? new Date(
                                      draft.updatedAt,
                                    ).toLocaleDateString()
                                  : 'Unknown'}
                              </div>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteDraft(id)
                              }}
                              className="ml-2 text-xs text-red-400 hover:text-red-600 sm:hidden sm:group-hover:block"
                            >
                              ✕
                            </button>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* status bar - desktop only */}
            <div className="mr-2 hidden items-center gap-3 text-[11px] text-slate-400 lg:flex">
              <span>{wordCount} word{wordCount !== 1 ? 's' : ''}</span>
              <span>·</span>
              <span>{blocks.length} block{blocks.length !== 1 ? 's' : ''}</span>
              {lastSaved && (
                <>
                  <span>·</span>
                  <span>Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </>
              )}
            </div>

            {/* undo/redo */}
            <div className="mr-0.5 flex rounded-lg border border-slate-200 sm:mr-1 dark:border-slate-700">
              <button
                onClick={undo}
                disabled={!canUndo}
                title="Undo (⌘Z)"
                className="rounded-l-md px-2 py-1 text-xs text-slate-500 transition hover:bg-slate-50 disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                ↩
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                title="Redo (⌘⇧Z)"
                className="rounded-r-md px-2 py-1 text-xs text-slate-500 transition hover:bg-slate-50 disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                ↪
              </button>
            </div>

            {/* toggle buttons - desktop only */}
            <div className="mr-1 hidden items-center gap-1 md:flex">
              <button
                onClick={() => setScrollSyncEnabled((v) => !v)}
                title={scrollSyncEnabled ? 'Scroll sync ON' : 'Scroll sync OFF'}
                className={`rounded-md px-2 py-1 text-[10px] font-medium transition ${
                  scrollSyncEnabled
                    ? 'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400'
                    : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                Sync
              </button>
              <button
                onClick={() => setFocusMode((v) => !v)}
                title={focusMode ? 'Focus mode ON' : 'Focus mode OFF'}
                className={`rounded-md px-2 py-1 text-[10px] font-medium transition ${
                  focusMode
                    ? 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400'
                    : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                Focus
              </button>
            </div>

            {/* view toggles - hide split on mobile */}
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setView('editor')}
                title="⌘1"
                className={`rounded-l-md px-2.5 py-1 text-xs font-medium transition sm:px-3 ${
                  view === 'editor'
                    ? 'bg-sky-500 text-white'
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                Edit
              </button>
              <button
                onClick={() => setView('split')}
                title="⌘2"
                className={`hidden px-3 py-1 text-xs font-medium transition md:block ${
                  view === 'split'
                    ? 'bg-sky-500 text-white'
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                Split
              </button>
              <button
                onClick={() => setView('preview')}
                title="⌘3"
                className={`rounded-r-md px-2.5 py-1 text-xs font-medium transition sm:px-3 ${
                  view === 'preview'
                    ? 'bg-sky-500 text-white'
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                Preview
              </button>
            </div>

            {/* save (text on desktop, icon on mobile) */}
            <button
              onClick={handleSaveNow}
              title="⌘S"
              className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 sm:px-3 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <span className="hidden sm:inline">Save</span>
              <span className="sm:hidden">💾</span>
            </button>

            {/* shortcuts - desktop only */}
            <button
              onClick={() => setShowShortcuts(true)}
              title="Keyboard shortcuts (?)"
              className="hidden rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50 sm:block dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              ?
            </button>

            {/* export */}
            <button
              onClick={() => setShowExport(true)}
              title="⌘E"
              className="hidden rounded-md bg-sky-500 px-3 py-1 text-xs font-medium text-white hover:bg-sky-600 sm:block"
            >
              Export
            </button>

            {/* submit PR - desktop */}
            <button
              onClick={() => setShowSubmitPR(true)}
              className="hidden rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 sm:block"
            >
              Submit PR
            </button>

            {/* mobile overflow menu */}
            <MobileOverflowMenu
              onExport={() => setShowExport(true)}
              onSubmitPR={() => setShowSubmitPR(true)}
              onShortcuts={() => setShowShortcuts(true)}
              onFocusMode={() => setFocusMode((v) => !v)}
              focusMode={focusMode}
            />
          </div>
        </div>
      </div>

      {/* main content area */}
      <div className="relative flex min-h-0 flex-1" ref={splitContainerRef}>
        {/* editor pane - on mobile, split falls back to editor */}
        {(view === 'editor' || view === 'split') && (
          <div
            ref={view === 'split' ? editorRef : undefined}
            className={`flex flex-col overflow-y-auto ${view === 'split' ? 'hidden md:flex' : 'w-full'}`}
            style={view === 'split' ? { width: `${splitPercent}%` } : undefined}
          >
            {/* collapsible page meta fields */}
            <div className="border-b border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setMetaCollapsed((v) => !v)}
                className="flex w-full items-center gap-2 px-4 pt-4 pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600 sm:px-8 dark:hover:text-slate-300"
              >
                <span
                  className={`inline-block transition-transform ${metaCollapsed ? '' : 'rotate-90'}`}
                >
                  ▶
                </span>
                Page Meta
              </button>
              {!metaCollapsed && (
                <div className="px-4 pb-4 sm:px-8">
                  <input
                    type="text"
                    value={sectionName}
                    onChange={(e) => setSectionName(e.target.value)}
                    placeholder="Section name (e.g., Getting Started)"
                    className="mt-2 w-full border-0 bg-transparent text-xs font-medium text-sky-500 outline-none placeholder:text-slate-300 focus:ring-0 dark:placeholder:text-slate-600"
                  />
                  <input
                    type="text"
                    value={pageTitle}
                    onChange={(e) => setPageTitle(e.target.value)}
                    placeholder="Page title"
                    className="w-full border-0 bg-transparent font-display text-2xl font-bold text-slate-900 outline-none placeholder:text-slate-300 focus:ring-0 sm:text-3xl dark:text-white dark:placeholder:text-slate-600"
                  />
                  <input
                    type="text"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="Meta description for SEO"
                    className="mt-2 w-full border-0 bg-transparent text-sm text-slate-500 outline-none placeholder:text-slate-300 focus:ring-0 dark:text-slate-400 dark:placeholder:text-slate-600"
                  />
                </div>
              )}
              {metaCollapsed && pageTitle && (
                <div className="px-4 pb-3 text-sm font-medium text-slate-600 sm:px-8 dark:text-slate-300">
                  {pageTitle}
                </div>
              )}
            </div>

            {/* block editor */}
            <div className={`flex-1 px-3 py-4 sm:px-8 sm:py-6 ${focusMode ? 'builder-focus-mode' : ''}`}>
              <PageBuilder blocks={blocks} setBlocks={setBlocks} />
            </div>
          </div>
        )}

        {/* on mobile in split mode, show full-width editor; mobile looks horrible if splits */}
        {view === 'split' && (
          <div className="flex w-full flex-col overflow-y-auto md:hidden">
            {/* collapsible page meta fields - mobile split fallback */}
            <div className="border-b border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setMetaCollapsed((v) => !v)}
                className="flex w-full items-center gap-2 px-4 pt-4 pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <span className={`inline-block transition-transform ${metaCollapsed ? '' : 'rotate-90'}`}>▶</span>
                Page Meta
              </button>
              {!metaCollapsed && (
                <div className="px-4 pb-4">
                  <input type="text" value={sectionName} onChange={(e) => setSectionName(e.target.value)} placeholder="Section name" className="mt-2 w-full border-0 bg-transparent text-xs font-medium text-sky-500 outline-none placeholder:text-slate-300 focus:ring-0 dark:placeholder:text-slate-600" />
                  <input type="text" value={pageTitle} onChange={(e) => setPageTitle(e.target.value)} placeholder="Page title" className="w-full border-0 bg-transparent font-display text-2xl font-bold text-slate-900 outline-none placeholder:text-slate-300 focus:ring-0 dark:text-white dark:placeholder:text-slate-600" />
                  <input type="text" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} placeholder="Meta description" className="mt-2 w-full border-0 bg-transparent text-sm text-slate-500 outline-none placeholder:text-slate-300 focus:ring-0 dark:text-slate-400 dark:placeholder:text-slate-600" />
                </div>
              )}
              {metaCollapsed && pageTitle && (
                <div className="px-4 pb-3 text-sm font-medium text-slate-600 dark:text-slate-300">{pageTitle}</div>
              )}
            </div>
            <div className={`flex-1 px-3 py-4 ${focusMode ? 'builder-focus-mode' : ''}`}>
              <PageBuilder blocks={blocks} setBlocks={setBlocks} />
            </div>
          </div>
        )}

        {/* draggable split handle for desktop */}
        {view === 'split' && (
          <div
            className="group relative z-10 hidden cursor-col-resize items-center justify-center md:flex"
            style={{ width: '12px', flexShrink: 0, margin: '0 -3px' }}
            onMouseDown={handleSplitMouseDown}
            onDoubleClick={() => setSplitPercent(50)}
            title="Drag to resize. Double-click to reset."
          >
            <div className="h-full w-[2px] rounded-full bg-slate-300 transition-all group-hover:w-[4px] group-hover:bg-sky-400 group-active:w-[4px] group-active:bg-sky-500 dark:bg-slate-600 dark:group-hover:bg-sky-500 dark:group-active:bg-sky-400" />
            {/* grippers */}
            <div className="absolute flex flex-col gap-[3px] transition-opacity">
              <div className="h-[3px] w-[3px] rounded-full bg-slate-400 group-hover:bg-sky-400 dark:bg-slate-500 dark:group-hover:bg-sky-400" />
              <div className="h-[3px] w-[3px] rounded-full bg-slate-400 group-hover:bg-sky-400 dark:bg-slate-500 dark:group-hover:bg-sky-400" />
              <div className="h-[3px] w-[3px] rounded-full bg-slate-400 group-hover:bg-sky-400 dark:bg-slate-500 dark:group-hover:bg-sky-400" />
            </div>
          </div>
        )}

        {/* transparent overlay while dragging to prevent iframe from stealing mouse events */}
        {isDraggingVisual && (
          <div className="absolute inset-0 z-20 cursor-col-resize" />
        )}

        {/* preview pane - hidden on mobile in split mode (editor shown instead) */}
        {(view === 'preview' || view === 'split') && (
          <div
            className={`h-full overflow-hidden bg-white dark:bg-slate-900 ${view === 'split' ? 'hidden md:block' : 'w-full'}`}
            style={view === 'split' ? { width: `${100 - splitPercent}%` } : undefined}
          >
            <PreviewFrame
              ref={view === 'split' ? previewRef : undefined}
              className="h-full w-full"
              onReady={() => setIframeReady((n) => n + 1)}
            >
              <BuilderPreview
                title={pageTitle}
                blocks={blocks}
                section={sectionName}
              />
            </PreviewFrame>
          </div>
        )}
      </div>

      {/* export modal */}
      {showExport && (
        <ExportModal
          markdoc={markdocOutput}
          title={pageTitle}
          wordCount={wordCount}
          blockCount={blocks.length}
          onClose={() => setShowExport(false)}
          onSubmitPR={() => setShowSubmitPR(true)}
        />
      )}

      {/* template picker modal */}
      {showTemplatePicker && (
        <TemplatePicker
          onSelect={handleCreateFromTemplate}
          onClose={() => setShowTemplatePicker(false)}
        />
      )}

      {/* keyboard shortcuts panel */}
      {showShortcuts && (
        <ShortcutsPanel onClose={() => setShowShortcuts(false)} />
      )}

      {/* submit as PR modal */}
      {showSubmitPR && (
        <SubmitPRModal
          markdoc={markdocOutput}
          pageTitle={pageTitle}
          sectionName={sectionName}
          onClose={() => setShowSubmitPR(false)}
        />
      )}

      {/* toast notification */}
      <Toast message={toast.message} visible={toast.visible} />
    </div>
  )
}
