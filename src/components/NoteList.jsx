import React from 'react'
import { TbSortDescending, TbPlus, TbTrash, TbPin, TbStar, TbNotes } from 'react-icons/tb'
import { formatRelativeTime, stripHtml, truncate } from '../utils/helpers'

const SORT_OPTIONS = [
  { value: 'updated', label: 'Last edited' },
  { value: 'created', label: 'Date created' },
  { value: 'title', label: 'Title A–Z' },
]

export default function NoteList({
  notes, activeNote, view, searchQuery, sortBy, setSortBy,
  onSelectNote, onCreateNote, onContextMenu, onEmptyTrash, searchBar,
}) {
  const isTrash = view === 'trash'
  const title = getViewTitle(view)

  return (
    <div
      className="flex flex-col w-72 h-full shrink-0"
      style={{
        background: 'rgba(255,255,255,0.45)',
        backdropFilter: 'blur(16px)',
        borderRight: '1px solid rgba(255,255,255,0.4)',
      }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-800">{title}</h2>
          <div className="flex items-center gap-1">
            {/* Sort dropdown */}
            <div className="relative group">
              <button className="p-1.5 rounded-lg text-slate-500 hover:bg-white/70 hover:text-slate-700 transition-all" title="Sort">
                <TbSortDescending size={17} />
              </button>
              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50 hidden group-hover:block">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      sortBy === opt.value ? 'text-blue-600 bg-blue-50 font-medium' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {!isTrash && (
              <button
                onClick={onCreateNote}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-blue-500 hover:text-white transition-all"
                title="New note (Ctrl+N)"
              >
                <TbPlus size={17} />
              </button>
            )}
          </div>
        </div>

        {/* Search bar */}
        {searchBar}
      </div>

      {/* Note count + trash action */}
      <div className="px-4 py-1.5 flex items-center justify-between shrink-0">
        <span className="text-xs text-slate-400 font-medium">
          {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          {searchQuery && ` for "${searchQuery}"`}
        </span>
        {isTrash && notes.length > 0 && (
          <button
            onClick={onEmptyTrash}
            className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 transition-colors"
          >
            <TbTrash size={12} />
            Empty trash
          </button>
        )}
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 min-h-0 space-y-1">
        {notes.length === 0 ? (
          <EmptyState view={view} onCreateNote={onCreateNote} searchQuery={searchQuery} />
        ) : (
          notes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              active={activeNote?.id === note.id}
              onClick={() => onSelectNote(note)}
              onContextMenu={(e) => onContextMenu(e, note)}
              searchQuery={searchQuery}
            />
          ))
        )}
      </div>
    </div>
  )
}

function NoteCard({ note, active, onClick, onContextMenu, searchQuery }) {
  const preview = truncate(stripHtml(note.content), 90)
  const date = formatRelativeTime(note.updated_at)

  return (
    <div
      className={`note-card p-3 rounded-xl cursor-pointer select-none ${
        active
          ? 'bg-blue-500 shadow-md'
          : 'hover:bg-white/80 hover:shadow-sm'
      }`}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      {/* Top row: pin/star badges + date */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          {note.pinned === 1 && (
            <TbPin size={12} className={`shrink-0 ${active ? 'text-blue-100' : 'text-blue-400'}`} />
          )}
          {note.favorite === 1 && (
            <TbStar size={12} className={`shrink-0 ${active ? 'text-yellow-200' : 'text-yellow-500'}`} />
          )}
          <h3 className={`text-sm font-semibold truncate ${active ? 'text-white' : 'text-slate-800'}`}>
            {note.title || 'Untitled Note'}
          </h3>
        </div>
        <span className={`text-xs shrink-0 ${active ? 'text-blue-100' : 'text-slate-400'}`}>
          {date}
        </span>
      </div>

      {/* Preview */}
      <p className={`text-xs leading-relaxed line-clamp-2 ${active ? 'text-blue-100' : 'text-slate-500'}`}>
        {preview || 'No content yet...'}
      </p>

      {/* Category tag */}
      {note.category && (
        <div className="mt-2">
          <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
            active ? 'bg-blue-400/50 text-blue-50' : 'bg-blue-50 text-blue-500'
          }`}>
            {note.category}
          </span>
        </div>
      )}
    </div>
  )
}

function EmptyState({ view, onCreateNote, searchQuery }) {
  if (searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center px-4">
        <TbNotes size={36} className="text-slate-300 mb-3" />
        <p className="text-sm text-slate-500 font-medium">No results found</p>
        <p className="text-xs text-slate-400 mt-1">Try a different search term</p>
      </div>
    )
  }
  if (view === 'trash') {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center px-4">
        <TbTrash size={36} className="text-slate-300 mb-3" />
        <p className="text-sm text-slate-500 font-medium">Trash is empty</p>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center justify-center h-48 text-center px-4">
      <TbNotes size={36} className="text-slate-300 mb-3" />
      <p className="text-sm text-slate-500 font-medium">No notes here</p>
      <button
        onClick={onCreateNote}
        className="mt-3 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
      >
        Create your first note →
      </button>
    </div>
  )
}

function getViewTitle(view) {
  if (view === 'all') return 'All Notes'
  if (view === 'favorites') return 'Favorites'
  if (view === 'pinned') return 'Pinned'
  if (view === 'recent') return 'Recent'
  if (view === 'trash') return 'Trash'
  if (view.startsWith('category:')) return view.replace('category:', '')
  return 'Notes'
}
