import { Metadata } from "next"
import { BalanceVerificationClient } from "./client"

export const metadata: Metadata = {
    title: "Verifikasi Saldo",
}

export default function VerifyBalancePage() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Verifikasi Saldo</h3>
                <p className="text-sm text-muted-foreground">
                    Cek integritas saldo akun dengan menghitung ulang dari histori transaksi.
                </p>
            </div>
            <BalanceVerificationClient />
        </div>
    )
}
