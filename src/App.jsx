import React, { useState, useEffect, useCallback, useRef } from 'react'
import TitleBar from './components/TitleBar'
import Sidebar from './components/Sidebar'
import NoteList from './components/NoteList'
import Editor from './components/Editor'
import SearchBar from './components/SearchBar'
import SettingsModal from './components/SettingsModal'
import ContextMenu from './components/ContextMenu'
import Toast from './components/Toast'
import { useNotes } from './hooks/useNotes'
import { useSettings } from './hooks/useSettings'

export default function App() {
  const {
    notes, setNotes,
    activeNote, setActiveNote,
    loadNotes,
    createNote,
    updateNote,
    deleteNote,
    trashNote,
    restoreNote,
    emptyTrash,
    toggleFavorite,
    togglePin,
    duplicateNote,
    searchNotes,
    categories, loadCategories,
    createCategory, deleteCategory,
  } = useNotes()

  const { settings, updateSetting, loadSettings } = useSettings()

  const [view, setView] = useState('all') // all | favorites | pinned | recent | trash | settings | category:<name>
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [contextMenu, setContextMenu] = useState(null)
  const [toast, setToast] = useState(null)
  const [sortBy, setSortBy] = useState('updated') // updated | created | title

  const toastTimeout = useRef(null)

  const showToast = useCallback((message, type = 'success') => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current)
    setToast({ message, type })
    toastTimeout.current = setTimeout(() => setToast(null), 3000)
  }, [])

  // Load initial data
  useEffect(() => {
    loadSettings()
    loadCategories()
    loadNotes(getFilters('all'))
  }, [])

  function getFilters(v) {
    if (v === 'all') return {}
    if (v === 'favorites') return { favorite: true }
    if (v === 'pinned') return { pinned: true }
    if (v === 'recent') return { recent: true }
    if (v === 'trash') return { trashed: true }
    if (v.startsWith('category:')) return { category: v.replace('category:', '') }
    return {}
  }

  // Reload notes when view changes
  useEffect(() => {
    setSearchQuery('')
    setSearchResults(null)
    loadNotes(getFilters(view))
  }, [view])

  // Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null)
      return
    }
    const t = setTimeout(async () => {
      const results = await searchNotes(searchQuery)
      setSearchResults(results)
    }, 200)
    return () => clearTimeout(t)
  }, [searchQuery])

  const displayedNotes = searchResults ?? notes

  // Sort
  const sortedNotes = [...(displayedNotes || [])].sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title)
    if (sortBy === 'created') return new Date(b.created_at) - new Date(a.created_at)
    return new Date(b.updated_at) - new Date(a.updated_at)
  })

  // Keyboard shortcuts
  useEffect(() => {
    const handler = async (e) => {
      if (e.ctrlKey && e.key === 'n') { e.preventDefault(); handleCreateNote() }
      if (e.ctrlKey && e.key === 'f') { e.preventDefault(); document.getElementById('search-input')?.focus() }
      if (e.ctrlKey && e.key === 'd' && activeNote) { e.preventDefault(); handleDuplicate(activeNote.id) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeNote])

  // ─── Handlers ────────────────────────────────────────────────────────────────

  async function handleCreateNote() {
    const defaultCat = settings?.defaultCategory || 'General'
    const id = await createNote({ title: 'Untitled Note', content: '', category: defaultCat })
    await loadNotes(getFilters(view))
    const fresh = await window.electronAPI.getNoteById(id)
    setActiveNote(fresh)
    showToast('New note created')
  }

  async function handleSaveNote(id, data) {
    await updateNote(id, data)
    // Refresh list silently
    const updated = await window.electronAPI.getNoteById(id)
    setNotes(prev => prev.map(n => n.id === id ? updated : n))
    if (activeNote?.id === id) setActiveNote(updated)
  }

  async function handleTrashNote(id) {
    await trashNote(id)
    if (activeNote?.id === id) setActiveNote(null)
    await loadNotes(getFilters(view))
    showToast('Note moved to trash', 'info')
  }

  async function handleDeleteNote(id) {
    await deleteNote(id)
    if (activeNote?.id === id) setActiveNote(null)
    await loadNotes(getFilters(view))
    showToast('Note permanently deleted', 'error')
  }

  async function handleRestoreNote(id) {
    await restoreNote(id)
    if (activeNote?.id === id) setActiveNote(null)
    await loadNotes(getFilters(view))
    showToast('Note restored')
  }

  async function handleToggleFavorite(id) {
    const isFav = await toggleFavorite(id)
    setNotes(prev => prev.map(n => n.id === id ? { ...n, favorite: isFav ? 1 : 0 } : n))
    if (activeNote?.id === id) setActiveNote(prev => ({ ...prev, favorite: isFav ? 1 : 0 }))
    showToast(isFav ? 'Added to favorites' : 'Removed from favorites')
  }

  async function handleTogglePin(id) {
    const isPinned = await togglePin(id)
    setNotes(prev => prev.map(n => n.id === id ? { ...n, pinned: isPinned ? 1 : 0 } : n))
    if (activeNote?.id === id) setActiveNote(prev => ({ ...prev, pinned: isPinned ? 1 : 0 }))
    showToast(isPinned ? 'Note pinned' : 'Note unpinned')
  }

  async function handleDuplicate(id) {
    const newId = await duplicateNote(id)
    await loadNotes(getFilters(view))
    const fresh = await window.electronAPI.getNoteById(newId)
    setActiveNote(fresh)
    showToast('Note duplicated')
  }

  async function handleEmptyTrash() {
    await emptyTrash()
    setActiveNote(null)
    await loadNotes(getFilters(view))
    showToast('Trash emptied', 'error')
  }

  async function handleExport(type) {
    if (!activeNote) return
    let result
    if (type === 'txt') result = await window.electronAPI.exportTxt(activeNote.id)
    else if (type === 'html') result = await window.electronAPI.exportHtml(activeNote.id)
    if (result?.success) showToast(`Exported as ${type.toUpperCase()}`)
    else if (result?.error !== 'Cancelled') showToast('Export failed', 'error')
  }

  async function handleImport() {
    const result = await window.electronAPI.importTxt()
    if (result?.success) {
      await loadNotes(getFilters(view))
      await loadCategories()
      showToast(`Imported ${result.notes.length} note(s)`)
    }
  }

  async function handleBackup() {
    const result = await window.electronAPI.createBackup()
    if (result?.success) showToast('Backup created successfully')
    else showToast('Backup failed', 'error')
  }

  async function handleRestore() {
    const result = await window.electronAPI.restoreBackup()
    if (result?.success) {
      await loadNotes(getFilters(view))
      await loadCategories()
      showToast(`Restored ${result.count} notes`)
    } else if (result?.error !== 'Cancelled') {
      showToast('Restore failed', 'error')
    }
  }

  function handleContextMenu(e, note) {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, note })
  }

  return (
    <div className="app-bg flex flex-col h-screen overflow-hidden">
      {/* Title Bar */}
      <TitleBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          view={view}
          setView={setView}
          categories={categories}
          onCreateNote={handleCreateNote}
          onCreateCategory={async (name) => {
            await createCategory(name)
            await loadCategories()
          }}
          onDeleteCategory={async (id) => {
            await deleteCategory(id)
            await loadCategories()
          }}
          onImport={handleImport}
          onExport={handleExport}
          activeNote={activeNote}
          showToast={showToast}
        />

        {/* Note List */}
        <NoteList
          notes={sortedNotes}
          activeNote={activeNote}
          view={view}
          searchQuery={searchQuery}
          sortBy={sortBy}
          setSortBy={setSortBy}
          onSelectNote={setActiveNote}
          onCreateNote={handleCreateNote}
          onContextMenu={handleContextMenu}
          onEmptyTrash={handleEmptyTrash}
          searchBar={
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
            />
          }
        />

        {/* Editor */}
        <Editor
          note={activeNote}
          settings={settings}
          onSave={handleSaveNote}
          onTrash={handleTrashNote}
          onToggleFavorite={handleToggleFavorite}
          onTogglePin={handleTogglePin}
          onDuplicate={handleDuplicate}
          onExport={handleExport}
          categories={categories}
          showToast={showToast}
        />
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          note={contextMenu.note}
          view={view}
          onClose={() => setContextMenu(null)}
          onTrash={handleTrashNote}
          onDelete={handleDeleteNote}
          onRestore={handleRestoreNote}
          onDuplicate={handleDuplicate}
          onToggleFavorite={handleToggleFavorite}
          onTogglePin={handleTogglePin}
          onSelect={setActiveNote}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onClose={() => setShowSettings(false)}
          onUpdateSetting={updateSetting}
          onBackup={handleBackup}
          onRestore={handleRestore}
          onChooseBackupFolder={async () => {
            const folder = await window.electronAPI.chooseBackupFolder()
            if (folder) {
              await updateSetting('backupFolder', folder)
              showToast('Backup folder updated')
            }
          }}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Settings button (sidebar triggers this) */}
      {view === 'settings' && !showSettings && (() => { setShowSettings(true); setView('all'); return null })()}
    </div>
  )
}
