import React, { useEffect, useRef } from 'react'
import {
  TbStar, TbStarFilled, TbPin, TbPinned, TbTrash, TbCopy,
  TbRestore, TbTrashX, TbEdit
} from 'react-icons/tb'

export default function ContextMenu({ x, y, note, view, onClose, onTrash, onDelete, onRestore, onDuplicate, onToggleFavorite, onTogglePin, onSelect }) {
  const menuRef = useRef(null)

  // Adjust position so menu stays within viewport
  const adjustedX = Math.min(x, window.innerWidth - 200)
  const adjustedY = Math.min(y, window.innerHeight - 250)

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('contextmenu', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('contextmenu', handler)
    }
  }, [onClose])

  const isTrash = view === 'trash'

  function action(fn, ...args) {
    fn(...args)
    onClose()
  }

  return (
    <div
      ref={menuRef}
      className="context-menu fixed z-50 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-100/80 py-1.5 w-52 overflow-hidden"
      style={{ left: adjustedX, top: adjustedY }}
    >
      <div className="px-3 py-2 border-b border-slate-100 mb-1">
        <p className="text-xs font-semibold text-slate-700 truncate">{note.title || 'Untitled Note'}</p>
      </div>

      {!isTrash && (
        <>
          <MenuItem
            icon={<TbEdit size={15} />}
            label="Open note"
            onClick={() => action(onSelect, note)}
          />
          <div className="my-1 border-t border-slate-100" />
          <MenuItem
            icon={note.favorite ? <TbStarFilled size={15} className="text-yellow-500" /> : <TbStar size={15} />}
            label={note.favorite ? 'Remove from favorites' : 'Add to favorites'}
            onClick={() => action(onToggleFavorite, note.id)}
          />
          <MenuItem
            icon={note.pinned ? <TbPinned size={15} className="text-blue-500" /> : <TbPin size={15} />}
            label={note.pinned ? 'Unpin note' : 'Pin note'}
            onClick={() => action(onTogglePin, note.id)}
          />
          <div className="my-1 border-t border-slate-100" />
          <MenuItem
            icon={<TbCopy size={15} />}
            label="Duplicate note"
            onClick={() => action(onDuplicate, note.id)}
            shortcut="Ctrl+D"
          />
          <div className="my-1 border-t border-slate-100" />
          <MenuItem
            icon={<TbTrash size={15} />}
            label="Move to trash"
            onClick={() => action(onTrash, note.id)}
            danger
          />
        </>
      )}

      {isTrash && (
        <>
          <MenuItem
            icon={<TbRestore size={15} />}
            label="Restore note"
            onClick={() => action(onRestore, note.id)}
          />
          <div className="my-1 border-t border-slate-100" />
          <MenuItem
            icon={<TbTrashX size={15} />}
            label="Delete permanently"
            onClick={() => action(onDelete, note.id)}
            danger
          />
        </>
      )}
    </div>
  )
}

function MenuItem({ icon, label, onClick, danger, shortcut }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
        danger
          ? 'text-red-500 hover:bg-red-50'
          : 'text-slate-700 hover:bg-blue-50 hover:text-blue-600'
      }`}
    >
      <span className="flex items-center gap-2.5">
        {icon}
        {label}
      </span>
      {shortcut && <span className="text-xs text-slate-400">{shortcut}</span>}
    </button>
  )
}
