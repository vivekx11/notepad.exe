import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import ReactQuill, { Quill } from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import {
  TbStar, TbStarFilled, TbPin, TbPinned, TbTrash, TbCopy,
  TbFileExport, TbDeviceFloppy, TbEdit, TbNotes, TbTag
} from 'react-icons/tb'
import { formatFullDate, countWords, countChars } from '../utils/helpers'

export default function Editor({ note, settings, onSave, onTrash, onToggleFavorite, onTogglePin, onDuplicate, onExport, categories, showToast }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('General')
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)

  const quillRef = useRef(null)
  const autoSaveTimer = useRef(null)
  const lastSavedId = useRef(null)

  // Font size from settings
  const fontSize = settings?.fontSize ? `${settings.fontSize}px` : '15px'
  const fontFamily = settings?.fontFamily || 'Segoe UI'

  // ─── Load note into editor ────────────────────────────────────────────────
  useEffect(() => {
    if (!note) { setTitle(''); setContent(''); setCategory('General'); setIsDirty(false); return }
    if (note.id !== lastSavedId.current || lastSavedId.current === null) {
      setTitle(note.title || '')
      setContent(note.content || '')
      setCategory(note.category || 'General')
      setIsDirty(false)
      lastSavedId.current = note.id
    }
  }, [note?.id])

  // ─── Auto-save ────────────────────────────────────────────────────────────
  const triggerAutoSave = useCallback((t, c, cat) => {
    if (!note) return
    const autoSave = settings?.autoSave !== 'false'
    const interval = parseInt(settings?.autoSaveInterval || '2000', 10)
    if (!autoSave) return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(async () => {
      setIsSaving(true)
      await onSave(note.id, { title: t, content: c, category: cat })
      setIsDirty(false)
      setIsSaving(false)
    }, interval)
  }, [note, settings, onSave])

  function handleTitleChange(e) {
    setTitle(e.target.value)
    setIsDirty(true)
    triggerAutoSave(e.target.value, content, category)
  }

  function handleContentChange(val) {
    setContent(val)
    setIsDirty(true)
    triggerAutoSave(title, val, category)
  }

  function handleCategoryChange(e) {
    setCategory(e.target.value)
    setIsDirty(true)
    triggerAutoSave(title, content, e.target.value)
  }

  async function handleManualSave() {
    if (!note) return
    if (autoSaveTimer.current) { clearTimeout(autoSaveTimer.current); autoSaveTimer.current = null }
    setIsSaving(true)
    await onSave(note.id, { title, content, category })
    setIsDirty(false)
    setIsSaving(false)
    showToast('Note saved')
  }

  // Ctrl+S
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); handleManualSave() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [note, title, content, category])

  // ─── Quill modules & formats ─────────────────────────────────────────────
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        [{ font: [] }],
        [{ size: ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        [{ align: [] }],
        ['blockquote', 'code-block'],
        ['link', 'image'],
        ['clean'],
      ],
    },
    history: { delay: 500, maxStack: 200, userOnly: true },
    clipboard: { matchVisual: false },
  }), [])

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet', 'indent',
    'align', 'blockquote', 'code-block',
    'link', 'image',
  ]

  const wordCount = countWords(content)
  const charCount = countChars(content)

  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(12px)' }}>
        <div className="flex flex-col items-center gap-4 opacity-50">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
            <TbNotes size={40} className="text-white" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-slate-600">No note selected</h3>
            <p className="text-sm text-slate-400 mt-1">Select a note or create a new one</p>
            <p className="text-xs text-slate-400 mt-1">Ctrl+N to create a new note</p>
          </div>
        </div>
      </div>
    )
  }

  const isTrash = note.trashed === 1

  return (
    <div
      className="flex-1 flex flex-col h-full min-w-0"
      style={{ background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(12px)' }}
    >
      {/* Editor toolbar */}
      <div
        className="flex items-center justify-between px-5 py-2.5 shrink-0"
        style={{ borderBottom: '1px solid rgba(226,232,240,0.6)', background: 'rgba(255,255,255,0.6)' }}
      >
        {/* Left: category + date */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <TbTag size={14} className="text-slate-400" />
            {isTrash ? (
              <span className="text-sm text-slate-500">{note.category}</span>
            ) : (
              <select
                value={category}
                onChange={handleCategoryChange}
                className="text-sm text-slate-600 bg-transparent border-none outline-none cursor-pointer hover:text-blue-500 transition-colors"
                style={{ userSelect: 'text' }}
              >
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            )}
          </div>
          <span className="text-xs text-slate-400">
            {formatFullDate(note.updated_at)}
          </span>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-1">
          {isTrash ? (
            <button
              onClick={() => window.electronAPI.restoreNote(note.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 text-white text-xs font-medium hover:bg-green-600 transition-colors"
            >
              Restore
            </button>
          ) : (
            <>
              {/* Save indicator */}
              <span className="text-xs text-slate-400 mr-1">
                {isSaving ? 'Saving...' : isDirty ? '● Unsaved' : '✓ Saved'}
              </span>

              <button
                onClick={handleManualSave}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-blue-500 hover:text-white transition-all"
                title="Save (Ctrl+S)"
                data-tooltip="Save"
              >
                <TbDeviceFloppy size={17} />
              </button>

              <button
                onClick={() => onToggleFavorite(note.id)}
                className={`p-1.5 rounded-lg transition-all ${
                  note.favorite === 1 ? 'text-yellow-500 hover:bg-yellow-50' : 'text-slate-400 hover:bg-slate-100 hover:text-yellow-500'
                }`}
                title="Favorite"
              >
                {note.favorite === 1 ? <TbStarFilled size={17} /> : <TbStar size={17} />}
              </button>

              <button
                onClick={() => onTogglePin(note.id)}
                className={`p-1.5 rounded-lg transition-all ${
                  note.pinned === 1 ? 'text-blue-500 hover:bg-blue-50' : 'text-slate-400 hover:bg-slate-100 hover:text-blue-500'
                }`}
                title="Pin"
              >
                {note.pinned === 1 ? <TbPinned size={17} /> : <TbPin size={17} />}
              </button>

              <button
                onClick={() => onDuplicate(note.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all"
                title="Duplicate (Ctrl+D)"
              >
                <TbCopy size={17} />
              </button>

              {/* Export */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(p => !p)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all"
                  title="Export"
                >
                  <TbFileExport size={17} />
                </button>
                {showExportMenu && (
                  <div
                    className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50"
                    onMouseLeave={() => setShowExportMenu(false)}
                  >
                    {[['txt', 'Plain Text (.txt)'], ['html', 'HTML (.html)']].map(([type, label]) => (
                      <button
                        key={type}
                        onClick={() => { onExport(type); setShowExportMenu(false) }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => onTrash(note.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                title="Move to trash (Delete)"
              >
                <TbTrash size={17} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Title input */}
      <div className="px-8 pt-6 pb-2 shrink-0">
        <input
          value={title}
          onChange={handleTitleChange}
          placeholder="Note title..."
          readOnly={isTrash}
          className="w-full text-2xl font-bold text-slate-800 bg-transparent border-none outline-none placeholder-slate-300"
          style={{ fontFamily, userSelect: 'text' }}
        />
      </div>

      {/* Rich text editor */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {isTrash ? (
          <div
            className="flex-1 overflow-y-auto px-8 py-4 text-slate-700 leading-relaxed"
            style={{ fontFamily, fontSize }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={content}
            onChange={handleContentChange}
            modules={modules}
            formats={formats}
            placeholder="Start writing your note..."
            style={{ fontFamily, fontSize, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
          />
        )}
      </div>

      {/* Status bar */}
      <div
        className="flex items-center justify-between px-6 py-1.5 shrink-0 text-xs text-slate-400"
        style={{ borderTop: '1px solid rgba(226,232,240,0.5)', background: 'rgba(255,255,255,0.4)' }}
      >
        <span>{wordCount} words · {charCount} characters</span>
        <span>Last edited {formatFullDate(note.updated_at)}</span>
      </div>
    </div>
  )
}
