import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/lib/db/app-db'
import {
    createKategori,
    getKategoriById,
    updateKategori,
    deleteKategori,
    getAllKategori,
    getMainKategori,
    getSubKategori,
    seedDefaultKategori,
    DEFAULT_CATEGORIES
} from '@/lib/db/kategori-repo'
import { createTransaksi } from '@/lib/db/transactions-repo'
import { resetDatabase, createTestAccounts } from './setup/test-db'

describe('🏷️ CATEGORY REPO - Validation & Logic', () => {

    beforeEach(async () => {
        await resetDatabase()
    })

    // ============================================
    // TEST GROUP 1: CREATION
    // ============================================
    describe('Creation', () => {
        it('should create a valid main category', async () => {
            const res = await createKategori({
                nama: 'Test Category',
                icon: 'Tag',
                warna: '#000000',
                nature: 'NEED',
                show: true
            })
            expect(res.success).toBe(true)
            expect(res.data).toBeDefined()
            expect(res.data?.nama).toBe('Test Category')
            expect(res.data?.parentId).toBeNull()
        })

        it('should create a valid subcategory', async () => {
            // Parent
            const parentRes = await createKategori({
                nama: 'Parent',
                icon: 'Tag',
                warna: '#000000',
                nature: 'NEED'
            })
            const parentId = parentRes.data!.id

            // Child
            const childRes = await createKategori({
                nama: 'Child',
                parentId: parentId,
                icon: 'Tag',
                warna: '#000000',
                nature: 'NEED'
            })
            expect(childRes.success).toBe(true)
            expect(childRes.data?.parentId).toBe(parentId)
        })

        it('should reject creating category with duplicate name', async () => {
            await createKategori({
                nama: 'Unique Name',
                icon: 'Tag',
                warna: '#000000',
                nature: 'NEED'
            })

            const res = await createKategori({
                nama: 'Unique Name', // Duplicate
                icon: 'Other',
                warna: '#ffffff',
                nature: 'WANT'
            })
            expect(res.success).toBe(false)
            expect(res.error).toMatch(/sudah ada|duplicate/i)
        })

        it('should reject creating subcategory with invalid parent', async () => {
            const res = await createKategori({
                nama: 'Orphan',
                parentId: 'non-existent-id',
                icon: 'Tag',
                warna: '#000000',
                nature: 'NEED'
            })
            expect(res.success).toBe(false)
            expect(res.error).toMatch(/induk tidak ditemukan/i)
        })

        it('should reject creating sub-subcategory (max depth = 1)', async () => {
            const p = await createKategori({ nama: 'L1', icon: 'Tag', warna: 'red', nature: 'NEED' })
            const c = await createKategori({ nama: 'L2', parentId: p.data!.id, icon: 'Tag', warna: 'red', nature: 'NEED' })

            const gc = await createKategori({
                nama: 'L3',
                parentId: c.data!.id,
                icon: 'Tag',
                warna: 'red',
                nature: 'NEED'
            })

            expect(gc.success).toBe(false)
            expect(gc.error).toMatch(/max depth/i)
        })
    })

    // ============================================
    // TEST GROUP 2: READING
    // ============================================
    describe('Reading', () => {
        it('should get all, main, and sub categories correctly', async () => {
            // Seed 2 Parents, 1 with 2 children
            const p1 = await createKategori({ nama: 'P1', icon: 'Tag', warna: 'red', nature: 'NEED' })
            const p2 = await createKategori({ nama: 'P2', icon: 'Tag', warna: 'red', nature: 'NEED' })
            await createKategori({ nama: 'C1', parentId: p1.data!.id, icon: 'Tag', warna: 'red', nature: 'NEED', order: 2 })
            await createKategori({ nama: 'C2', parentId: p1.data!.id, icon: 'Tag', warna: 'red', nature: 'NEED', order: 1 })

            const all = await getAllKategori()
            expect(all.length).toBe(4)

            const main = await getMainKategori()
            expect(main.length).toBe(2)
            expect(main.map(m => m.nama).sort()).toEqual(['P1', 'P2'])

            const subs = await getSubKategori(p1.data!.id)
            expect(subs.length).toBe(2)
            // Verify sorting by order
            expect(subs[0].nama).toBe('C2') // Order 1
            expect(subs[1].nama).toBe('C1') // Order 2
        })
    })

    // ============================================
    // TEST GROUP 3: UPDATING
    // ============================================
    describe('Updating', () => {
        it('should update category details', async () => {
            const p1 = await createKategori({ nama: 'Unchanged', icon: 'Tag', warna: 'red', nature: 'NEED' })

            const res = await updateKategori(p1.data!.id, {
                nama: 'Changed',
                warna: 'blue'
            })
            expect(res.success).toBe(true)

            const updated = await getKategoriById(p1.data!.id)
            expect(updated?.nama).toBe('Changed')
            expect(updated?.warna).toBe('blue')
        })

        it('should reject update if name becomes duplicate', async () => {
            await createKategori({ nama: 'Cat A', icon: 'Tag', warna: 'red', nature: 'NEED' })
            const catB = await createKategori({ nama: 'Cat B', icon: 'Tag', warna: 'red', nature: 'NEED' })

            const res = await updateKategori(catB.data!.id, { nama: 'Cat A' })
            expect(res.success).toBe(false)
            expect(res.error).toMatch(/sudah digunakan|duplicate/i)
        })
    })

    // ============================================
    // TEST GROUP 4: DELETION
    // ============================================
    describe('Deletion', () => {
        it('should delete unused category', async () => {
            const p = await createKategori({ nama: 'To Delete', icon: 'Tag', warna: 'red', nature: 'NEED' })
            const res = await deleteKategori(p.data!.id)
            expect(res.success).toBe(true)
            const check = await getKategoriById(p.data!.id)
            expect(check).toBeUndefined()
        })

        it('should prevent deleting category with subcategories', async () => {
            const p = await createKategori({ nama: 'Parent', icon: 'Tag', warna: 'red', nature: 'NEED' })
            await createKategori({ nama: 'Child', parentId: p.data!.id, icon: 'Tag', warna: 'red', nature: 'NEED' })

            const res = await deleteKategori(p.data!.id)
            expect(res.success).toBe(false)
            expect(res.error).toMatch(/subkategori/i)
        })

        it('should prevent deleting category used in transactions', async () => {
            const accounts = await createTestAccounts()
            const cat = await createKategori({ nama: 'Used Cat', icon: 'Tag', warna: 'red', nature: 'NEED' })

            await createTransaksi({
                tanggal: new Date(),
                nominal: 10000,
                kategori: cat.data!.nama, // Stores name string unfortunately, not ID relation strictly in current schema
                tipeTransaksi: 'KELUAR',
                deskripsi: 'Test',
                debitAkunId: accounts.foodExpense.id,
                kreditAkunId: accounts.wallet.id
            })

            const res = await deleteKategori(cat.data!.id)
            expect(res.success).toBe(false)
            expect(res.error).toMatch(/digunakan di/i)
        })
    })

    // ============================================
    // TEST GROUP 5: SEEDING
    // ============================================
    describe('Seeding', () => {
        it('should seed default categories if empty', async () => {
            await seedDefaultKategori()
            const all = await getAllKategori()
            // DEFAULT_CATEGORIES length might change so checking > 0 or specific count
            expect(all.length).toBeGreaterThan(10)

            const salary = all.find(c => c.nama === 'Gaji')
            expect(salary).toBeDefined()
            expect(salary?.nature).toBe('NEED') // Actually defined as NEED or INCOME in array?
            // In DEFAULT_CATEGORIES: Gaji is NEED but visually INCOME?
            // Checking repo file: { nama: "Gaji", ..., nature: "NEED" } in line 13
        })

        it('should skip seeding if already exists', async () => {
            await createKategori({ nama: 'Pre-existing', icon: 'Tag', warna: 'red', nature: 'NEED' })

            await seedDefaultKategori() // Should skip

            const all = await getAllKategori()
            expect(all.length).toBe(1) // Only the pre-existing one
            expect(all[0].nama).toBe('Pre-existing')
        })
    })

})
