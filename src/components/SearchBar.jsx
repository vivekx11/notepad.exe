import React, { useRef } from 'react'
import { TbSearch, TbX } from 'react-icons/tb'

export default function SearchBar({ value, onChange }) {
  const inputRef = useRef(null)

  return (
    <div className="relative flex items-center">
      <TbSearch size={15} className="absolute left-3 text-slate-400 pointer-events-none" />
      <input
        id="search-input"
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search notes... (Ctrl+F)"
        className="w-full pl-9 pr-8 py-2 text-sm bg-white/70 border border-slate-200/60 rounded-xl placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 transition-all"
        style={{ userSelect: 'text' }}
      />
      {value && (
        <button
          onClick={() => { onChange(''); inputRef.current?.focus() }}
          className="absolute right-2.5 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <TbX size={14} />
        </button>
      )}
    </div>
  )
}
