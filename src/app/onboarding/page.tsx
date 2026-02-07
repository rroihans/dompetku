"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  CreditCard, 
  Wallet, 
  Smartphone, 
  Banknote,
  Bookmark,
  Receipt,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NumberInput } from "@/components/ui/number-input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createAkun, getAkun } from "@/lib/db/accounts-repo";
import { createTransactionTemplate, getTransactionTemplates, deleteTransactionTemplate } from "@/lib/db/transaction-templates-repo";
import { createTransaksiSimple } from "@/lib/db/transactions-repo";
import { setOnboardingCompleted, getOnboardingStatus } from "@/lib/db/onboarding-repo";
import { formatRupiah } from "@/lib/format";
import type { AccountDTO } from "@/lib/account-dto";
import type { TemplatTransaksiDTO } from "@/lib/db/transaction-templates-repo";

// ============================================
// FORM SCHEMAS
// ============================================

const accountSchema = z.object({
  nama: z.string().min(1, "Nama akun wajib diisi").max(50),
  tipe: z.enum(["BANK", "E_WALLET", "CASH", "CREDIT_CARD"]),
  saldoAwal: z.number().min(0, "Saldo tidak boleh negatif").optional(),
});

const templateSchema = z.object({
  nama: z.string().min(1, "Nama template wajib diisi").max(50),
  deskripsi: z.string().min(1, "Deskripsi wajib diisi"),
  nominal: z.number().min(1000, "Nominal minimal Rp 1.000"),
  kategori: z.string().min(1, "Kategori wajib diisi"),
  tipeTransaksi: z.enum(["MASUK", "KELUAR"]),
});

const transactionSchema = z.object({
  deskripsi: z.string().min(1, "Deskripsi wajib diisi"),
  nominal: z.number().min(1000, "Nominal minimal Rp 1.000"),
  kategori: z.string().min(1, "Kategori wajib diisi"),
  tipeTransaksi: z.enum(["MASUK", "KELUAR"]),
  akunId: z.string().min(1, "Pilih akun"),
});

type AccountFormValues = z.infer<typeof accountSchema>;
type TemplateFormValues = z.infer<typeof templateSchema>;
type TransactionFormValues = z.infer<typeof transactionSchema>;

// ============================================
// CONSTANTS
// ============================================

const ACCOUNT_TYPES = [
  { value: "BANK", label: "Bank", icon: CreditCard, description: "Rekening tabungan/giro" },
  { value: "E_WALLET", label: "E-Wallet", icon: Smartphone, description: "GoPay, OVO, DANA, dll" },
  { value: "CASH", label: "Tunai", icon: Banknote, description: "Uang cash di dompet" },
  { value: "CREDIT_CARD", label: "Kartu Kredit", icon: CreditCard, description: "Visa, Mastercard, dll" },
];

const PRESET_CATEGORIES = [
  "Makanan", "Transportasi", "Belanja", "Hiburan", "Tagihan", 
  "Kesehatan", "Pendidikan", "Gaji", "Bonus", "Investasi"
];

const STEPS = [
  { id: 1, title: "Buat Akun", description: "Akun pertama Anda", required: true },
  { id: 2, title: "Template", description: "Transaksi favorit", required: false },
  { id: 3, title: "Transaksi", description: "Catat pertama", required: false },
];

// ============================================
// MAIN COMPONENT
// ============================================

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  
  // Step 1 state
  const [createdAccount, setCreatedAccount] = useState<AccountDTO | null>(null);
  
  // Step 2 state
  const [createdTemplates, setCreatedTemplates] = useState<TemplatTransaksiDTO[]>([]);
  
  // Step 3 state
  const [accounts, setAccounts] = useState<AccountDTO[]>([]);
  const [transactionCreated, setTransactionCreated] = useState(false);

  // Check if onboarding already completed
  useEffect(() => {
    async function check() {
      const completed = await getOnboardingStatus();
      if (completed) {
        router.push("/dasbor");
        return;
      }
      setCheckingStatus(false);
    }
    check();
  }, [router]);

  // Load accounts for step 3
  useEffect(() => {
    if (currentStep === 3) {
      getAkun().then(setAccounts);
    }
  }, [currentStep]);

  // ============================================
  // STEP 1: Account Creation Form
  // ============================================
  
  const accountForm = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      nama: "",
      tipe: "BANK",
      saldoAwal: 0,
    },
  });

  async function handleCreateAccount(values: AccountFormValues) {
    setLoading(true);
    try {
      const result = await createAkun({
        nama: values.nama,
        tipe: values.tipe,
        saldoAwal: values.saldoAwal ?? 0,
      });
      
      if (result.success && result.data) {
        setCreatedAccount(result.data);
        toast.success(`Akun "${values.nama}" berhasil dibuat!`);
      } else {
        toast.error(result.error || "Gagal membuat akun");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  // ============================================
  // STEP 2: Template Creation Form
  // ============================================
  
  const templateForm = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      nama: "",
      deskripsi: "",
      nominal: undefined,
      kategori: "",
      tipeTransaksi: "KELUAR",
    },
  });

  async function handleCreateTemplate(values: TemplateFormValues) {
    if (!createdAccount) {
      toast.error("Buat akun terlebih dahulu");
      return;
    }
    
    setLoading(true);
    try {
      const result = await createTransactionTemplate({
        nama: values.nama,
        deskripsi: values.deskripsi,
        nominal: values.nominal,
        kategori: values.kategori,
        tipeTransaksi: values.tipeTransaksi,
        akunId: createdAccount.id,
      });
      
      if (result.success && result.data) {
        setCreatedTemplates([...createdTemplates, result.data]);
        templateForm.reset();
        toast.success("Template berhasil ditambahkan!");
      } else {
        toast.error(result.error || "Gagal membuat template");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteTemplate(id: string) {
    await deleteTransactionTemplate(id);
    setCreatedTemplates(createdTemplates.filter(t => t.id !== id));
    toast.success("Template dihapus");
  }

  // ============================================
  // STEP 3: Transaction Creation Form
  // ============================================
  
  const transactionForm = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      deskripsi: "",
      nominal: undefined,
      kategori: "",
      tipeTransaksi: "KELUAR",
      akunId: "",
    },
  });

  // Pre-select account when available
  useEffect(() => {
    if (createdAccount && currentStep === 3) {
      transactionForm.setValue("akunId", createdAccount.id);
    }
  }, [createdAccount, currentStep, transactionForm]);

  async function handleCreateTransaction(values: TransactionFormValues) {
    setLoading(true);
    try {
      const result = await createTransaksiSimple({
        nominal: values.nominal,
        kategori: values.kategori,
        akunId: values.akunId,
        tipeTransaksi: values.tipeTransaksi,
        deskripsi: values.deskripsi,
      });
      
      if (result.success) {
        setTransactionCreated(true);
        toast.success("Transaksi pertama Anda berhasil dicatat!");
      } else {
        toast.error(result.error || "Gagal membuat transaksi");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  // ============================================
  // NAVIGATION
  // ============================================

  function canProceed(): boolean {
    if (currentStep === 1) return !!createdAccount;
    return true; // Steps 2 & 3 are optional
  }

  async function handleFinish() {
    setLoading(true);
    try {
      const result = await setOnboardingCompleted();
      if (result.success) {
        toast.success("Selamat! Akun Anda siap digunakan 🎉");
        router.push("/dasbor");
      } else {
        toast.error(result.error || "Gagal menyimpan status onboarding");
      }
    } catch (error) {
      toast.error("Gagal menyimpan status onboarding");
    } finally {
      setLoading(false);
    }
  }

  function handleNext() {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  }

  function handleBack() {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }

  function handleSkip() {
    if (currentStep === 3) {
      handleFinish();
    } else {
      handleNext();
    }
  }

  // ============================================
  // RENDER
  // ============================================

  if (checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <Sparkles className="w-12 h-12 mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Selamat Datang di Dompetku</h1>
          <p className="text-muted-foreground mt-2">
            Mari siapkan akun keuangan Anda dalam 3 langkah mudah
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                    currentStep > step.id
                      ? "bg-primary text-primary-foreground"
                      : currentStep === step.id
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.id
                  )}
                </div>
                <span className="text-[10px] mt-1 text-muted-foreground">
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "w-12 h-0.5 mx-2",
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {currentStep === 1 && <CreditCard className="w-5 h-5 text-primary" />}
              {currentStep === 2 && <Bookmark className="w-5 h-5 text-primary" />}
              {currentStep === 3 && <Receipt className="w-5 h-5 text-primary" />}
              {STEPS[currentStep - 1].title}
              {!STEPS[currentStep - 1].required && (
                <span className="text-xs font-normal text-muted-foreground ml-2">
                  (opsional)
                </span>
              )}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Buat akun pertama Anda untuk mulai mencatat keuangan"}
              {currentStep === 2 && "Simpan template untuk transaksi yang sering Anda lakukan"}
              {currentStep === 3 && "Catat transaksi pertama Anda"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* STEP 1: Account Creation */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {createdAccount ? (
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-emerald-700 dark:text-emerald-300">
                          Akun berhasil dibuat!
                        </p>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">
                          {createdAccount.nama} - {formatRupiah(createdAccount.saldoAwal || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={accountForm.handleSubmit(handleCreateAccount)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nama">Nama Akun</Label>
                      <Input
                        id="nama"
                        placeholder="Contoh: BCA Utama"
                        {...accountForm.register("nama")}
                      />
                      {accountForm.formState.errors.nama && (
                        <p className="text-sm text-red-500">
                          {accountForm.formState.errors.nama.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Tipe Akun</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {ACCOUNT_TYPES.map((type) => {
                          const Icon = type.icon;
                          const isSelected = accountForm.watch("tipe") === type.value;
                          return (
                            <button
                              key={type.value}
                              type="button"
                              onClick={() => accountForm.setValue("tipe", type.value as "BANK" | "E_WALLET" | "CASH" | "CREDIT_CARD")}
                              className={cn(
                                "flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left",
                                isSelected
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              )}
                            >
                              <Icon className={cn("w-5 h-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                              <div>
                                <p className="text-sm font-medium">{type.label}</p>
                                <p className="text-[10px] text-muted-foreground">{type.description}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Saldo Awal (Rp)</Label>
                      <NumberInput
                        placeholder="0"
                        value={accountForm.watch("saldoAwal")}
                        onValueChange={(v) => accountForm.setValue("saldoAwal", v.floatValue)}
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Masukkan saldo saat ini di akun tersebut
                      </p>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Membuat akun..." : "Buat Akun"}
                    </Button>
                  </form>
                )}
              </div>
            )}

            {/* STEP 2: Template Creation */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {createdTemplates.length > 0 && (
                  <div className="space-y-2">
                    <Label>Template yang dibuat:</Label>
                    <div className="space-y-2">
                      {createdTemplates.map((tpl) => (
                        <div
                          key={tpl.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-sm">{tpl.nama}</p>
                            <p className="text-xs text-muted-foreground">
                              {tpl.kategori} - {formatRupiah(tpl.nominal)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTemplate(tpl.id)}
                            className="text-red-500 hover:text-red-600"
                          >
                            Hapus
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {createdTemplates.length < 3 && (
                  <form onSubmit={templateForm.handleSubmit(handleCreateTemplate)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Nama Template</Label>
                        <Input
                          placeholder="Contoh: Kopi Pagi"
                          {...templateForm.register("nama")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tipe</Label>
                        <Select
                          value={templateForm.watch("tipeTransaksi")}
                          onValueChange={(v) => templateForm.setValue("tipeTransaksi", v as "MASUK" | "KELUAR")}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="KELUAR">Pengeluaran</SelectItem>
                            <SelectItem value="MASUK">Pemasukan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Deskripsi</Label>
                      <Input
                        placeholder="Contoh: Kopi di Starbucks"
                        {...templateForm.register("deskripsi")}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Kategori</Label>
                        <Select
                          value={templateForm.watch("kategori")}
                          onValueChange={(v) => templateForm.setValue("kategori", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih" />
                          </SelectTrigger>
                          <SelectContent>
                            {PRESET_CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Nominal (Rp)</Label>
                        <NumberInput
                          placeholder="50000"
                          value={templateForm.watch("nominal")}
                          onValueChange={(v) => templateForm.setValue("nominal", v.floatValue ?? 0)}
                        />
                      </div>
                    </div>

                    <Button type="submit" variant="outline" className="w-full" disabled={loading}>
                      {loading ? "Menyimpan..." : "Tambah Template"}
                    </Button>
                  </form>
                )}

                {createdTemplates.length >= 3 && (
                  <p className="text-sm text-muted-foreground text-center">
                    Maksimal 3 template dapat dibuat saat onboarding
                  </p>
                )}
              </div>
            )}

            {/* STEP 3: First Transaction */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {transactionCreated ? (
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-emerald-700 dark:text-emerald-300">
                          Transaksi pertama berhasil dicatat!
                        </p>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">
                          Anda siap menggunakan Dompetku
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={transactionForm.handleSubmit(handleCreateTransaction)} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Tipe Transaksi</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => transactionForm.setValue("tipeTransaksi", "KELUAR")}
                          className={cn(
                            "p-3 rounded-lg border-2 transition-all",
                            transactionForm.watch("tipeTransaksi") === "KELUAR"
                              ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                              : "border-border"
                          )}
                        >
                          <p className="font-medium text-sm">Pengeluaran</p>
                          <p className="text-[10px] text-muted-foreground">Uang keluar</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => transactionForm.setValue("tipeTransaksi", "MASUK")}
                          className={cn(
                            "p-3 rounded-lg border-2 transition-all",
                            transactionForm.watch("tipeTransaksi") === "MASUK"
                              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                              : "border-border"
                          )}
                        >
                          <p className="font-medium text-sm">Pemasukan</p>
                          <p className="text-[10px] text-muted-foreground">Uang masuk</p>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Deskripsi</Label>
                      <Input
                        placeholder="Contoh: Makan siang"
                        {...transactionForm.register("deskripsi")}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Kategori</Label>
                        <Select
                          value={transactionForm.watch("kategori")}
                          onValueChange={(v) => transactionForm.setValue("kategori", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih" />
                          </SelectTrigger>
                          <SelectContent>
                            {PRESET_CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Nominal (Rp)</Label>
                        <NumberInput
                          placeholder="50000"
                          value={transactionForm.watch("nominal")}
                          onValueChange={(v) => transactionForm.setValue("nominal", v.floatValue ?? 0)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Akun</Label>
                      <Select
                        value={transactionForm.watch("akunId")}
                        onValueChange={(v) => transactionForm.setValue("akunId", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih akun" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((acc) => (
                            <SelectItem key={acc.id} value={acc.id}>
                              {acc.nama}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Menyimpan..." : "Catat Transaksi"}
                    </Button>
                  </form>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Kembali
          </Button>

          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button variant="outline" onClick={handleSkip} disabled={loading}>
                {currentStep === 3 ? "Selesai tanpa transaksi" : "Lewati"}
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!canProceed() || loading}
              className="gap-2"
            >
              {currentStep === 3 ? (
                <>
                  Selesai
                  <Sparkles className="w-4 h-4" />
                </>
              ) : (
                <>
                  Lanjut
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
