/**
 * Formats a timestamp to show localized date and time
 * @param timestamp - ISO timestamp string or Date object
 * @returns Formatted string like "1/25/2026, 3:45 PM" in user's locale
 */
export function formatDateTime(timestamp: string | Date | null | undefined): string {
    if (!timestamp) return 'Unknown Date'

    try {
        const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp

        // Check if date is valid
        if (isNaN(date.getTime())) return 'Invalid Date'

        return date.toLocaleString(undefined, {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })
    } catch (error) {
        console.error('Error formatting date:', error)
        return 'Invalid Date'
    }
}

/**
 * Formats a timestamp to show only localized date
 * @param timestamp - ISO timestamp string or Date object
 * @returns Formatted string like "1/25/2026" in user's locale
 */
export function formatDate(timestamp: string | Date | null | undefined): string {
    if (!timestamp) return 'Unknown Date'

    try {
        const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp

        // Check if date is valid
        if (isNaN(date.getTime())) return 'Invalid Date'

        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        })
    } catch (error) {
        console.error('Error formatting date:', error)
        return 'Invalid Date'
    }
}

/**
 * Formats a timestamp to show relative time (e.g., "2 hours ago")
 * @param timestamp - ISO timestamp string or Date object
 * @returns Formatted string like "2 hours ago" or falls back to absolute time
 */
export function formatRelativeTime(timestamp: string | Date | null | undefined): string {
    if (!timestamp) return 'Unknown Date'

    try {
        const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp

        // Check if date is valid
        if (isNaN(date.getTime())) return 'Invalid Date'

        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMins / 60)
        const diffDays = Math.floor(diffHours / 24)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`

        // Fall back to absolute date for older entries
        return formatDateTime(timestamp)
    } catch (error) {
        console.error('Error formatting relative time:', error)
        return 'Invalid Date'
    }
}
