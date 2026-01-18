"use client"

import { useState } from "react"
import { Combinator, Operator, RuleGroup, Rule } from "@/lib/query-builder"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Plus, X } from "lucide-react"

interface Props {
    value: RuleGroup
    onChange: (val: RuleGroup) => void
}

export function FilterLogicBuilder({ value, onChange }: Props) {
    // Recursive component needed?
    // Let's implement a simple Group renderer.

    const updateCombinator = (comb: Combinator) => {
        onChange({ ...value, combinator: comb });
    }

    const addRule = () => {
        onChange({
            ...value,
            rules: [...value.rules, { field: 'nominal', operator: 'gt', value: 0 }]
        });
    }

    const addGroup = () => {
        onChange({
            ...value,
            rules: [...value.rules, { combinator: 'AND', rules: [] }]
        });
    }

    const removeRule = (index: number) => {
        const newRules = [...value.rules];
        newRules.splice(index, 1);
        onChange({ ...value, rules: newRules });
    }

    const updateRule = (index: number, newRule: Rule | RuleGroup) => {
        const newRules = [...value.rules];
        newRules[index] = newRule;
        onChange({ ...value, rules: newRules });
    }

    return (
        <div className="border p-4 rounded-lg space-y-4 bg-muted/10">
            <div className="flex items-center gap-2">
                <Select value={value.combinator} onValueChange={(v) => updateCombinator(v as Combinator)}>
                    <SelectTrigger className="w-[80px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="AND">AND</SelectItem>
                        <SelectItem value="OR">OR</SelectItem>
                    </SelectContent>
                </Select>
                <div className="flex-1 border-t border-dashed"></div>
                <Button variant="ghost" size="sm" onClick={addRule}><Plus className="w-3 h-3 mr-1" /> Rule</Button>
                <Button variant="ghost" size="sm" onClick={addGroup}><Plus className="w-3 h-3 mr-1" /> Group</Button>
            </div>

            <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                {value.rules.map((rule, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                        {'combinator' in rule ? (
                            <div className="flex-1">
                                <FilterLogicBuilder value={rule as RuleGroup} onChange={(v) => updateRule(idx, v)} />
                            </div>
                        ) : (
                            <div className="flex-1 flex gap-2 items-center">
                                <Select 
                                    value={(rule as Rule).field} 
                                    onValueChange={(v) => updateRule(idx, { ...(rule as Rule), field: v })}
                                >
                                    <SelectTrigger className="w-[150px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="nominal">Amount</SelectItem>
                                        <SelectItem value="kategori">Category</SelectItem>
                                        <SelectItem value="deskripsi">Description</SelectItem>
                                        <SelectItem value="tipe">Type</SelectItem> // Need mapper for Expense/Income
                                    </SelectContent>
                                </Select>

                                <Select 
                                    value={(rule as Rule).operator} 
                                    onValueChange={(v) => updateRule(idx, { ...(rule as Rule), operator: v as Operator })}
                                >
                                    <SelectTrigger className="w-[120px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="equals">Equals</SelectItem>
                                        <SelectItem value="gt">Greater Than</SelectItem>
                                        <SelectItem value="lt">Less Than</SelectItem>
                                        <SelectItem value="contains">Contains</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Input 
                                    className="flex-1" 
                                    value={(rule as Rule).value} 
                                    onChange={(e) => updateRule(idx, { ...(rule as Rule), value: e.target.value })}
                                />
                            </div>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => removeRule(idx)}>
                            <X className="w-4 h-4 text-muted-foreground" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    )
}
