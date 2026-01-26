/**
 * Tests for date utility functions
 * Run with: npx jest lib/date-utils.test.ts
 */

import { formatDateTime, formatDate, formatRelativeTime } from './date-utils'

describe('Date Utilities', () => {
    describe('formatDateTime', () => {
        it('should format a valid ISO timestamp', () => {
            const timestamp = '2026-01-25T15:30:45.123Z'
            const result = formatDateTime(timestamp)
            expect(result).toBeTruthy()
            expect(result).not.toBe('Invalid Date')
            expect(result).not.toBe('Unknown Date')
        })

        it('should handle Date objects', () => {
            const date = new Date('2026-01-25T15:30:45.123Z')
            const result = formatDateTime(date)
            expect(result).toBeTruthy()
            expect(result).not.toBe('Invalid Date')
        })

        it('should return "Unknown Date" for null', () => {
            const result = formatDateTime(null)
            expect(result).toBe('Unknown Date')
        })

        it('should return "Unknown Date" for undefined', () => {
            const result = formatDateTime(undefined)
            expect(result).toBe('Unknown Date')
        })

        it('should return "Invalid Date" for invalid timestamp', () => {
            const result = formatDateTime('invalid-date')
            expect(result).toBe('Invalid Date')
        })
    })

    describe('formatDate', () => {
        it('should format a valid ISO timestamp', () => {
            const timestamp = '2026-01-25T15:30:45.123Z'
            const result = formatDate(timestamp)
            expect(result).toBeTruthy()
            expect(result).not.toBe('Invalid Date')
            expect(result).not.toBe('Unknown Date')
        })

        it('should return "Unknown Date" for null', () => {
            const result = formatDate(null)
            expect(result).toBe('Unknown Date')
        })
    })

    describe('formatRelativeTime', () => {
        it('should return "Just now" for very recent timestamps', () => {
            const now = new Date()
            const result = formatRelativeTime(now)
            expect(result).toBe('Just now')
        })

        it('should return minutes ago for recent timestamps', () => {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
            const result = formatRelativeTime(fiveMinutesAgo)
            expect(result).toBe('5m ago')
        })

        it('should return hours ago for timestamps within 24 hours', () => {
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
            const result = formatRelativeTime(twoHoursAgo)
            expect(result).toBe('2h ago')
        })

        it('should return days ago for recent days', () => {
            const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
            const result = formatRelativeTime(threeDaysAgo)
            expect(result).toBe('3d ago')
        })

        it('should fall back to absolute time for old timestamps', () => {
            const oldDate = new Date('2025-01-01T12:00:00.000Z')
            const result = formatRelativeTime(oldDate)
            expect(result).not.toContain('ago')
            expect(result).toBeTruthy()
        })

        it('should return "Unknown Date" for null', () => {
            const result = formatRelativeTime(null)
            expect(result).toBe('Unknown Date')
        })
    })
})
