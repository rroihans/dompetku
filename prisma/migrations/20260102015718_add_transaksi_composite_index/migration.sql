-- DropIndex
DROP INDEX "transaksi_tanggal_idx";

-- CreateIndex
CREATE INDEX "transaksi_tanggal_id_idx" ON "transaksi"("tanggal", "id");
