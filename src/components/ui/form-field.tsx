import { cn } from "@/lib/utils"

interface FormErrorProps {
    message?: string | null
    className?: string
}

export function FormError({ message, className }: FormErrorProps) {
    if (!message) return null

    return (
        <p className={cn(
            "text-xs text-destructive mt-1 animate-in fade-in slide-in-from-top-1 duration-200",
            className
        )}>
            {message}
        </p>
    )
}

interface FormFieldProps {
    label: string
    error?: string | null
    required?: boolean
    hint?: string
    children: React.ReactNode
    className?: string
}

export function FormField({
    label,
    error,
    required,
    hint,
    children,
    className
}: FormFieldProps) {
    return (
        <div className={cn("space-y-1.5", className)}>
            <label className="text-sm font-medium flex items-center gap-1">
                {label}
                {required && <span className="text-destructive">*</span>}
            </label>
            {children}
            {hint && !error && (
                <p className="text-xs text-muted-foreground">{hint}</p>
            )}
            <FormError message={error} />
        </div>
    )
}

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string | null
}

export function FormInput({ error, className, ...props }: FormInputProps) {
    return (
        <input
            className={cn(
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                error && "border-destructive focus-visible:ring-destructive",
                className
            )}
            {...props}
        />
    )
}
