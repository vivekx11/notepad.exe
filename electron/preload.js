const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),

  // Notes
  getNotes: (filters) => ipcRenderer.invoke('notes-get-all', filters),
  getNoteById: (id) => ipcRenderer.invoke('notes-get-by-id', id),
  createNote: (note) => ipcRenderer.invoke('notes-create', note),
  updateNote: (id, data) => ipcRenderer.invoke('notes-update', id, data),
  deleteNote: (id) => ipcRenderer.invoke('notes-delete', id),
  trashNote: (id) => ipcRenderer.invoke('notes-trash', id),
  restoreNote: (id) => ipcRenderer.invoke('notes-restore', id),
  emptyTrash: () => ipcRenderer.invoke('notes-empty-trash'),
  toggleFavorite: (id) => ipcRenderer.invoke('notes-toggle-favorite', id),
  togglePin: (id) => ipcRenderer.invoke('notes-toggle-pin', id),
  duplicateNote: (id) => ipcRenderer.invoke('notes-duplicate', id),
  searchNotes: (query) => ipcRenderer.invoke('notes-search', query),

  // Categories
  getCategories: () => ipcRenderer.invoke('categories-get-all'),
  createCategory: (name) => ipcRenderer.invoke('categories-create', name),
  deleteCategory: (id) => ipcRenderer.invoke('categories-delete', id),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings-get'),
  setSetting: (key, value) => ipcRenderer.invoke('settings-set', key, value),

  // Export
  exportTxt: (noteId) => ipcRenderer.invoke('export-txt', noteId),
  exportHtml: (noteId) => ipcRenderer.invoke('export-html', noteId),

  // Import
  importTxt: () => ipcRenderer.invoke('import-txt'),

  // Backup
  createBackup: () => ipcRenderer.invoke('backup-create'),
  restoreBackup: () => ipcRenderer.invoke('backup-restore'),
  chooseBackupFolder: () => ipcRenderer.invoke('backup-choose-folder'),
})
