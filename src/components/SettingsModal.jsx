import React, { useState } from 'react'
import { TbX, TbDeviceFloppy, TbFolderOpen, TbRestore, TbInfoCircle } from 'react-icons/tb'

const FONTS = ['Segoe UI', 'Arial', 'Georgia', 'Courier New', 'Verdana', 'Times New Roman', 'Trebuchet MS', 'Consolas']
const FONT_SIZES = ['12', '13', '14', '15', '16', '17', '18', '20', '22', '24']

const TABS = [
  { id: 'appearance', label: 'Appearance' },
  { id: 'editor', label: 'Editor' },
  { id: 'backup', label: 'Backup' },
  { id: 'about', label: 'About' },
]

export default function SettingsModal({ settings, onClose, onUpdateSetting, onBackup, onRestore, onChooseBackupFolder }) {
  const [activeTab, setActiveTab] = useState('appearance')

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="modal-content bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 w-[560px] max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all"
          >
            <TbX size={18} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar tabs */}
          <div className="w-40 border-r border-slate-100 py-3 px-2 shrink-0">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'appearance' && (
              <div className="space-y-5">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Font</h3>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Font Family</label>
                  <select
                    value={settings?.fontFamily || 'Segoe UI'}
                    onChange={e => onUpdateSetting('fontFamily', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  >
                    {FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Font Size</label>
                  <div className="flex flex-wrap gap-2">
                    {FONT_SIZES.map(size => (
                      <button
                        key={size}
                        onClick={() => onUpdateSetting('fontSize', size)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          settings?.fontSize === size
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {size}px
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-xs text-slate-400 mb-2">Preview</p>
                  <p
                    style={{
                      fontFamily: settings?.fontFamily || 'Segoe UI',
                      fontSize: `${settings?.fontSize || 15}px`,
                      lineHeight: '1.6',
                    }}
                    className="text-slate-700"
                  >
                    The quick brown fox jumps over the lazy dog.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'editor' && (
              <div className="space-y-5">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Editor Behavior</h3>

                <ToggleSetting
                  label="Auto Save"
                  description="Automatically save notes as you type"
                  checked={settings?.autoSave !== 'false'}
                  onChange={v => onUpdateSetting('autoSave', v ? 'true' : 'false')}
                />

                {settings?.autoSave !== 'false' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Auto-save delay: {settings?.autoSaveInterval || 2000}ms
                    </label>
                    <input
                      type="range"
                      min="500"
                      max="5000"
                      step="500"
                      value={settings?.autoSaveInterval || 2000}
                      onChange={e => onUpdateSetting('autoSaveInterval', e.target.value)}
                      className="w-full accent-blue-500"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>0.5s</span>
                      <span>5s</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Default Category</label>
                  <input
                    type="text"
                    value={settings?.defaultCategory || 'General'}
                    onChange={e => onUpdateSetting('defaultCategory', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                    style={{ userSelect: 'text' }}
                  />
                </div>
              </div>
            )}

            {activeTab === 'backup' && (
              <div className="space-y-5">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Backup & Restore</h3>

                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                  <p className="text-sm text-blue-700">
                    Auto-backup runs every <strong>5 minutes</strong> and keeps the last <strong>10 backups</strong>.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Backup Folder</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={settings?.backupFolder || 'Default (AppData)'}
                      readOnly
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-600 focus:outline-none"
                    />
                    <button
                      onClick={onChooseBackupFolder}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-all"
                    >
                      <TbFolderOpen size={16} />
                      Browse
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={onBackup}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-all shadow-sm"
                  >
                    <TbDeviceFloppy size={17} />
                    Create Backup
                  </button>
                  <button
                    onClick={onRestore}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-all"
                  >
                    <TbRestore size={17} />
                    Restore Backup
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-5">
                <div className="flex flex-col items-center py-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg mb-4">
                    <TbInfoCircle size={32} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Vivek Notes</h3>
                  <p className="text-sm text-slate-500 mt-1">Version 1.0.0</p>
                </div>

                <div className="space-y-3 text-sm text-slate-600">
                  <InfoRow label="Publisher" value="Vivek Sawji" />
                  <InfoRow label="Technology" value="Electron + React + SQLite" />
                  <InfoRow label="License" value="MIT" />
                  <InfoRow label="Platform" value="Windows" />
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-sm font-semibold text-slate-700 mb-2">Keyboard Shortcuts</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      ['Ctrl+N', 'New note'],
                      ['Ctrl+S', 'Save note'],
                      ['Ctrl+F', 'Search'],
                      ['Ctrl+D', 'Duplicate'],
                      ['Ctrl+Z', 'Undo'],
                      ['Ctrl+Y', 'Redo'],
                    ].map(([key, desc]) => (
                      <div key={key} className="flex items-center gap-2">
                        <kbd className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-xs font-mono">{key}</kbd>
                        <span className="text-xs text-slate-500">{desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ToggleSetting({ label, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-all duration-200 ${checked ? 'bg-blue-500' : 'bg-slate-200'}`}
      >
        <span
          className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${checked ? 'left-6' : 'left-1'}`}
        />
      </button>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-100">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-700">{value}</span>
    </div>
  )
}
