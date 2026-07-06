import React, { useState, useEffect } from 'react'
import { VscChromeMinimize, VscChromeMaximize, VscChromeRestore, VscChromeClose } from 'react-icons/vsc'
import { TbNotes } from 'react-icons/tb'

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    const check = async () => {
      const max = await window.electronAPI.isMaximized()
      setIsMaximized(max)
    }
    check()
    const interval = setInterval(check, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="flex items-center justify-between h-10 px-4 select-none shrink-0"
      style={{ WebkitAppRegion: 'drag', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.5)' }}
    >
      {/* App branding */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-sm">
          <TbNotes className="text-white text-sm" />
        </div>
        <span className="text-sm font-semibold text-slate-700 tracking-wide">Vivek Notes</span>
      </div>

      {/* Window controls */}
      <div
        className="flex items-center gap-1"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        <button
          onClick={() => window.electronAPI.minimizeWindow()}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-all duration-150"
          title="Minimize"
        >
          <VscChromeMinimize size={14} />
        </button>
        <button
          onClick={() => { window.electronAPI.maximizeWindow(); setIsMaximized(p => !p) }}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-all duration-150"
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? <VscChromeRestore size={14} /> : <VscChromeMaximize size={14} />}
        </button>
        <button
          onClick={() => window.electronAPI.closeWindow()}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-red-500 hover:text-white transition-all duration-150"
          title="Close"
        >
          <VscChromeClose size={14} />
        </button>
      </div>
    </div>
  )
}
