import { TransaksiRecord } from "@/lib/db/app-db";

export interface MappedTransaksi extends TransaksiRecord {
    nominal: number;
    catatan?: string | null;
    debitAkun: { 
        id: string; 
        nama: string; 
        tipe: string; 
        isSyariah?: boolean | null
    } | null;
    kreditAkun: { 
        id: string; 
        nama: string; 
        tipe: string; 
        isSyariah?: boolean | null 
    } | null;
    saldoSetelah?: number;
    categoryIcon?: string;
    recurrenceId?: string;
    isSubscription?: boolean;
}
