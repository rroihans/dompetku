"use client";

import { useEffect } from "react";

export function SWRegister() {
    useEffect(() => {
        // Disable SW during local development to avoid caching issues while iterating.
        if (process.env.NODE_ENV !== "production") return;

        if ("serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/sw.js")
                .then((registration) => {
                    console.log("SW Registered:", registration);

                    // Optional: Check for updates
                    registration.addEventListener("updatefound", () => {
                        // Logic to show update toast
                        console.log("New worker found");
                    });
                })
                .catch((error) => {
                    console.error("SW Registration failed:", error);
                });
        }
    }, []);

    return null;
}
