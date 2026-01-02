-- CreateTable
CREATE TABLE "akun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "tipe" TEXT NOT NULL,
    "saldoAwal" REAL NOT NULL DEFAULT 0,
    "saldoSekarang" REAL NOT NULL DEFAULT 0,
    "limitKredit" REAL,
    "icon" TEXT,
    "warna" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "transaksi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tanggal" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deskripsi" TEXT NOT NULL,
    "nominal" REAL NOT NULL,
    "kategori" TEXT NOT NULL,
    "debitAkunId" TEXT NOT NULL,
    "kreditAkunId" TEXT NOT NULL,
    "rencanaCicilanId" TEXT,
    "idempotencyKey" TEXT,
    "catatan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transaksi_debitAkunId_fkey" FOREIGN KEY ("debitAkunId") REFERENCES "akun" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transaksi_kreditAkunId_fkey" FOREIGN KEY ("kreditAkunId") REFERENCES "akun" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transaksi_rencanaCicilanId_fkey" FOREIGN KEY ("rencanaCicilanId") REFERENCES "rencana_cicilan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rencana_cicilan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "namaProduk" TEXT NOT NULL,
    "totalPokok" REAL NOT NULL,
    "tenor" INTEGER NOT NULL,
    "cicilanKe" INTEGER NOT NULL DEFAULT 1,
    "nominalPerBulan" REAL NOT NULL,
    "biayaAdmin" REAL NOT NULL DEFAULT 0,
    "bungaPersen" REAL NOT NULL DEFAULT 0,
    "tanggalJatuhTempo" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "akunKreditId" TEXT NOT NULL,
    "akunDebitId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "log_sistem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "level" TEXT NOT NULL,
    "modul" TEXT NOT NULL,
    "pesan" TEXT NOT NULL,
    "stackTrace" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "budget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kategori" TEXT NOT NULL,
    "bulan" INTEGER NOT NULL,
    "tahun" INTEGER NOT NULL,
    "nominal" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "recurring_transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "nominal" REAL NOT NULL,
    "kategori" TEXT NOT NULL,
    "tipeTransaksi" TEXT NOT NULL,
    "akunId" TEXT NOT NULL,
    "frekuensi" TEXT NOT NULL,
    "hariDalamBulan" INTEGER,
    "hariDalamMinggu" INTEGER,
    "tanggalMulai" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tanggalSelesai" DATETIME,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "terakhirDieksekusi" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "template_transaksi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "nominal" REAL NOT NULL,
    "kategori" TEXT NOT NULL,
    "tipeTransaksi" TEXT NOT NULL,
    "akunId" TEXT NOT NULL,
    "icon" TEXT,
    "warna" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "net_worth_snapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tanggal" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalAset" REAL NOT NULL,
    "totalHutang" REAL NOT NULL,
    "netWorth" REAL NOT NULL,
    "breakdown" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "currency_rate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kodeAsal" TEXT NOT NULL,
    "kodeTujuan" TEXT NOT NULL DEFAULT 'IDR',
    "rate" REAL NOT NULL,
    "tanggalUpdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "app_setting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kunci" TEXT NOT NULL,
    "nilai" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "transaksi_idempotencyKey_key" ON "transaksi"("idempotencyKey");

-- CreateIndex
CREATE INDEX "transaksi_tanggal_idx" ON "transaksi"("tanggal");

-- CreateIndex
CREATE INDEX "transaksi_kategori_idx" ON "transaksi"("kategori");

-- CreateIndex
CREATE INDEX "transaksi_debitAkunId_idx" ON "transaksi"("debitAkunId");

-- CreateIndex
CREATE INDEX "transaksi_kreditAkunId_idx" ON "transaksi"("kreditAkunId");

-- CreateIndex
CREATE UNIQUE INDEX "budget_kategori_bulan_tahun_key" ON "budget"("kategori", "bulan", "tahun");

-- CreateIndex
CREATE UNIQUE INDEX "currency_rate_kodeAsal_kodeTujuan_key" ON "currency_rate"("kodeAsal", "kodeTujuan");

-- CreateIndex
CREATE UNIQUE INDEX "app_setting_kunci_key" ON "app_setting"("kunci");
