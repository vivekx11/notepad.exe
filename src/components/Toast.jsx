import React from 'react'
import { TbCheck, TbX, TbInfoCircle, TbAlertTriangle } from 'react-icons/tb'

const ICONS = {
  success: <TbCheck size={16} />,
  error: <TbX size={16} />,
  info: <TbInfoCircle size={16} />,
  warning: <TbAlertTriangle size={16} />,
}

const STYLES = {
  success: 'bg-emerald-500 text-white',
  error: 'bg-red-500 text-white',
  info: 'bg-blue-500 text-white',
  warning: 'bg-amber-500 text-white',
}

export default function Toast({ message, type = 'success', onClose }) {
  return (
    <div
      className="fixed bottom-6 right-6 z-[9999] animate-slide-in"
      onClick={onClose}
    >
      <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg cursor-pointer ${STYLES[type] || STYLES.success}`}>
        <span className="shrink-0">{ICONS[type] || ICONS.success}</span>
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  )
}
