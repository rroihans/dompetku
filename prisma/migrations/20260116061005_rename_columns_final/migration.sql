/*
  Warnings:

  - You are about to drop the column `biayaAdminInt` on the `rencana_cicilan` table. All the data in the column will be lost.
  - You are about to drop the column `nominalPerBulanInt` on the `rencana_cicilan` table. All the data in the column will be lost.
  - You are about to drop the column `totalPokokInt` on the `rencana_cicilan` table. All the data in the column will be lost.
  - You are about to alter the column `biayaAdmin` on the `rencana_cicilan` table. The data in that column could be lost. The data in that column will be cast from `Float` to `BigInt`.
  - You are about to alter the column `nominalPerBulan` on the `rencana_cicilan` table. The data in that column could be lost. The data in that column will be cast from `Float` to `BigInt`.
  - You are about to alter the column `totalPokok` on the `rencana_cicilan` table. The data in that column could be lost. The data in that column will be cast from `Float` to `BigInt`.
  - You are about to drop the column `limitKreditInt` on the `akun` table. All the data in the column will be lost.
  - You are about to drop the column `minInstallmentAmountInt` on the `akun` table. All the data in the column will be lost.
  - You are about to drop the column `minPaymentFixedInt` on the `akun` table. All the data in the column will be lost.
  - You are about to drop the column `saldoAwalInt` on the `akun` table. All the data in the column will be lost.
  - You are about to drop the column `saldoSekarangInt` on the `akun` table. All the data in the column will be lost.
  - You are about to drop the column `setoranAwalInt` on the `akun` table. All the data in the column will be lost.
  - You are about to alter the column `limitKredit` on the `akun` table. The data in that column could be lost. The data in that column will be cast from `Float` to `BigInt`.
  - You are about to alter the column `minInstallmentAmount` on the `akun` table. The data in that column could be lost. The data in that column will be cast from `Float` to `BigInt`.
  - You are about to alter the column `minPaymentFixed` on the `akun` table. The data in that column could be lost. The data in that column will be cast from `Float` to `BigInt`.
  - You are about to alter the column `saldoAwal` on the `akun` table. The data in that column could be lost. The data in that column will be cast from `Float` to `BigInt`.
  - You are about to alter the column `saldoSekarang` on the `akun` table. The data in that column could be lost. The data in that column will be cast from `Float` to `BigInt`.
  - You are about to alter the column `setoranAwal` on the `akun` table. The data in that column could be lost. The data in that column will be cast from `Float` to `BigInt`.
  - You are about to drop the column `nominalInt` on the `transaksi` table. All the data in the column will be lost.
  - You are about to alter the column `nominal` on the `transaksi` table. The data in that column could be lost. The data in that column will be cast from `Float` to `BigInt`.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_rencana_cicilan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "namaProduk" TEXT NOT NULL,
    "totalPokok" BIGINT NOT NULL,
    "tenor" INTEGER NOT NULL,
    "cicilanKe" INTEGER NOT NULL DEFAULT 1,
    "nominalPerBulan" BIGINT NOT NULL,
    "biayaAdmin" BIGINT NOT NULL DEFAULT 0,
    "bungaPersen" REAL NOT NULL DEFAULT 0,
    "tanggalJatuhTempo" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "akunKreditId" TEXT NOT NULL,
    "akunDebitId" TEXT NOT NULL,
    "isConvertedFromTx" BOOLEAN NOT NULL DEFAULT false,
    "originalTxId" TEXT,
    "templateId" TEXT,
    "adminFeeType" TEXT,
    "adminFeeAmount" REAL,
    "installmentType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "rencana_cicilan_originalTxId_fkey" FOREIGN KEY ("originalTxId") REFERENCES "transaksi" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "rencana_cicilan_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "installment_template" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_rencana_cicilan" ("adminFeeAmount", "adminFeeType", "akunDebitId", "akunKreditId", "biayaAdmin", "bungaPersen", "cicilanKe", "createdAt", "id", "installmentType", "isConvertedFromTx", "namaProduk", "nominalPerBulan", "originalTxId", "status", "tanggalJatuhTempo", "templateId", "tenor", "totalPokok", "updatedAt") SELECT "adminFeeAmount", "adminFeeType", "akunDebitId", "akunKreditId", "biayaAdminInt", "bungaPersen", "cicilanKe", "createdAt", "id", "installmentType", "isConvertedFromTx", "namaProduk", "nominalPerBulanInt", "originalTxId", "status", "tanggalJatuhTempo", "templateId", "tenor", "totalPokokInt", "updatedAt" FROM "rencana_cicilan";
DROP TABLE "rencana_cicilan";
ALTER TABLE "new_rencana_cicilan" RENAME TO "rencana_cicilan";
CREATE UNIQUE INDEX "rencana_cicilan_originalTxId_key" ON "rencana_cicilan"("originalTxId");
CREATE TABLE "new_akun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "tipe" TEXT NOT NULL,
    "saldoAwal" BIGINT NOT NULL DEFAULT 0,
    "saldoSekarang" BIGINT NOT NULL DEFAULT 0,
    "limitKredit" BIGINT,
    "icon" TEXT,
    "warna" TEXT,
    "templateId" TEXT,
    "templateSource" TEXT,
    "biayaAdminAktif" BOOLEAN NOT NULL DEFAULT false,
    "biayaAdminNominal" INTEGER,
    "biayaAdminPola" TEXT,
    "biayaAdminTanggal" INTEGER,
    "bungaAktif" BOOLEAN NOT NULL DEFAULT false,
    "bungaTiers" TEXT,
    "templateOverrides" TEXT,
    "settingsLastModified" DATETIME,
    "setoranAwal" BIGINT,
    "lastAdminChargeDate" DATETIME,
    "lastInterestCreditDate" DATETIME,
    "isSyariah" BOOLEAN,
    "billingDate" INTEGER,
    "dueDate" INTEGER,
    "minPaymentFixed" BIGINT,
    "minPaymentPercent" REAL DEFAULT 5,
    "minInstallmentAmount" BIGINT,
    "useDecimalFormat" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "akun_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "account_template" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_akun" ("biayaAdminAktif", "biayaAdminNominal", "biayaAdminPola", "biayaAdminTanggal", "billingDate", "bungaAktif", "bungaTiers", "createdAt", "dueDate", "icon", "id", "isSyariah", "lastAdminChargeDate", "lastInterestCreditDate", "limitKredit", "minInstallmentAmount", "minPaymentFixed", "minPaymentPercent", "nama", "saldoAwal", "saldoSekarang", "setoranAwal", "settingsLastModified", "templateId", "templateOverrides", "templateSource", "tipe", "updatedAt", "useDecimalFormat", "warna") SELECT "biayaAdminAktif", "biayaAdminNominal", "biayaAdminPola", "biayaAdminTanggal", "billingDate", "bungaAktif", "bungaTiers", "createdAt", "dueDate", "icon", "id", "isSyariah", "lastAdminChargeDate", "lastInterestCreditDate", "limitKreditInt", "minInstallmentAmountInt", "minPaymentFixedInt", "minPaymentPercent", "nama", "saldoAwalInt", "saldoSekarangInt", "setoranAwalInt", "settingsLastModified", "templateId", "templateOverrides", "templateSource", "tipe", "updatedAt", "useDecimalFormat", "warna" FROM "akun";
DROP TABLE "akun";
ALTER TABLE "new_akun" RENAME TO "akun";
CREATE TABLE "new_transaksi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tanggal" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deskripsi" TEXT NOT NULL,
    "nominal" BIGINT NOT NULL,
    "kategori" TEXT NOT NULL,
    "debitAkunId" TEXT NOT NULL,
    "kreditAkunId" TEXT NOT NULL,
    "rencanaCicilanId" TEXT,
    "convertedToInstallment" BOOLEAN NOT NULL DEFAULT false,
    "idempotencyKey" TEXT,
    "catatan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transaksi_debitAkunId_fkey" FOREIGN KEY ("debitAkunId") REFERENCES "akun" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transaksi_kreditAkunId_fkey" FOREIGN KEY ("kreditAkunId") REFERENCES "akun" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transaksi_rencanaCicilanId_fkey" FOREIGN KEY ("rencanaCicilanId") REFERENCES "rencana_cicilan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_transaksi" ("catatan", "convertedToInstallment", "createdAt", "debitAkunId", "deskripsi", "id", "idempotencyKey", "kategori", "kreditAkunId", "nominal", "rencanaCicilanId", "tanggal") SELECT "catatan", "convertedToInstallment", "createdAt", "debitAkunId", "deskripsi", "id", "idempotencyKey", "kategori", "kreditAkunId", "nominalInt", "rencanaCicilanId", "tanggal" FROM "transaksi";
DROP TABLE "transaksi";
ALTER TABLE "new_transaksi" RENAME TO "transaksi";
CREATE UNIQUE INDEX "transaksi_idempotencyKey_key" ON "transaksi"("idempotencyKey");
CREATE INDEX "transaksi_tanggal_id_idx" ON "transaksi"("tanggal", "id");
CREATE INDEX "transaksi_kategori_idx" ON "transaksi"("kategori");
CREATE INDEX "transaksi_debitAkunId_tanggal_idx" ON "transaksi"("debitAkunId", "tanggal");
CREATE INDEX "transaksi_kreditAkunId_tanggal_idx" ON "transaksi"("kreditAkunId", "tanggal");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;