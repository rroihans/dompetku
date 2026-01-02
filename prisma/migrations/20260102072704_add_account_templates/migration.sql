-- CreateTable
CREATE TABLE "account_template" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "tipeAkun" TEXT NOT NULL,
    "biayaAdmin" REAL,
    "bungaTier" TEXT,
    "polaTagihan" TEXT NOT NULL,
    "tanggalTagihan" INTEGER,
    "deskripsi" TEXT DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_akun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "tipe" TEXT NOT NULL,
    "saldoAwal" REAL NOT NULL DEFAULT 0,
    "saldoSekarang" REAL NOT NULL DEFAULT 0,
    "limitKredit" REAL,
    "icon" TEXT,
    "warna" TEXT,
    "templateId" TEXT,
    "setoranAwal" REAL,
    "lastAdminChargeDate" DATETIME,
    "lastInterestCreditDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "akun_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "account_template" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_akun" ("createdAt", "icon", "id", "limitKredit", "nama", "saldoAwal", "saldoSekarang", "tipe", "updatedAt", "warna") SELECT "createdAt", "icon", "id", "limitKredit", "nama", "saldoAwal", "saldoSekarang", "tipe", "updatedAt", "warna" FROM "akun";
DROP TABLE "akun";
ALTER TABLE "new_akun" RENAME TO "akun";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
