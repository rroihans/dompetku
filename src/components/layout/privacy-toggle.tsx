"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"

const PRIVACY_KEY = "dompetku_privacy"

export function PrivacyToggle() {
    const [isPrivate, setIsPrivate] = useState(false)

    useEffect(() => {
        // Load dari localStorage
        const saved = localStorage.getItem(PRIVACY_KEY) === "true"
        setIsPrivate(saved)
        if (saved) {
            document.body.classList.add("privacy-mode")
        }
    }, [])

    const toggle = () => {
        const newValue = !isPrivate
        setIsPrivate(newValue)
        localStorage.setItem(PRIVACY_KEY, String(newValue))

        if (newValue) {
            document.body.classList.add("privacy-mode")
        } else {
            document.body.classList.remove("privacy-mode")
        }
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="h-9 w-9"
            title={isPrivate ? "Tampilkan Saldo" : "Sembunyikan Saldo"}
        >
            {isPrivate ? (
                <EyeOff className="h-4 w-4" />
            ) : (
                <Eye className="h-4 w-4" />
            )}
        </Button>
    )
}
