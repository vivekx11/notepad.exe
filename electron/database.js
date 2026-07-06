/**
 * Database layer using @seald-io/nedb (pure JavaScript, no native compilation)
 * Provides synchronous-style API by pre-loading all data.
 */
const path = require('path')
const fs = require('fs')
const Datastore = require('@seald-io/nedb')

let notesDb
let categoriesDb
let settingsDb

// ─── Init ────────────────────────────────────────────────────────────────────

async function initDatabase(userDataPath) {
  const dbDir = path.join(userDataPath, 'vivek-notes-db')
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })

  notesDb = new Datastore({ filename: path.join(dbDir, 'notes.db'), autoload: true })
  categoriesDb = new Datastore({ filename: path.join(dbDir, 'categories.db'), autoload: true })
  settingsDb = new Datastore({ filename: path.join(dbDir, 'settings.db'), autoload: true })

  // Ensure indexes
  await notesDb.ensureIndexAsync({ fieldName: 'updatedAt' })
  await notesDb.ensureIndexAsync({ fieldName: 'trashed' })

  // Seed default categories if empty
  const catCount = await categoriesDb.countAsync({})
  if (catCount === 0) {
    const defaultCats = ['General', 'Work', 'Personal', 'Ideas', 'Imported']
    for (const name of defaultCats) {
      await categoriesDb.insertAsync({ name, createdAt: now() })
    }
  }

  // Seed default settings
  const defaults = {
    fontFamily: 'Segoe UI',
    fontSize: '16',
    autoSave: 'true',
    autoSaveInterval: '2000',
    defaultCategory: 'General',
    backupFolder: '',
    theme: 'light',
  }
  for (const [key, value] of Object.entries(defaults)) {
    const exists = await settingsDb.findOneAsync({ key })
    if (!exists) await settingsDb.insertAsync({ key, value })
  }

  return {
    getNotes,
    getNoteById,
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
    getCategories,
    createCategory,
    deleteCategory,
    getSettings,
    getSetting,
    setSetting,
    restoreFromBackup,
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function now() {
  return new Date().toISOString()
}

function toNote(doc) {
  if (!doc) return null
  return {
    id: doc._id,
    title: doc.title || 'Untitled Note',
    content: doc.content || '',
    category: doc.category || 'General',
    favorite: doc.favorite ? 1 : 0,
    pinned: doc.pinned ? 1 : 0,
    trashed: doc.trashed ? 1 : 0,
    created_at: doc.createdAt || now(),
    updated_at: doc.updatedAt || now(),
  }
}

// ─── Notes ───────────────────────────────────────────────────────────────────

async function getNotes(filters = {}) {
  let query = {}

  if (filters.trashed) {
    query.trashed = true
    const docs = await notesDb.findAsync(query).sort({ updatedAt: -1 })
    return docs.map(toNote)
  }

  query.trashed = { $ne: true }
  if (filters.favorite) query.favorite = true
  if (filters.pinned) query.pinned = true
  if (filters.category && filters.category !== 'All') query.category = filters.category

  let cursor = notesDb.findAsync(query).sort({ pinned: -1, updatedAt: -1 })
  if (filters.recent) cursor = notesDb.findAsync({ trashed: { $ne: true } }).sort({ updatedAt: -1 }).limit(20)

  const docs = await cursor
  return docs.map(toNote)
}

async function getNoteById(id) {
  const doc = await notesDb.findOneAsync({ _id: id })
  return toNote(doc)
}

async function createNote(data = {}) {
  const doc = await notesDb.insertAsync({
    title: data.title || 'Untitled Note',
    content: data.content || '',
    category: data.category || 'General',
    favorite: data.favorite || false,
    pinned: data.pinned || false,
    trashed: false,
    createdAt: now(),
    updatedAt: now(),
  })
  return doc._id
}

async function updateNote(id, data) {
  const update = { $set: { updatedAt: now() } }
  if (data.title !== undefined) update.$set.title = data.title
  if (data.content !== undefined) update.$set.content = data.content
  if (data.category !== undefined) update.$set.category = data.category
  if (data.favorite !== undefined) update.$set.favorite = !!data.favorite
  if (data.pinned !== undefined) update.$set.pinned = !!data.pinned
  await notesDb.updateAsync({ _id: id }, update)
  return true
}

async function deleteNote(id) {
  await notesDb.removeAsync({ _id: id }, {})
  return true
}

async function trashNote(id) {
  await notesDb.updateAsync({ _id: id }, { $set: { trashed: true, updatedAt: now() } })
  return true
}

async function restoreNote(id) {
  await notesDb.updateAsync({ _id: id }, { $set: { trashed: false, updatedAt: now() } })
  return true
}

async function emptyTrash() {
  await notesDb.removeAsync({ trashed: true }, { multi: true })
  return true
}

async function toggleFavorite(id) {
  const doc = await notesDb.findOneAsync({ _id: id })
  if (!doc) return false
  const newVal = !doc.favorite
  await notesDb.updateAsync({ _id: id }, { $set: { favorite: newVal, updatedAt: now() } })
  return newVal
}

async function togglePin(id) {
  const doc = await notesDb.findOneAsync({ _id: id })
  if (!doc) return false
  const newVal = !doc.pinned
  await notesDb.updateAsync({ _id: id }, { $set: { pinned: newVal, updatedAt: now() } })
  return newVal
}

async function duplicateNote(id) {
  const doc = await notesDb.findOneAsync({ _id: id })
  if (!doc) return null
  return createNote({
    title: `${doc.title} (Copy)`,
    content: doc.content,
    category: doc.category,
    favorite: false,
    pinned: false,
  })
}

async function searchNotes(query) {
  const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
  const docs = await notesDb.findAsync({
    trashed: { $ne: true },
    $or: [
      { title: regex },
      { content: regex },
      { category: regex },
    ],
  }).sort({ pinned: -1, updatedAt: -1 })
  return docs.map(toNote)
}

// ─── Categories ──────────────────────────────────────────────────────────────

async function getCategories() {
  const docs = await categoriesDb.findAsync({}).sort({ name: 1 })
  return docs.map(d => ({ id: d._id, name: d.name, created_at: d.createdAt }))
}

async function createCategory(name) {
  const existing = await categoriesDb.findOneAsync({ name })
  if (existing) return existing._id
  const doc = await categoriesDb.insertAsync({ name, createdAt: now() })
  return doc._id
}

async function deleteCategory(id) {
  await categoriesDb.removeAsync({ _id: id }, {})
  return true
}

// ─── Settings ────────────────────────────────────────────────────────────────

async function getSettings() {
  const rows = await settingsDb.findAsync({})
  const settings = {}
  rows.forEach(row => { settings[row.key] = row.value })
  return settings
}

async function getSetting(key) {
  const row = await settingsDb.findOneAsync({ key })
  return row ? row.value : null
}

async function setSetting(key, value) {
  await settingsDb.updateAsync({ key }, { $set: { key, value } }, { upsert: true })
  return true
}

// ─── Backup ──────────────────────────────────────────────────────────────────

async function restoreFromBackup(data) {
  if (!data.notes) return false
  for (const n of data.notes) {
    const existing = await notesDb.findOneAsync({ _id: n.id })
    if (existing) {
      await notesDb.updateAsync({ _id: n.id }, { $set: {
        title: n.title, content: n.content, category: n.category,
        favorite: n.favorite === 1 || n.favorite === true,
        pinned: n.pinned === 1 || n.pinned === true,
        trashed: n.trashed === 1 || n.trashed === true,
        updatedAt: n.updated_at || now(),
      }})
    } else {
      await notesDb.insertAsync({
        _id: n.id,
        title: n.title, content: n.content, category: n.category,
        favorite: n.favorite === 1 || n.favorite === true,
        pinned: n.pinned === 1 || n.pinned === true,
        trashed: n.trashed === 1 || n.trashed === true,
        createdAt: n.created_at || now(),
        updatedAt: n.updated_at || now(),
      })
    }
  }
  if (data.categories) {
    for (const c of data.categories) {
      await createCategory(c.name)
    }
  }
  return true
}

module.exports = { initDatabase }
