import React, { useState } from 'react'
import {
  TbNotes, TbStar, TbPin, TbClock, TbTrash, TbSettings,
  TbPlus, TbTag, TbChevronDown, TbChevronRight, TbX,
  TbFileImport, TbFileExport, TbFolder
} from 'react-icons/tb'

const NAV_ITEMS = [
  { id: 'all', label: 'All Notes', icon: TbNotes },
  { id: 'favorites', label: 'Favorites', icon: TbStar },
  { id: 'pinned', label: 'Pinned', icon: TbPin },
  { id: 'recent', label: 'Recent', icon: TbClock },
  { id: 'trash', label: 'Trash', icon: TbTrash },
]

export default function Sidebar({ view, setView, categories, onCreateNote, onCreateCategory, onDeleteCategory, onImport, onExport, activeNote, showToast }) {
  const [catExpanded, setCatExpanded] = useState(true)
  const [newCatName, setNewCatName] = useState('')
  const [addingCat, setAddingCat] = useState(false)
  const [exportMenu, setExportMenu] = useState(false)

  async function handleAddCategory() {
    if (!newCatName.trim()) return
    await onCreateCategory(newCatName.trim())
    setNewCatName('')
    setAddingCat(false)
    showToast('Category added')
  }

  return (
    <div
      className="flex flex-col w-56 h-full shrink-0 py-3"
      style={{
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.45)',
      }}
    >
      {/* New Note button */}
      <div className="px-3 mb-3">
        <button
          onClick={onCreateNote}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold shadow-md hover:shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 active:scale-95"
        >
          <TbPlus size={18} />
          New Note
        </button>
      </div>

      {/* Navigation */}
      <nav className="px-2 space-y-0.5">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = view === id
          return (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`sidebar-item w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-white/70 hover:text-slate-800'
              }`}
            >
              <Icon size={17} className={active ? 'text-white' : 'text-slate-500'} />
              {label}
            </button>
          )
        })}
      </nav>

      {/* Divider */}
      <div className="mx-3 my-3 border-t border-slate-200/60" />

      {/* Categories */}
      <div className="px-2 flex-1 overflow-y-auto min-h-0">
        <button
          onClick={() => setCatExpanded(p => !p)}
          className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <TbTag size={13} />
            Categories
          </span>
          {catExpanded ? <TbChevronDown size={13} /> : <TbChevronRight size={13} />}
        </button>

        {catExpanded && (
          <div className="mt-1 space-y-0.5">
            {categories.map(cat => {
              const active = view === `category:${cat.name}`
              return (
                <div
                  key={cat.id}
                  className={`group flex items-center justify-between px-3 py-1.5 rounded-xl text-sm cursor-pointer transition-all duration-150 ${
                    active ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-600 hover:bg-white/70 hover:text-slate-800'
                  }`}
                  onClick={() => setView(`category:${cat.name}`)}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                    <span className="truncate">{cat.name}</span>
                  </span>
                  {!['General', 'Work', 'Personal', 'Ideas', 'Imported'].includes(cat.name) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteCategory(cat.id) }}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"
                    >
                      <TbX size={13} />
                    </button>
                  )}
                </div>
              )
            })}

            {addingCat ? (
              <div className="px-3 py-1">
                <input
                  autoFocus
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddCategory()
                    if (e.key === 'Escape') { setAddingCat(false); setNewCatName('') }
                  }}
                  placeholder="Category name..."
                  className="w-full px-2 py-1 text-xs rounded-lg border border-blue-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-700"
                  style={{ userSelect: 'text' }}
                />
              </div>
            ) : (
              <button
                onClick={() => setAddingCat(true)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 hover:text-blue-500 transition-colors rounded-xl hover:bg-white/70"
              >
                <TbPlus size={13} />
                Add category
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="px-2 mt-2 space-y-0.5 border-t border-slate-200/60 pt-2">
        {/* Export */}
        <div className="relative">
          <button
            onClick={() => setExportMenu(p => !p)}
            disabled={!activeNote}
            className="sidebar-item w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-white/70 hover:text-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <TbFileExport size={17} className="text-slate-500" />
            Export Note
          </button>
          {exportMenu && activeNote && (
            <div
              className="absolute bottom-full left-2 mb-1 w-40 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50"
              onMouseLeave={() => setExportMenu(false)}
            >
              {[['txt', 'Plain Text (.txt)'], ['html', 'HTML (.html)']].map(([type, label]) => (
                <button
                  key={type}
                  onClick={() => { onExport(type); setExportMenu(false) }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Import */}
        <button
          onClick={onImport}
          className="sidebar-item w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-white/70 hover:text-slate-800 transition-all"
        >
          <TbFileImport size={17} className="text-slate-500" />
          Import TXT
        </button>

        {/* Settings */}
        <button
          onClick={() => setView('settings')}
          className="sidebar-item w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-white/70 hover:text-slate-800 transition-all"
        >
          <TbSettings size={17} className="text-slate-500" />
          Settings
        </button>
      </div>
    </div>
  )
}
