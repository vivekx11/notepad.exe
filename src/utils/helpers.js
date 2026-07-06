/**
 * Strip HTML tags and decode common entities
 */
export function stripHtml(html = '') {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Truncate a string to maxLength characters
 */
export function truncate(str = '', maxLength = 100) {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '…'
}

/**
 * Format a date as a relative time string (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateStr) {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr.replace(' ', 'T') + (dateStr.includes('T') ? '' : 'Z'))
    const now = new Date()
    const diffMs = now - date
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSecs < 60) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

/**
 * Format a full date string
 */
export function formatFullDate(dateStr) {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr.replace(' ', 'T') + (dateStr.includes('T') ? '' : 'Z'))
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

/**
 * Count words in HTML content
 */
export function countWords(html = '') {
  const text = stripHtml(html)
  if (!text.trim()) return 0
  return text.trim().split(/\s+/).length
}

/**
 * Count characters in HTML content (excluding HTML tags)
 */
export function countChars(html = '') {
  return stripHtml(html).length
}
