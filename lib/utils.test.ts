import { expect, test, describe } from 'vitest'
import { cn } from './utils'

describe('utils', () => {
    describe('cn', () => {
        test('should merge class names correctly', () => {
            const result = cn('c1', 'c2')
            expect(result).toBe('c1 c2')
        })

        test('should handle conditional classes', () => {
            const condition = true
            const result = cn('c1', condition && 'c2', !condition && 'c3')
            expect(result).toBe('c1 c2')
        })

        test('should merge tailwind classes properly', () => {
            // tailwind-merge should resolve conflicts (e.g., p-4 vs p-2)
            const result = cn('p-4', 'p-2')
            expect(result).toBe('p-2')
        })
    })
})
