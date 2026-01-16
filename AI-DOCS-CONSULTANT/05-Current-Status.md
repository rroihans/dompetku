# Current Status & Plans

## CHANGELOG
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.1] - 2026-01-02

### Added
- **Flexible Account Settings:** Kontrol penuh per-akun untuk biaya admin dan bunga tabungan tanpa terikat kaku pada template.
- **Starting Point Approach:** Template kini berfungsi sebagai *auto-fill* awal yang tetap dapat dimodifikasi saat pembuatan akun.
- **Account Settings Tab:** Halaman detail akun baru dengan tab "Pengaturan" untuk konfigurasi mendalam.
- **Pattern Builder UI:** Komponen interaktif untuk membangun dan melihat preview jadwal tagihan biaya admin (5 jadwal ke depan).
- **Tier Editor & Interest Calculator:** Editor visual untuk tier bunga dan alat simulasi perhitungan bunga netto (setelah pajak 20%).
- **Isolasi Transaksi:** Setiap proses automasi akun kini berjalan dalam transaksi terpisah untuk mencegah kegagalan massal (*Partial Success* support).
- **Advanced Logging:** Filter log khusus untuk aktivitas automasi di halaman Pengaturan.

### Changed
- Migrasi data kepemilikan otomasi dari `AccountTemplate` langsung ke model `Akun`.
- Update `AddAccountForm` dengan dukungan field otomasi yang dapat diedit.
- Peningkatan `processMonthlyAdminFees` dan `processMonthlyInterest` dengan penanganan error per-akun.

### Fixed
- Isu fleksibilitas pengaturan bank yang sebelumnya bersifat global/read-only.
- Peningkatan akurasi perhitungan bunga dengan pembulatan ke bawah.

## [0.4.0] - 2026-01-02

### Added
- **Fitur Account Templates:** Sistem template untuk konfigurasi biaya admin dan bunga bank.
- **Automasi Perbankan:** Engine untuk memproses biaya admin bulanan dan kredit bunga otomatis.
- **Pola Tagihan Fleksibel:** Dukungan pola Tanggal Tetap, Jumat Minggu ke-3 (BCA Xpresi), dan Hari Kerja Terakhir.
- **Dashboard Widget:** Widget "Pengingat Biaya Admin" untuk tagihan yang akan datang dalam 7 hari.
- **Settings Automation:** Section "Automasi Keuangan" di Pengaturan dengan manual trigger dan mode simulasi (Dry Run).
- **History Logs:** Integrasi 5 log aktivitas terakhir dari `LogSistem` di halaman Pengaturan.
- **Account Integration:** Badge informasi template dan auto-fill pada form akun.

### Changed
- Modifikasi skema database Prisma untuk mendukung model `AccountTemplate`.
- Update Dashboard untuk menyertakan widget pengingat biaya admin.
- Peningkatan halaman Pengaturan dengan fitur kontrol automasi.

### Fixed
- Perbaikan isu sinkronisasi saldo saat proses automasi massal menggunakan Prisma Transaction.
- Penanganan tipe data nominal nullable pada komponen UI pengingat.

## [0.3.7] - 2026-01-02
- Database & Performance Optimization.
- Halaman Detail Akun.
- Running Balance pada riwayat transaksi.

## [0.3.0] - 2025-12-27
- Chart Improvements: Area, Bar, Donut, and Drill-down charts.

## [0.2.0] - 2025-12-27
- Fitur Cicilan & Budget lengkap.
- Backup/Restore.
- Privacy Mode (Blur).

## [0.1.0] - 2025-12-26
- Inisialisasi Proyek.
- CRUD Akun & Transaksi.


## PRODUCT SPECS
# Product Guide: Dompetku

## Initial Concept
Personal finance management application for tracking accounts, credit card installments, and net worth.

## Target Audience
- Individuals looking to track daily expenses and savings.
- Power users managing multiple bank accounts, e-wallets, and credit card installments.

## Product Goals
- Gain a clear understanding of total net worth and asset composition.
- Automate the tedious process of tracking credit card installments and recurring bills.
- Identify and reduce unnecessary spending through detailed category-based analysis.

## Core Features
- **Core Transaction Engine:** Robust double-entry bookkeeping (debit/kredit) for accurate financial tracking.
- **Automated Installment Engine:** Specialized management for credit card installments (cicilan), including automated generation of monthly transactions and calculation of fees/interest.
- **Visual Analytics Dashboard:** High-level overview of net worth trends with real-time snapshots, asset composition, and spending breakdowns using interactive charts with deep drill-down and deterministic account history tracking.
- **Budgeting System:** Ability to set monthly spending limits per category and monitor progress in real-time.
- **Flexible Banking Automation:** Precision policy-based system for automating bank fees and interest. Supports "Minimum Balance" calculations for 90%+ accuracy, per-account customization of billing patterns, and automated tiered interest processing with tax handling.
- **Multi-Account Support:** Comprehensive tracking for Banks, E-Wallets, Credit Cards, and Cash accounts, with detailed account history and balance auditing.


## WORKFLOW
# Workflow: Dompetku

## General Rules
- Adhere to Test-Driven Development (TDD) principles where feasible.
- Ensure >80% code test coverage for new features.
- Update `LOG_PERUBAHAN.md` after every completed task.
- Use Bahasa Indonesia for UI-related code and comments.

## Git Protocol
- Commit changes after every individual task.
- Use Git Notes to record a summary of each task.
- Ensure the commit message is descriptive and follows the project convention.

## Verification
- Run build and lint checks before completing any phase.
- Perform manual verification for UI responsiveness on both Mobile and Desktop.