import '@testing-library/jest-dom'
import { expect, afterEach, beforeAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// ============================================
// GLOBAL SETUP
// ============================================

// Cleanup after each test (remove mounted components)
afterEach(() => {
    cleanup()
})

// ============================================
// MOCK INDEXEDDB (Critical for Dexie.js)
// ============================================

import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'

beforeAll(() => {
    // Reset IndexedDB before all tests
    global.indexedDB = new IDBFactory()
})

// ============================================
// MOCK BROWSER APIs
// ============================================

// Mock window.matchMedia (used by Tailwind/responsive components)
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // Deprecated
        removeListener: vi.fn(), // Deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
})

// Mock window.scrollTo (used in navigation)
Object.defineProperty(window, 'scrollTo', {
    writable: true,
    value: vi.fn(),
})

// Mock localStorage (if needed)
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
}
global.localStorage = localStorageMock as any

// ============================================
// CUSTOM MATCHERS
// ============================================

// Add custom matcher for currency values
expect.extend({
    toBeValidRupiah(received: number) {
        const pass =
            typeof received === 'number' &&
            received >= 0 &&
            Number.isInteger(received)

        return {
            pass,
            message: () =>
                pass
                    ? `Expected ${received} NOT to be valid Rupiah`
                    : `Expected ${received} to be valid Rupiah (non-negative integer)`
        }
    }
})

// Add custom matcher for double-entry balance
expect.extend({
    toBalanceDoubleEntry(received: { debit: number; credit: number }) {
        const pass = received.debit === received.credit

        return {
            pass,
            message: () =>
                pass
                    ? `Expected debits (${received.debit}) NOT to equal credits (${received.credit})`
                    : `Expected debits (${received.debit}) to equal credits (${received.credit}). Difference: ${Math.abs(received.debit - received.credit)}`
        }
    }
})

// ============================================
// GLOBAL TEST UTILITIES
// ============================================

// Mock current date for consistent testing
export const mockDate = (date: string | Date) => {
    vi.setSystemTime(new Date(date))
}

// Reset mocked date
export const resetMockDate = () => {
    vi.useRealTimers()
}

// Helper: Wait for async operations
export const waitFor = (ms: number) =>
    new Promise(resolve => setTimeout(resolve, ms))

// Helper: Create test transaction data
export const createMockTransactionData = (overrides = {}) => ({
    tanggal: new Date('2026-01-15'),
    nominalInt: 50000,
    keterangan: 'Test Transaction',
    idAkunDebit: 1,
    idAkunKredit: 2,
    idempotencyKey: `test-${Date.now()}`,
    ...overrides
})

// Helper: Create test account data
export const createMockAccountData = (overrides = {}) => ({
    nama: 'Test Account',
    tipe: 'DOMPET',
    saldoAwalInt: 1000000,
    mata_uang: 'IDR',
    ...overrides
})
