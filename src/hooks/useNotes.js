import { useState, useCallback } from 'react'

export function useNotes() {
  const [notes, setNotes] = useState([])
  const [activeNote, setActiveNote] = useState(null)
  const [categories, setCategories] = useState([])

  const api = window.electronAPI

  const loadNotes = useCallback(async (filters = {}) => {
    const data = await api.getNotes(filters)
    setNotes(data || [])
  }, [])

  const loadCategories = useCallback(async () => {
    const data = await api.getCategories()
    setCategories(data || [])
  }, [])

  const createNote = useCallback(async (data) => {
    return await api.createNote(data)
  }, [])

  const updateNote = useCallback(async (id, data) => {
    return await api.updateNote(id, data)
  }, [])

  const deleteNote = useCallback(async (id) => {
    return await api.deleteNote(id)
  }, [])

  const trashNote = useCallback(async (id) => {
    return await api.trashNote(id)
  }, [])

  const restoreNote = useCallback(async (id) => {
    return await api.restoreNote(id)
  }, [])

  const emptyTrash = useCallback(async () => {
    return await api.emptyTrash()
  }, [])

  const toggleFavorite = useCallback(async (id) => {
    return await api.toggleFavorite(id)
  }, [])

  const togglePin = useCallback(async (id) => {
    return await api.togglePin(id)
  }, [])

  const duplicateNote = useCallback(async (id) => {
    return await api.duplicateNote(id)
  }, [])

  const searchNotes = useCallback(async (query) => {
    return await api.searchNotes(query)
  }, [])

  const createCategory = useCallback(async (name) => {
    return await api.createCategory(name)
  }, [])

  const deleteCategory = useCallback(async (id) => {
    return await api.deleteCategory(id)
  }, [])

  return {
    notes, setNotes,
    activeNote, setActiveNote,
    categories,
    loadNotes, loadCategories,
    createNote, updateNote, deleteNote,
    trashNote, restoreNote, emptyTrash,
    toggleFavorite, togglePin,
    duplicateNote, searchNotes,
    createCategory, deleteCategory,
  }
}
