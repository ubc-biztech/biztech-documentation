'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { BLOCK_TYPES } from '@/lib/builder/blocks'

/**
 * auto-resize a textarea to fit its content.
 */
function useAutoResize(ref, value) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = '0'
    el.style.height = el.scrollHeight + 'px'
  }, [ref, value])
}

/**
 * wraps selected text in a textarea with markdown syntax.
 * returns the new content string and cursor position.
 */
function wrapSelection(textarea, before, after) {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = textarea.value
  const selected = text.slice(start, end)

  // if already wrapped, unwrap
  const preBefore = text.slice(Math.max(0, start - before.length), start)
  const postAfter = text.slice(end, end + after.length)
  if (preBefore === before && postAfter === after) {
    const newText =
      text.slice(0, start - before.length) +
      selected +
      text.slice(end + after.length)
    return {
      content: newText,
      cursor: start - before.length,
      cursorEnd: end - before.length,
    }
  }

  const newText =
    text.slice(0, start) + before + selected + after + text.slice(end)
  return {
    content: newText,
    cursor: start + before.length,
    cursorEnd: end + before.length,
  }
}

export function BlockEditor({
  block,
  index,
  total,
  updateBlock,
  deleteBlock,
  insertBlockAfter,
  moveBlock,
  changeBlockType,
  duplicateBlock,
  registerRef,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragTarget,
}) {
  const [showMenu, setShowMenu] = useState(false)
  const [showTypeMenu, setShowTypeMenu] = useState(false)
  const [slashFilter, setSlashFilter] = useState('')
  const textRef = useRef(null)
  const menuRef = useRef(null)

  // close menus on outside click
  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
        setShowTypeMenu(false)
        setSlashFilter('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // register ref for focus 
  useEffect(() => {
    if (textRef.current) {
      registerRef(textRef.current)
    }
  }, [registerRef])

  const handleInlineFormat = useCallback(
    (before, after) => {
      const textarea = textRef.current
      if (!textarea) return
      const result = wrapSelection(textarea, before, after)
      updateBlock(block.id, { content: result.content })
      // restore cursor after react re-render
      requestAnimationFrame(() => {
        textarea.focus()
        textarea.setSelectionRange(result.cursor, result.cursorEnd)
      })
    },
    [block.id, updateBlock],
  )

  const handleKeyDown = (e) => {
    const mod = e.metaKey || e.ctrlKey

    // Inline formatting shortcuts (for text blocks)
    if (
      mod &&
      ['paragraph', 'leadParagraph', 'bulletList', 'numberedList'].includes(
        block.type,
      )
    ) {
      if (e.key === 'b') {
        e.preventDefault()
        handleInlineFormat('**', '**')
        return
      }
      if (e.key === 'i') {
        e.preventDefault()
        handleInlineFormat('_', '_')
        return
      }
      if (e.key === '`') {
        e.preventDefault()
        handleInlineFormat('`', '`')
        return
      }
    }

    // enter on a paragraph/heading inserts a new block below
    if (
      e.key === 'Enter' &&
      !e.shiftKey &&
      !mod &&
      ['paragraph', 'leadParagraph', 'heading2', 'heading3', 'heading4'].includes(
        block.type,
      )
    ) {
      e.preventDefault()
      insertBlockAfter(block.id, 'paragraph')
    }

    // Cmd/Ctrl+Enter on ANY block inserts a new block below
    // (for code, lists, callouts where plain Enter adds a newline)
    if (e.key === 'Enter' && mod && !e.shiftKey) {
      e.preventDefault()
      insertBlockAfter(block.id, 'paragraph')
    }

    // backspace on empty block deletes it
    if (e.key === 'Backspace' && block.content === '' && total > 1) {
      e.preventDefault()
      deleteBlock(block.id)
    }

    // slash command to change type
    if (e.key === '/' && block.content === '') {
      e.preventDefault()
      setShowTypeMenu(true)
      setSlashFilter('')
    }

    // arrow up/down to navigate between blocks
    if (e.key === 'ArrowUp' && index > 0) {
      const el = textRef.current
      if (!el) return
      // only jump to prev block if cursor is at the very start
      const isAtTop =
        el.selectionStart === 0 && el.selectionEnd === 0
      if (isAtTop) {
        e.preventDefault()
        const prevBlock = document.querySelectorAll('[data-block]')[index - 1]
        if (prevBlock) {
          const input = prevBlock.querySelector('textarea, input[type="text"]')
          if (input) {
            input.focus()
            const len = input.value?.length || 0
            input.setSelectionRange?.(len, len)
          }
        }
      }
    }
    if (e.key === 'ArrowDown' && index < total - 1) {
      const el = textRef.current
      if (!el) return
      const val = el.value || ''
      const isAtBottom =
        el.selectionStart === val.length && el.selectionEnd === val.length
      if (isAtBottom) {
        e.preventDefault()
        const nextBlock = document.querySelectorAll('[data-block]')[index + 1]
        if (nextBlock) {
          const input = nextBlock.querySelector('textarea, input[type="text"]')
          if (input) {
            input.focus()
            input.setSelectionRange?.(0, 0)
          }
        }
      }
    }

    // Escape closes menus
    if (e.key === 'Escape') {
      setShowMenu(false)
      setShowTypeMenu(false)
      setSlashFilter('')
    }
  }

  // handle filtering in the slash command menu
  const handleSlashInput = (e) => {
    if (showTypeMenu) {
      const val = e.target.value
      // remove leading slash for filtering
      const filter = val.startsWith('/') ? val.slice(1) : val
      setSlashFilter(filter)
    }
  }

  const filteredTypes = Object.entries(BLOCK_TYPES).filter(
    ([type, meta]) =>
      !slashFilter ||
      meta.label.toLowerCase().includes(slashFilter.toLowerCase()) ||
      type.toLowerCase().includes(slashFilter.toLowerCase()) ||
      (meta.shortcut && meta.shortcut === slashFilter.toLowerCase()),
  )

  const blockMeta = BLOCK_TYPES[block.type] || BLOCK_TYPES.paragraph

  return (
    <div
      data-block={block.id}
      className={`group relative flex items-start gap-1 rounded-lg transition-all ${
        isDragTarget
          ? 'border-t-2 border-sky-400 bg-sky-50/30 dark:bg-sky-900/10'
          : 'border-t-2 border-transparent'
      }`}
      onDragOver={(e) => {
        e.preventDefault()
        onDragOver?.(index)
      }}
      onDragEnd={onDragEnd}
    >
      <div className="flex w-8 flex-none items-center justify-end gap-0.5 pt-1 opacity-100 transition-opacity sm:w-14 sm:opacity-0 sm:group-hover:opacity-100">
        <button
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = 'move'
            onDragStart?.(index)
          }}
          className="hidden h-6 w-6 cursor-grab items-center justify-center rounded text-xs text-slate-400 hover:bg-slate-100 active:cursor-grabbing sm:flex dark:hover:bg-slate-800"
          title="Drag to reorder"
        >
          ⠿
        </button>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex h-6 w-6 items-center justify-center rounded text-xs text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Block options"
        >
          ⋮
        </button>
        <span className="hidden h-5 min-w-[20px] items-center justify-center rounded bg-slate-100 px-1 text-[9px] font-medium text-slate-400 sm:flex dark:bg-slate-800 dark:text-slate-500">
          {blockMeta.icon}
        </span>
      </div>

      {/* block options menu */}
      {showMenu && (
        <div
          ref={menuRef}
          className="absolute left-8 top-8 z-40 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-xl sm:left-14 dark:border-slate-700 dark:bg-slate-800"
        >
          <MenuButton
            onClick={() => {
              setShowMenu(false)
              setShowTypeMenu(true)
              setSlashFilter('')
            }}
          >
            ↻ Change type
          </MenuButton>
          <MenuButton
            onClick={() => {
              duplicateBlock(block.id)
              setShowMenu(false)
            }}
          >
            ⊕ Duplicate
          </MenuButton>
          {index > 0 && (
            <MenuButton
              onClick={() => {
                moveBlock(block.id, -1)
                setShowMenu(false)
              }}
            >
              ↑ Move up
            </MenuButton>
          )}
          {index < total - 1 && (
            <MenuButton
              onClick={() => {
                moveBlock(block.id, 1)
                setShowMenu(false)
              }}
            >
              ↓ Move down
            </MenuButton>
          )}
          <MenuButton
            onClick={() => {
              insertBlockAfter(block.id, 'paragraph')
              setShowMenu(false)
            }}
          >
            + Insert below
          </MenuButton>
          <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
          <MenuButton
            onClick={() => {
              deleteBlock(block.id)
              setShowMenu(false)
            }}
            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            ✕ Delete
          </MenuButton>
        </div>
      )}

      {/* type selector popup (slash command thing) */}
      {showTypeMenu && (
        <div
          ref={menuRef}
          className="absolute left-8 top-8 z-40 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-xl sm:left-14 dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="px-3 py-1.5">
            <input
              autoFocus
              type="text"
              value={slashFilter}
              onChange={(e) => setSlashFilter(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setShowTypeMenu(false)
                  setSlashFilter('')
                }
                if (e.key === 'Enter' && filteredTypes.length > 0) {
                  changeBlockType(block.id, filteredTypes[0][0])
                  setShowTypeMenu(false)
                  setSlashFilter('')
                }
              }}
              placeholder="Filter blocks..."
              className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filteredTypes.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-400">
                No matching blocks
              </div>
            ) : (
              filteredTypes.map(([type, meta]) => (
                <button
                  key={type}
                  onClick={() => {
                    changeBlockType(block.id, type)
                    setShowTypeMenu(false)
                    setSlashFilter('')
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                    block.type === type
                      ? 'font-medium text-sky-600 dark:text-sky-400'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="flex w-6 items-center justify-center text-xs">
                    {meta.icon}
                  </span>
                  <span className="flex-1">{meta.label}</span>
                  {meta.shortcut && (
                    <kbd className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400 dark:bg-slate-700">
                      /{meta.shortcut}
                    </kbd>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/*  actual block content */}
      <div className="min-w-0 flex-1">
        {renderBlockContent(
          block,
          updateBlock,
          textRef,
          handleKeyDown,
          handleSlashInput,
          handleInlineFormat,
        )}
      </div>
    </div>
  )
}

function MenuButton({ children, onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 active:bg-slate-100 sm:py-1.5 dark:text-slate-300 dark:hover:bg-slate-700/50 ${className}`}
    >
      {children}
    </button>
  )
}

/**
 * inline formatting toolbar (bold, italic, code, link) shown on text blocks.
 */
function InlineToolbar({ onFormat }) {
  return (
    <div className="mb-1 flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
      <ToolbarButton
        title="Bold (⌘B)"
        onClick={() => onFormat('**', '**')}
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        title="Italic (⌘I)"
        onClick={() => onFormat('_', '_')}
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton
        title="Code (⌘`)"
        onClick={() => onFormat('`', '`')}
      >
        <code className="text-[10px]">{'{}'}</code>
      </ToolbarButton>
      <ToolbarButton
        title="Link"
        onClick={() => onFormat('[', '](url)')}
      >
        🔗
      </ToolbarButton>
    </div>
  )
}

function ToolbarButton({ children, title, onClick }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex h-6 w-6 items-center justify-center rounded text-[11px] text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
    >
      {children}
    </button>
  )
}

/**
 * auto-resizing textarea component.
 */
function AutoTextarea({ value, onChange, className, placeholder, onKeyDown, innerRef, spellCheck, ...props }) {
  const localRef = useRef(null)
  const ref = innerRef || localRef
  useAutoResize(ref, value)

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      spellCheck={spellCheck}
      rows={1}
      className={`resize-none overflow-hidden ${className}`}
      {...props}
    />
  )
}

/**
 * renders the correct editor UI for each block type.
 */
function renderBlockContent(block, updateBlock, textRef, handleKeyDown, handleSlashInput, handleInlineFormat) {
  const commonClasses =
    'w-full border-0 bg-transparent outline-none focus:ring-0 dark:text-slate-200'

  switch (block.type) {
    case 'leadParagraph':
      return (
        <div>
          <div className="mb-1 flex items-center gap-1.5">
            <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700 dark:bg-sky-900/40 dark:text-sky-400">
              LEAD
            </span>
            <span className="text-[10px] text-slate-400">
              {'First paragraph with {% .lead %} styling'}
            </span>
          </div>
          <InlineToolbar onFormat={handleInlineFormat} />
          <AutoTextarea
            innerRef={textRef}
            value={block.content}
            onChange={(e) => {
              updateBlock(block.id, { content: e.target.value })
              handleSlashInput(e)
            }}
            onKeyDown={handleKeyDown}
            placeholder="A high-level summary of this page..."
            className={`${commonClasses} text-lg leading-relaxed text-slate-500 placeholder:text-slate-300 dark:text-slate-400 dark:placeholder:text-slate-600`}
          />
        </div>
      )

    case 'paragraph':
      return (
        <div>
          <InlineToolbar onFormat={handleInlineFormat} />
          <AutoTextarea
            innerRef={textRef}
            value={block.content}
            onChange={(e) => {
              updateBlock(block.id, { content: e.target.value })
              handleSlashInput(e)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type something... (press / for block types, ⌘B for bold)"
            className={`${commonClasses} text-base leading-relaxed text-slate-700 placeholder:text-slate-300 dark:placeholder:text-slate-600`}
          />
        </div>
      )

    case 'heading2':
      return (
        <input
          ref={textRef}
          type="text"
          value={block.content}
          onChange={(e) => updateBlock(block.id, { content: e.target.value })}
          onKeyDown={handleKeyDown}
          placeholder="Heading 2"
          className={`${commonClasses} font-display text-2xl font-bold text-slate-900 placeholder:text-slate-300 dark:text-white dark:placeholder:text-slate-600`}
        />
      )

    case 'heading3':
      return (
        <input
          ref={textRef}
          type="text"
          value={block.content}
          onChange={(e) => updateBlock(block.id, { content: e.target.value })}
          onKeyDown={handleKeyDown}
          placeholder="Heading 3"
          className={`${commonClasses} font-display text-xl font-semibold text-slate-900 placeholder:text-slate-300 dark:text-white dark:placeholder:text-slate-600`}
        />
      )

    case 'heading4':
      return (
        <input
          ref={textRef}
          type="text"
          value={block.content}
          onChange={(e) => updateBlock(block.id, { content: e.target.value })}
          onKeyDown={handleKeyDown}
          placeholder="Heading 4"
          className={`${commonClasses} font-display text-lg font-semibold text-slate-800 placeholder:text-slate-300 dark:text-slate-100 dark:placeholder:text-slate-600`}
        />
      )

    case 'bulletList':
    case 'numberedList':
      return (
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                {block.type === 'bulletList' ? 'Bullet list' : 'Numbered list'}
              </span>
              <span className="text-[10px] text-slate-300 dark:text-slate-600">
                one item per line
              </span>
            </div>
            <span className="hidden text-[10px] text-slate-300 sm:inline dark:text-slate-600">⌘↵ new block</span>
          </div>
          <InlineToolbar onFormat={handleInlineFormat} />
          <AutoTextarea
            innerRef={textRef}
            value={block.content}
            onChange={(e) =>
              updateBlock(block.id, { content: e.target.value })
            }
            onKeyDown={handleKeyDown}
            placeholder="Item 1&#10;Item 2&#10;Item 3"
            className={`${commonClasses} font-mono text-sm leading-relaxed text-slate-700 placeholder:text-slate-300 dark:placeholder:text-slate-600`}
          />
        </div>
      )

    case 'code':
      return (
        <div className="rounded-lg bg-slate-900 p-3 dark:bg-slate-800/60 dark:ring-1 dark:ring-slate-300/10">
          <div className="mb-2 flex items-center justify-between gap-2">
            <select
              value={block.props.language || 'javascript'}
              onChange={(e) =>
                updateBlock(block.id, {
                  props: { ...block.props, language: e.target.value },
                })
              }
              className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs text-slate-300"
            >
              {[
                'javascript',
                'typescript',
                'jsx',
                'tsx',
                'python',
                'bash',
                'json',
                'yaml',
                'html',
                'css',
                'sql',
                'graphql',
                'markdown',
                'text',
              ].map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
            <span className="hidden text-[10px] text-slate-600 sm:inline">⌘↵ new block</span>
          </div>
          <AutoTextarea
            innerRef={textRef}
            value={block.content}
            onChange={(e) =>
              updateBlock(block.id, { content: e.target.value })
            }
            onKeyDown={handleKeyDown}
            placeholder="// paste or write code here..."
            className="w-full border-0 bg-transparent font-mono text-sm leading-relaxed text-slate-100 outline-none placeholder:text-slate-500 focus:ring-0"
            spellCheck={false}
          />
        </div>
      )

    case 'callout':
      return (
        <div
          className={`rounded-2xl p-4 ${
            block.props.type === 'warning'
              ? 'bg-amber-50 dark:bg-slate-800/60'
              : 'bg-sky-50 dark:bg-slate-800/60'
          }`}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <select
                value={block.props.type || 'note'}
                onChange={(e) =>
                  updateBlock(block.id, {
                    props: { ...block.props, type: e.target.value },
                  })
                }
                className="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
              >
                <option value="note">Note</option>
                <option value="warning">Warning</option>
              </select>
              <input
                type="text"
                value={block.props.title || ''}
                onChange={(e) =>
                  updateBlock(block.id, {
                    props: { ...block.props, title: e.target.value },
                  })
                }
                placeholder="Callout title"
                className="flex-1 border-0 bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400 focus:ring-0 dark:text-white"
              />
            </div>
            <span className="hidden text-[10px] text-slate-300 sm:inline dark:text-slate-600">⌘↵ new block</span>
          </div>
          <AutoTextarea
            innerRef={textRef}
            value={block.content}
            onChange={(e) =>
              updateBlock(block.id, { content: e.target.value })
            }
            onKeyDown={handleKeyDown}
            placeholder="Callout content..."
            className="w-full border-0 bg-transparent text-sm leading-relaxed outline-none placeholder:text-slate-400 focus:ring-0 dark:text-slate-300"
          />
        </div>
      )

    case 'table':
      return <TableBlockEditor block={block} updateBlock={updateBlock} />

    case 'quickLinks':
      return <QuickLinksEditor block={block} updateBlock={updateBlock} />

    case 'divider':
      return (
        <div
          ref={textRef}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className="py-2 outline-none focus:ring-1 focus:ring-sky-200 focus:rounded dark:focus:ring-sky-800"
        >
          <hr className="border-slate-200 dark:border-slate-700" />
        </div>
      )

    case 'image':
      return (
        <div className="space-y-2 rounded-lg border border-dashed border-slate-200 p-3 sm:p-4 dark:border-slate-700">
          <input
            ref={textRef}
            type="text"
            value={block.props.src || ''}
            onChange={(e) =>
              updateBlock(block.id, {
                props: { ...block.props, src: e.target.value },
              })
            }
            onKeyDown={handleKeyDown}
            placeholder="Image URL (e.g., /assets/images/...)"
            className="w-full rounded border border-slate-200 bg-transparent px-2 py-1.5 text-sm outline-none dark:border-slate-700 dark:text-slate-300"
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={block.props.alt || ''}
              onChange={(e) =>
                updateBlock(block.id, {
                  props: { ...block.props, alt: e.target.value },
                })
              }
              placeholder="Alt text"
              className="flex-1 rounded border border-slate-200 bg-transparent px-2 py-1 text-sm outline-none dark:border-slate-700 dark:text-slate-300"
            />
            <input
              type="text"
              value={block.props.caption || ''}
              onChange={(e) =>
                updateBlock(block.id, {
                  props: { ...block.props, caption: e.target.value },
                })
              }
              placeholder="Caption"
              className="flex-1 rounded border border-slate-200 bg-transparent px-2 py-1 text-sm outline-none dark:border-slate-700 dark:text-slate-300"
            />
          </div>
          {block.props.src && (
            <img
              src={block.props.src}
              alt={block.props.alt || ''}
              className="max-h-48 rounded"
            />
          )}
        </div>
      )

    default:
      return (
        <AutoTextarea
          innerRef={textRef}
          value={block.content}
          onChange={(e) => updateBlock(block.id, { content: e.target.value })}
          onKeyDown={handleKeyDown}
          placeholder="..."
          className={`${commonClasses} text-sm`}
        />
      )
  }
}

/**
 * interactive table editor with add/remove row/column.
 */
function TableBlockEditor({ block, updateBlock }) {
  const { headers = [], rows = [] } = block.props

  const updateHeaders = (idx, val) => {
    const h = [...headers]
    h[idx] = val
    updateBlock(block.id, { props: { ...block.props, headers: h } })
  }

  const updateCell = (rowIdx, colIdx, val) => {
    const r = rows.map((row) => [...row])
    r[rowIdx][colIdx] = val
    updateBlock(block.id, { props: { ...block.props, rows: r } })
  }

  const addColumn = () => {
    const h = [...headers, `Column ${headers.length + 1}`]
    const r = rows.map((row) => [...row, ''])
    updateBlock(block.id, { props: { ...block.props, headers: h, rows: r } })
  }

  const removeColumn = (idx) => {
    if (headers.length <= 1) return
    const h = headers.filter((_, i) => i !== idx)
    const r = rows.map((row) => row.filter((_, i) => i !== idx))
    updateBlock(block.id, { props: { ...block.props, headers: h, rows: r } })
  }

  const addRow = () => {
    const r = [...rows, headers.map(() => '')]
    updateBlock(block.id, { props: { ...block.props, rows: r } })
  }

  const removeRow = (idx) => {
    const r = rows.filter((_, i) => i !== idx)
    updateBlock(block.id, { props: { ...block.props, rows: r } })
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="border border-slate-200 dark:border-slate-700 p-0">
                <div className="flex items-center">
                  <input
                    type="text"
                    value={h}
                    onChange={(e) => updateHeaders(i, e.target.value)}
                    className="w-full border-0 bg-slate-50 px-2 py-1.5 text-xs font-semibold outline-none dark:bg-slate-800 dark:text-white"
                    placeholder="Header"
                  />
                  <button
                    onClick={() => removeColumn(i)}
                    className="px-1 text-xs text-red-400 hover:text-red-600"
                    title="Remove column"
                  >
                    ✕
                  </button>
                </div>
              </th>
            ))}
            <th className="w-8 border border-slate-200 dark:border-slate-700">
              <button
                onClick={addColumn}
                className="w-full py-1.5 text-xs text-slate-400 hover:text-sky-500"
                title="Add column"
              >
                +
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {headers.map((_, ci) => (
                <td key={ci} className="border border-slate-200 dark:border-slate-700 p-0">
                  <input
                    type="text"
                    value={row[ci] || ''}
                    onChange={(e) => updateCell(ri, ci, e.target.value)}
                    className="w-full border-0 bg-transparent px-2 py-1.5 text-xs outline-none dark:text-slate-300"
                    placeholder="..."
                  />
                </td>
              ))}
              <td className="w-8 border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => removeRow(ri)}
                  className="w-full py-1.5 text-xs text-red-400 hover:text-red-600"
                  title="Remove row"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={addRow}
        className="mt-1 w-full rounded border border-dashed border-slate-200 py-1 text-xs text-slate-400 hover:border-sky-300 hover:text-sky-500 dark:border-slate-700"
      >
        + Add row
      </button>
    </div>
  )
}

/**
 * quick links editor with add/remove link cards.
 */
function QuickLinksEditor({ block, updateBlock }) {
  const { links = [] } = block.props

  const updateLink = (idx, field, val) => {
    const l = links.map((link, i) =>
      i === idx ? { ...link, [field]: val } : link,
    )
    updateBlock(block.id, { props: { ...block.props, links: l } })
  }

  const addLink = () => {
    const l = [
      ...links,
      { title: '', description: '', href: '', icon: 'installation' },
    ]
    updateBlock(block.id, { props: { ...block.props, links: l } })
  }

  const removeLink = (idx) => {
    const l = links.filter((_, i) => i !== idx)
    updateBlock(block.id, { props: { ...block.props, links: l } })
  }

  return (
    <div className="space-y-2">
      <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
        Quick Links
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {links.map((link, i) => (
          <div
            key={i}
            className="relative rounded-lg border border-slate-200 p-3 dark:border-slate-700"
          >
            <button
              onClick={() => removeLink(i)}
              className="absolute right-2 top-2 text-xs text-red-400 hover:text-red-600"
            >
              ✕
            </button>
            <input
              type="text"
              value={link.title}
              onChange={(e) => updateLink(i, 'title', e.target.value)}
              placeholder="Link title"
              className="w-full border-0 bg-transparent text-sm font-semibold outline-none dark:text-white"
            />
            <input
              type="text"
              value={link.description}
              onChange={(e) => updateLink(i, 'description', e.target.value)}
              placeholder="Description"
              className="mt-1 w-full border-0 bg-transparent text-xs text-slate-500 outline-none dark:text-slate-400"
            />
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={link.href}
                onChange={(e) => updateLink(i, 'href', e.target.value)}
                placeholder="/docs/..."
                className="flex-1 rounded border border-slate-200 bg-transparent px-2 py-0.5 text-xs outline-none dark:border-slate-700 dark:text-slate-300"
              />
              <select
                value={link.icon || 'installation'}
                onChange={(e) => updateLink(i, 'icon', e.target.value)}
                className="rounded border border-slate-200 bg-transparent px-1 py-0.5 text-xs dark:border-slate-700 dark:text-slate-300"
              >
                <option value="installation">Installation</option>
                <option value="presets">Presets</option>
                <option value="plugins">Plugins</option>
                <option value="theming">Theming</option>
                <option value="lightbulb">Lightbulb</option>
                <option value="warning">Warning</option>
              </select>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={addLink}
        className="rounded border border-dashed border-slate-200 px-3 py-1.5 text-xs text-slate-400 hover:border-sky-300 hover:text-sky-500 dark:border-slate-700"
      >
        + Add link card
      </button>
    </div>
  )
}
