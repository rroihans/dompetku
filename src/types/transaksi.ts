import { TransaksiRecord } from "@/lib/db/app-db";

export interface MappedTransaksi extends TransaksiRecord {
    nominal: number;
    catatan: string | null;
    debitAkun: { 
        id: string; 
        nama: string; 
        tipe: string; 
        isSyariah?: boolean 
    } | null;
    kreditAkun: { 
        id: string; 
        nama: string; 
        tipe: string; 
        isSyariah?: boolean 
    } | null;
    saldoSetelah?: number;
}
