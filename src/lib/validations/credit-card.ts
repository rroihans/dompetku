import { z } from "zod"

export const CreditCardSettingsSchema = z.object({
    billingDate: z.coerce.number().min(1, "Billing date harus 1-31").max(31, "Billing date harus 1-31"),
    dueDate: z.coerce.number().min(1, "Due date harus 1-31").max(31, "Due date harus 1-31"),
    minPaymentPercent: z.coerce.number().min(0, "Minimum payment % harus 0-100").max(100, "Minimum payment % harus 0-100"),
    minPaymentFixed: z.coerce.number().min(0, "Minimum payment fixed tidak boleh negatif"),
    minInstallmentAmount: z.coerce.number().min(0, "Minimum installment amount tidak boleh negatif"),
    limitKredit: z.coerce.number().min(0, "Limit kredit tidak boleh negatif").optional(),
    useDecimalFormat: z.boolean().default(false),
    isSyariah: z.boolean().default(false),
})

export type CreditCardSettingsFormData = z.infer<typeof CreditCardSettingsSchema>
