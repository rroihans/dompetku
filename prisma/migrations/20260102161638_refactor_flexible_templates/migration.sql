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
    "templateSource" TEXT,
    "biayaAdminAktif" BOOLEAN NOT NULL DEFAULT false,
    "biayaAdminNominal" INTEGER,
    "biayaAdminPola" TEXT,
    "biayaAdminTanggal" INTEGER,
    "bungaAktif" BOOLEAN NOT NULL DEFAULT false,
    "bungaTiers" TEXT,
    "templateOverrides" TEXT,
    "settingsLastModified" DATETIME,
    "setoranAwal" REAL,
    "lastAdminChargeDate" DATETIME,
    "lastInterestCreditDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "akun_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "account_template" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_akun" ("createdAt", "icon", "id", "lastAdminChargeDate", "lastInterestCreditDate", "limitKredit", "nama", "saldoAwal", "saldoSekarang", "setoranAwal", "templateId", "tipe", "updatedAt", "warna") SELECT "createdAt", "icon", "id", "lastAdminChargeDate", "lastInterestCreditDate", "limitKredit", "nama", "saldoAwal", "saldoSekarang", "setoranAwal", "templateId", "tipe", "updatedAt", "warna" FROM "akun";
DROP TABLE "akun";
ALTER TABLE "new_akun" RENAME TO "akun";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
