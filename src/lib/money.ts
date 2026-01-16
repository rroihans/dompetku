export const Money = {
  /**
   * Mengkonversi nilai float ke integer (sen/cents).
   * Contoh: 10000.50 -> 1000050
   */
  fromFloat: (amount: number): number => {
    return Math.round(amount * 100);
  },

  /**
   * Mengkonversi nilai integer (sen/cents) ke float.
   * Contoh: 1000050 -> 10000.50
   */
  toFloat: (amount: number): number => {
    return amount / 100;
  },

  /**
   * Memformat nilai integer ke format Rupiah.
   * Contoh: 1000050 -> "Rp 10.000,50"
   */
  format: (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 2,
    }).format(amount / 100);
  },

  /**
   * Menjumlahkan dua nilai integer.
   */
  add: (a: number, b: number): number => {
    return a + b;
  },

  /**
   * Mengurangkan dua nilai integer.
   */
  subtract: (a: number, b: number): number => {
    return a - b;
  },
  
  /**
   * Mengalikan nilai integer dengan faktor (misal: bunga).
   * Hasil dibulatkan ke integer terdekat.
   */
  multiply: (amount: number, factor: number): number => {
    return Math.round(amount * factor);
  }
};
