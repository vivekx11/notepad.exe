const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron')
const path = require('path')
const fs = require('fs')

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow
let db

// ─── Window state ────────────────────────────────────────────────────────────
const userDataPath = app.getPath('userData')
const windowStatePath = path.join(userDataPath, 'window-state.json')

function loadWindowState() {
  try {
    if (fs.existsSync(windowStatePath)) return JSON.parse(fs.readFileSync(windowStatePath, 'utf8'))
  } catch {}
  return { width: 1200, height: 750 }
}

function saveWindowState(win) {
  try { fs.writeFileSync(windowStatePath, JSON.stringify(win.getBounds())) } catch {}
}

// ─── Create window ───────────────────────────────────────────────────────────
function createWindow() {
  const ws = loadWindowState()
  mainWindow = new BrowserWindow({
    width: ws.width || 1200,
    height: ws.height || 750,
    x: ws.x, y: ws.y,
    minWidth: 800,
    minHeight: 550,
    frame: false,
    backgroundColor: '#eef2ff',
    show: false,
    icon: path.join(__dirname, '../assets/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  mainWindow.once('ready-to-show', () => mainWindow.show())
  mainWindow.on('close', () => saveWindowState(mainWindow))

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

// ─── App ready ───────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  const { initDatabase } = require('./database')
  db = await initDatabase(userDataPath)

  createWindow()
  Menu.setApplicationMenu(null)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  // Auto-backup every 5 minutes
  setInterval(() => doAutoBackup(), 5 * 60 * 1000)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ─── Auto backup ─────────────────────────────────────────────────────────────
async function doAutoBackup() {
  if (!db) return
  try {
    const backupSetting = await db.getSetting('backupFolder')
    const backupDir = backupSetting || path.join(userDataPath, 'backups')
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true })
    const files = fs.readdirSync(backupDir).filter(f => f.startsWith('auto-backup-')).sort()
    if (files.length >= 10) fs.unlinkSync(path.join(backupDir, files[0]))
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const notes = await db.getNotes({})
    const categories = await db.getCategories()
    fs.writeFileSync(path.join(backupDir, `auto-backup-${timestamp}.json`),
      JSON.stringify({ notes, categories, version: '1.0.0', timestamp }, null, 2))
  } catch {}
}

// ─── Window IPC ──────────────────────────────────────────────────────────────
ipcMain.on('window-minimize', () => mainWindow?.minimize())
ipcMain.on('window-maximize', () => { mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize() })
ipcMain.on('window-close', () => mainWindow?.close())
ipcMain.handle('window-is-maximized', () => mainWindow?.isMaximized() ?? false)

// ─── Notes IPC ───────────────────────────────────────────────────────────────
ipcMain.handle('notes-get-all', (_, filters) => db.getNotes(filters))
ipcMain.handle('notes-get-by-id', (_, id) => db.getNoteById(id))
ipcMain.handle('notes-create', (_, note) => db.createNote(note))
ipcMain.handle('notes-update', (_, id, data) => db.updateNote(id, data))
ipcMain.handle('notes-delete', (_, id) => db.deleteNote(id))
ipcMain.handle('notes-trash', (_, id) => db.trashNote(id))
ipcMain.handle('notes-restore', (_, id) => db.restoreNote(id))
ipcMain.handle('notes-empty-trash', () => db.emptyTrash())
ipcMain.handle('notes-toggle-favorite', (_, id) => db.toggleFavorite(id))
ipcMain.handle('notes-toggle-pin', (_, id) => db.togglePin(id))
ipcMain.handle('notes-duplicate', (_, id) => db.duplicateNote(id))
ipcMain.handle('notes-search', (_, query) => db.searchNotes(query))

// ─── Categories IPC ──────────────────────────────────────────────────────────
ipcMain.handle('categories-get-all', () => db.getCategories())
ipcMain.handle('categories-create', (_, name) => db.createCategory(name))
ipcMain.handle('categories-delete', (_, id) => db.deleteCategory(id))

// ─── Settings IPC ────────────────────────────────────────────────────────────
ipcMain.handle('settings-get', () => db.getSettings())
ipcMain.handle('settings-set', (_, key, value) => db.setSetting(key, value))

// ─── Export IPC ──────────────────────────────────────────────────────────────
ipcMain.handle('export-txt', async (_, noteId) => {
  const note = await db.getNoteById(noteId)
  if (!note) return { success: false, error: 'Note not found' }
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Export as TXT',
    defaultPath: `${note.title || 'note'}.txt`,
    filters: [{ name: 'Text Files', extensions: ['txt'] }],
  })
  if (!filePath) return { success: false, error: 'Cancelled' }
  const plainText = note.content
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
  fs.writeFileSync(filePath, `${note.title}\n${'─'.repeat(40)}\n\n${plainText}`)
  return { success: true, filePath }
})

ipcMain.handle('export-html', async (_, noteId) => {
  const note = await db.getNoteById(noteId)
  if (!note) return { success: false, error: 'Note not found' }
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Export as HTML',
    defaultPath: `${note.title || 'note'}.html`,
    filters: [{ name: 'HTML Files', extensions: ['html'] }],
  })
  if (!filePath) return { success: false, error: 'Cancelled' }
  const html = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<title>${note.title}</title>
<style>body{font-family:Segoe UI,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.6}h1{border-bottom:2px solid #3b82f6;padding-bottom:10px}</style>
</head><body>
<h1>${note.title}</h1>
${note.content}
</body></html>`
  fs.writeFileSync(filePath, html)
  return { success: true, filePath }
})

// ─── Import IPC ──────────────────────────────────────────────────────────────
ipcMain.handle('import-txt', async () => {
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Import TXT files',
    filters: [{ name: 'Text Files', extensions: ['txt'] }],
    properties: ['openFile', 'multiSelections'],
  })
  if (!filePaths || filePaths.length === 0) return { success: false, error: 'Cancelled' }
  const results = []
  for (const filePath of filePaths) {
    const content = fs.readFileSync(filePath, 'utf8')
    const title = path.basename(filePath, '.txt')
    const id = await db.createNote({ title, content: `<p>${content.replace(/\n/g, '</p><p>')}</p>`, category: 'Imported' })
    results.push({ id, title })
  }
  return { success: true, notes: results }
})

// ─── Backup IPC ──────────────────────────────────────────────────────────────
ipcMain.handle('backup-create', async () => {
  const backupSetting = await db.getSetting('backupFolder')
  const backupDir = backupSetting || path.join(userDataPath, 'backups')
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true })
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupPath = path.join(backupDir, `vivek-notes-backup-${timestamp}.json`)
  const notes = await db.getNotes({})
  const categories = await db.getCategories()
  const settings = await db.getSettings()
  fs.writeFileSync(backupPath, JSON.stringify({ notes, categories, settings, version: '1.0.0', timestamp }, null, 2))
  return { success: true, path: backupPath }
})

ipcMain.handle('backup-restore', async () => {
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Restore Backup',
    filters: [{ name: 'JSON Backup', extensions: ['json'] }],
    properties: ['openFile'],
  })
  if (!filePaths || filePaths.length === 0) return { success: false, error: 'Cancelled' }
  try {
    const data = JSON.parse(fs.readFileSync(filePaths[0], 'utf8'))
    if (!data.notes) return { success: false, error: 'Invalid backup file' }
    await db.restoreFromBackup(data)
    return { success: true, count: data.notes.length }
  } catch (e) {
    return { success: false, error: e.message }
  }
})

ipcMain.handle('backup-choose-folder', async () => {
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Choose Backup Folder',
    properties: ['openDirectory'],
  })
  if (!filePaths || filePaths.length === 0) return null
  await db.setSetting('backupFolder', filePaths[0])
  return filePaths[0]
})

// External links in browser
app.on('web-contents-created', (_, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
})
