-- AlterTable
ALTER TABLE "akun" ADD COLUMN "limitKreditInt" BIGINT;
ALTER TABLE "akun" ADD COLUMN "minInstallmentAmountInt" BIGINT;
ALTER TABLE "akun" ADD COLUMN "minPaymentFixedInt" BIGINT;
ALTER TABLE "akun" ADD COLUMN "saldoAwalInt" BIGINT DEFAULT 0;
ALTER TABLE "akun" ADD COLUMN "saldoSekarangInt" BIGINT DEFAULT 0;
ALTER TABLE "akun" ADD COLUMN "setoranAwalInt" BIGINT;

-- AlterTable
ALTER TABLE "rencana_cicilan" ADD COLUMN "biayaAdminInt" BIGINT DEFAULT 0;
ALTER TABLE "rencana_cicilan" ADD COLUMN "nominalPerBulanInt" BIGINT;
ALTER TABLE "rencana_cicilan" ADD COLUMN "totalPokokInt" BIGINT;

-- AlterTable
ALTER TABLE "transaksi" ADD COLUMN "nominalInt" BIGINT;
