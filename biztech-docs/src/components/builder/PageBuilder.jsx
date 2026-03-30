'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createEmptyBlock, BLOCK_TYPES } from '@/lib/builder/blocks'
import { BlockEditor } from './BlockEditor'

export function PageBuilder({ blocks, setBlocks }) {
  const blockRefs = useRef({})
  const [dragFrom, setDragFrom] = useState(null)
  const [dragOver, setDragOver] = useState(null)

  const updateBlock = useCallback(
    (id, updates) => {
      setBlocks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...updates } : b)),
      )
    },
    [setBlocks],
  )

  const deleteBlock = useCallback(
    (id) => {
      setBlocks((prev) => {
        const idx = prev.findIndex((b) => b.id === id)
        const filtered = prev.filter((b) => b.id !== id)
        if (filtered.length === 0) return [createEmptyBlock('paragraph')]
        // focus the block above or below after delete
        const focusIdx = Math.min(idx, filtered.length - 1)
        setTimeout(() => {
          const el = blockRefs.current[filtered[focusIdx]?.id]
          if (el) el.focus()
        }, 50)
        return filtered
      })
    },
    [setBlocks],
  )

  const insertBlockAfter = useCallback(
    (afterId, type = 'paragraph') => {
      const newBlock = createEmptyBlock(type)
      setBlocks((prev) => {
        const idx = prev.findIndex((b) => b.id === afterId)
        const copy = [...prev]
        copy.splice(idx + 1, 0, newBlock)
        return copy
      })
      // focus the new block after render
      setTimeout(() => {
        const el = blockRefs.current[newBlock.id]
        if (el) el.focus()
      }, 50)
      return newBlock.id
    },
    [setBlocks],
  )

  const moveBlock = useCallback(
    (id, direction) => {
      setBlocks((prev) => {
        const idx = prev.findIndex((b) => b.id === id)
        if (idx < 0) return prev
        const newIdx = idx + direction
        if (newIdx < 0 || newIdx >= prev.length) return prev
        const copy = [...prev]
        ;[copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]]
        return copy
      })
    },
    [setBlocks],
  )

  const changeBlockType = useCallback(
    (id, newType) => {
      setBlocks((prev) =>
        prev.map((b) => {
          if (b.id !== id) return b
          const fresh = createEmptyBlock(newType)
          return { ...fresh, id: b.id, content: b.content }
        }),
      )
    },
    [setBlocks],
  )

  const duplicateBlock = useCallback(
    (id) => {
      setBlocks((prev) => {
        const idx = prev.findIndex((b) => b.id === id)
        if (idx < 0) return prev
        const original = prev[idx]
        const copy = {
          ...JSON.parse(JSON.stringify(original)),
          id: createEmptyBlock('paragraph').id,
        }
        const arr = [...prev]
        arr.splice(idx + 1, 0, copy)
        return arr
      })
    },
    [setBlocks],
  )

  // drag-and-drop handlers using refs to avoid excessive re-renders
  const dragFromRef = useRef(null)
  const dragOverRef = useRef(null)
  const handleDragStart = useCallback((idx) => {
    dragFromRef.current = idx
    setDragFrom(idx)
  }, [])
  const handleDragOver = useCallback((idx) => {
    if (dragOverRef.current !== idx) {
      dragOverRef.current = idx
      setDragOver(idx)
    }
  }, [])
  const handleDragEnd = useCallback(() => {
    const from = dragFromRef.current
    const over = dragOverRef.current
    if (from !== null && over !== null && from !== over) {
      setBlocks((prev) => {
        const copy = [...prev]
        const [moved] = copy.splice(from, 1)
        copy.splice(over, 0, moved)
        return copy
      })
    }
    dragFromRef.current = null
    dragOverRef.current = null
    setDragFrom(null)
    setDragOver(null)
  }, [setBlocks])

  return (
    <div className="space-y-1">
      {blocks.map((block, index) => (
        <BlockEditor
          key={block.id}
          block={block}
          index={index}
          total={blocks.length}
          updateBlock={updateBlock}
          deleteBlock={deleteBlock}
          insertBlockAfter={insertBlockAfter}
          moveBlock={moveBlock}
          changeBlockType={changeBlockType}
          duplicateBlock={duplicateBlock}
          registerRef={(el) => {
            blockRefs.current[block.id] = el
          }}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          isDragTarget={dragOver === index && dragFrom !== index}
        />
      ))}

      {/* add block button at the bottom */}
      <AddBlockButton
        onAdd={(type) => {
          const lastId = blocks[blocks.length - 1]?.id
          if (lastId) {
            insertBlockAfter(lastId, type)
          } else {
            setBlocks([createEmptyBlock(type)])
          }
        }}
      />
    </div>
  )
}

function AddBlockButton({ onAdd }) {
  const [showPicker, setShowPicker] = useState(false)
  const pickerRef = useRef(null)

  // close picker on outside click
  useEffect(() => {
    if (!showPicker) return
    function handler(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowPicker(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showPicker])

  return (
    <div className="flex items-center justify-center py-4">
      <div className="relative" ref={pickerRef}>
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="flex items-center gap-2 rounded-lg border-2 border-dashed border-slate-200 px-4 py-2.5 text-sm text-slate-400 transition hover:border-sky-300 hover:text-sky-500 active:border-sky-400 active:text-sky-500 dark:border-slate-700 dark:text-slate-500 dark:hover:border-sky-600 dark:hover:text-sky-400 sm:py-2"
        >
          <span className="text-lg leading-none">+</span> Add block
          <kbd className="ml-1 hidden rounded bg-slate-100 px-1 py-0.5 text-[9px] font-medium text-slate-400 sm:inline dark:bg-slate-800 dark:text-slate-500">
            / on empty
          </kbd>
        </button>

        {/* block type picker */}
        {showPicker && (
          <div className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2">
            <div className="max-h-[min(24rem,50vh)] w-60 overflow-y-auto overscroll-contain rounded-lg border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-800">
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Block types
              </div>
              {Object.entries(BLOCK_TYPES).map(([type, meta]) => (
                <button
                  key={type}
                  onClick={() => {
                    onAdd(type)
                    setShowPicker(false)
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 active:bg-sky-50 sm:py-1.5 dark:text-slate-300 dark:hover:bg-slate-700/50"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded bg-slate-100 text-xs dark:bg-slate-700">
                    {meta.icon}
                  </span>
                  <span className="flex-1">{meta.label}</span>
                  {meta.shortcut && (
                    <kbd className="hidden rounded bg-slate-100 px-1 py-0.5 text-[9px] text-slate-400 sm:inline dark:bg-slate-700">
                      /{meta.shortcut}
                    </kbd>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
