-- CreateIndex
CREATE INDEX "admin_fee_akunId_isActive_idx" ON "admin_fee"("akunId", "isActive");

-- CreateIndex
CREATE INDEX "budget_bulan_tahun_idx" ON "budget"("bulan", "tahun");

-- CreateIndex
CREATE INDEX "budget_kategori_bulan_tahun_idx" ON "budget"("kategori", "bulan", "tahun");

-- CreateIndex
CREATE INDEX "recurring_transaction_aktif_frekuensi_idx" ON "recurring_transaction"("aktif", "frekuensi");

-- CreateIndex
CREATE INDEX "recurring_transaction_terakhirDieksekusi_idx" ON "recurring_transaction"("terakhirDieksekusi");

-- CreateIndex
CREATE INDEX "rencana_cicilan_status_tanggalJatuhTempo_idx" ON "rencana_cicilan"("status", "tanggalJatuhTempo");
