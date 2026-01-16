import { formatCurrency } from "./format";

export type TierBunga = {
  min_saldo: number;
  max_saldo: number | null;
  bunga_pa: number;
};

/**
 * Menghitung tanggal tagihan berikutnya berdasarkan pola tagihan.
 */
export function calculateNextBillingDate(
  pola: string,
  tanggal?: number | null,
  fromDate: Date = new Date()
): Date {
  const result = new Date(fromDate);
  result.setHours(0, 0, 0, 0);

  if (pola === "TANGGAL_TETAP") {
    if (!tanggal) return result;
    result.setDate(tanggal);
    // Jika tanggal sudah lewat di bulan ini, pindah ke bulan depan
    if (result < fromDate) {
      result.setMonth(result.getMonth() + 1);
    }
  } else if (pola === "JUMAT_MINGGU_KETIGA") {
    // Cari tanggal 1 bulan ini
    const firstDay = new Date(result.getFullYear(), result.getMonth(), 1);
    // Cari Jumat pertama
    let fridayCount = 0;
    const currentDay = firstDay;
    while (fridayCount < 1) {
      if (currentDay.getDay() === 5) { // 5 = Jumat
        fridayCount++;
      } else {
        currentDay.setDate(currentDay.getDate() + 1);
      }
    }
    // Jumat ketiga = Jumat pertama + 14 hari
    const thirdFriday = new Date(currentDay);
    thirdFriday.setDate(thirdFriday.getDate() + 14);
    
    // Jika Jumat ketiga bulan ini sudah lewat, hitung untuk bulan depan
    if (thirdFriday < fromDate) {
      const nextMonthFirstDay = new Date(result.getFullYear(), result.getMonth() + 1, 1);
      let nextFridayCount = 0;
      const nextCurrentDay = nextMonthFirstDay;
      while (nextFridayCount < 1) {
        if (nextCurrentDay.getDay() === 5) {
          nextFridayCount++;
        } else {
          nextCurrentDay.setDate(nextCurrentDay.getDate() + 1);
        }
      }
      const nextThirdFriday = new Date(nextCurrentDay);
      nextThirdFriday.setDate(nextThirdFriday.getDate() + 14);
      return nextThirdFriday;
    }
    return thirdFriday;
  } else if (pola === "HARI_KERJA_TERAKHIR") {
    // Cari hari terakhir bulan ini
    const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0);
    // Jika weekend, mundur ke Jumat
    if (lastDay.getDay() === 0) { // Minggu
      lastDay.setDate(lastDay.getDate() - 2);
    } else if (lastDay.getDay() === 6) { // Sabtu
      lastDay.setDate(lastDay.getDate() - 1);
    }

    if (lastDay < fromDate) {
      const nextMonthLastDay = new Date(result.getFullYear(), result.getMonth() + 2, 0);
      if (nextMonthLastDay.getDay() === 0) {
        nextMonthLastDay.setDate(nextMonthLastDay.getDate() - 2);
      } else if (nextMonthLastDay.getDay() === 6) {
        nextMonthLastDay.setDate(nextMonthLastDay.getDate() - 1);
      }
      return nextMonthLastDay;
    }
    return lastDay;
  }

  return result;
}

/**
 * Mencari bunga p.a. yang berlaku berdasarkan saldo dan tier bunga.
 */
export function getApplicableInterestRate(saldo: number, tiers: TierBunga[]): number {
  if (!tiers || tiers.length === 0) return 0;
  
  const applicableTier = tiers.find(tier => {
    const minMatch = saldo >= tier.min_saldo;
    const maxMatch = tier.max_saldo === null || saldo <= tier.max_saldo;
    return minMatch && maxMatch;
  });

  return applicableTier ? applicableTier.bunga_pa : 0;
}

/**
 * Memformat informasi template ke dalam string deskriptif.
 */
export function formatTemplateInfo(template: {
  nama: string;
  biayaAdmin: number | null;
  polaTagihan: string;
  tanggalTagihan?: number | null;
}): string {
  let billingInfo = "";
  if (template.polaTagihan === "TANGGAL_TETAP") {
    billingInfo = `setiap tanggal ${template.tanggalTagihan}`;
  } else if (template.polaTagihan === "JUMAT_MINGGU_KETIGA") {
    billingInfo = "setiap Jumat minggu ketiga";
  } else if (template.polaTagihan === "HARI_KERJA_TERAKHIR") {
    billingInfo = "setiap hari kerja terakhir";
  }

  const adminFeeInfo = template.biayaAdmin 
    ? `${formatCurrency(template.biayaAdmin)} per bulan` 
    : "Tanpa biaya admin";

  return `${template.nama}: ${adminFeeInfo}, ditagih ${billingInfo}.`;
}
