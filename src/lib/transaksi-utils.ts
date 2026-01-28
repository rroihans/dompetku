import { Money } from "./money";
import { RuleGroup, buildPrismaQuery } from "./query-builder";

export interface TransaksiFilter {
    page?: number
    search?: string
    kategori?: string | string[]
    tipe?: string // "expense" | "income"
    dateFrom?: string
    dateTo?: string
    minNominal?: number
    maxNominal?: number
    sort?: string // "tanggal" | "nominal" | "kategori"
    sortDir?: string // "asc" | "desc"
    akunId?: string | string[]
    complexFilter?: string // JSON string
}

export function buildTransaksiWhere(filters: TransaksiFilter) {
    const {
        search,
        kategori,
        tipe,
        dateFrom,
        dateTo,
        minNominal,
        maxNominal,
        akunId,
        complexFilter
    } = filters

    const where: any = {}

    if (akunId) {
        const akuns = Array.isArray(akunId) ? akunId : [akunId];
        if (akuns.length > 0) {
            where.OR = [
                { debitAkunId: { in: akuns } },
                { kreditAkunId: { in: akuns } }
            ]
        }
    }

    if (search) {
        const searchClause = [
            { deskripsi: { contains: search } },
            { kategori: { contains: search } },
            { catatan: { contains: search } },
            { debitAkun: { nama: { contains: search } } },
            { kreditAkun: { nama: { contains: search } } },
        ];

        if (where.OR) {
            where.AND = [
                ...(where.AND || []),
                { OR: searchClause }
            ]
        } else {
            where.OR = searchClause;
        }
    }

    if (kategori) {
        if (Array.isArray(kategori)) {
            if (kategori.length > 0) where.kategori = { in: kategori }
        } else {
            where.kategori = kategori
        }
    }

    if (tipe === "expense") {
        where.debitAkun = { tipe: "EXPENSE" }
    } else if (tipe === "income") {
        where.kreditAkun = { tipe: "INCOME" }
    }

    if (dateFrom || dateTo) {
        where.tanggal = {}
        if (dateFrom) {
            where.tanggal.gte = new Date(dateFrom)
        }
        if (dateTo) {
            const endDate = new Date(dateTo)
            endDate.setHours(23, 59, 59, 999)
            where.tanggal.lte = endDate
        }
    }

    if (minNominal !== undefined || maxNominal !== undefined) {
        where.nominal = {}
        if (minNominal !== undefined && minNominal > 0) {
            where.nominal.gte = BigInt(Money.fromFloat(minNominal))
        }
        if (maxNominal !== undefined && maxNominal > 0) {
            where.nominal.lte = BigInt(Money.fromFloat(maxNominal))
        }
    }

    if (complexFilter) {
        try {
            const group = JSON.parse(complexFilter) as RuleGroup;
            const prismaQuery = buildPrismaQuery(group);

            if (Object.keys(prismaQuery).length > 0) {
                if (where.AND) {
                    if (!Array.isArray(where.AND)) where.AND = [where.AND];
                    where.AND.push(prismaQuery);
                } else {
                    where.AND = [prismaQuery];
                }
            }
        } catch (e) {
            console.error("Invalid complex filter JSON", e);
        }
    }

    return where
}

export function buildTransaksiOrderBy(sort: string = "tanggal", sortDir: string = "desc") {
    const orderBy: any[] = []
    const validSort = ["tanggal", "nominal", "kategori"].includes(sort) ? sort : "tanggal"
    const validDir = sortDir === "asc" ? "asc" : "desc"

    orderBy.push({ [validSort]: validDir })

    if (validSort !== "id") {
        orderBy.push({ id: "desc" })
    }
    return orderBy
}
