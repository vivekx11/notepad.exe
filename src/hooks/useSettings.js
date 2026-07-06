import { useState, useCallback } from 'react'

export function useSettings() {
  const [settings, setSettings] = useState({
    fontFamily: 'Segoe UI',
    fontSize: '16',
    autoSave: 'true',
    autoSaveInterval: '2000',
    defaultCategory: 'General',
    backupFolder: '',
    theme: 'light',
  })

  const loadSettings = useCallback(async () => {
    const data = await window.electronAPI.getSettings()
    if (data) setSettings(data)
  }, [])

  const updateSetting = useCallback(async (key, value) => {
    await window.electronAPI.setSetting(key, String(value))
    setSettings(prev => ({ ...prev, [key]: String(value) }))
  }, [])

  return { settings, setSettings, loadSettings, updateSetting }
}
