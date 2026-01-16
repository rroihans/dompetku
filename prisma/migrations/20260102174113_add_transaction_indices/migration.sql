-- DropIndex
DROP INDEX "transaksi_kreditAkunId_idx";

-- DropIndex
DROP INDEX "transaksi_debitAkunId_idx";

-- CreateIndex
CREATE INDEX "transaksi_debitAkunId_tanggal_idx" ON "transaksi"("debitAkunId", "tanggal");

-- CreateIndex
CREATE INDEX "transaksi_kreditAkunId_tanggal_idx" ON "transaksi"("kreditAkunId", "tanggal");
