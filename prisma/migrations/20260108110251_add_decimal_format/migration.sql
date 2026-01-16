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
    "isSyariah" BOOLEAN,
    "billingDate" INTEGER,
    "dueDate" INTEGER,
    "minPaymentFixed" REAL,
    "minPaymentPercent" REAL DEFAULT 5,
    "minInstallmentAmount" REAL,
    "useDecimalFormat" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "akun_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "account_template" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_akun" ("biayaAdminAktif", "biayaAdminNominal", "biayaAdminPola", "biayaAdminTanggal", "billingDate", "bungaAktif", "bungaTiers", "createdAt", "dueDate", "icon", "id", "isSyariah", "lastAdminChargeDate", "lastInterestCreditDate", "limitKredit", "minInstallmentAmount", "minPaymentFixed", "minPaymentPercent", "nama", "saldoAwal", "saldoSekarang", "setoranAwal", "settingsLastModified", "templateId", "templateOverrides", "templateSource", "tipe", "updatedAt", "warna") SELECT "biayaAdminAktif", "biayaAdminNominal", "biayaAdminPola", "biayaAdminTanggal", "billingDate", "bungaAktif", "bungaTiers", "createdAt", "dueDate", "icon", "id", "isSyariah", "lastAdminChargeDate", "lastInterestCreditDate", "limitKredit", "minInstallmentAmount", "minPaymentFixed", "minPaymentPercent", "nama", "saldoAwal", "saldoSekarang", "setoranAwal", "settingsLastModified", "templateId", "templateOverrides", "templateSource", "tipe", "updatedAt", "warna" FROM "akun";
DROP TABLE "akun";
ALTER TABLE "new_akun" RENAME TO "akun";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
