"use client";

import { useRecurringTriggers } from "@/lib/hooks/use-recurring-triggers";

/**
 * Client component wrapper for useRecurringTriggers hook
 * Since layout.tsx is a server component, hooks cannot be called directly there.
 * This component wraps the hook to be rendered as a client component.
 */
export function RecurringTriggerProvider() {
    useRecurringTriggers();
    return null;
}
