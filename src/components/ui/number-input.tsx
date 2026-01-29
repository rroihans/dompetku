"use client"

import * as React from "react"
import { NumericFormat, type NumericFormatProps } from "react-number-format"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface NumberInputProps extends Omit<NumericFormatProps, "customInput"> {
    className?: string;
    onValueChange?: (values: { floatValue: number | undefined; value: string; formattedValue: string }) => void;
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
    ({ className, ...props }, ref) => {
        return (
            <NumericFormat
                {...props}
                getInputRef={ref}
                customInput={Input}
                thousandSeparator="."
                decimalSeparator=","
                allowNegative={false}
                className={cn("", className)} // Input component handles base styling
            />
        )
    }
)
NumberInput.displayName = "NumberInput"
