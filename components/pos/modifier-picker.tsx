"use client";

import { useState, useCallback } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { Plus } from "lucide-react";

export interface ModifierGroup {
    id: string;
    name: string;
    required: boolean;
    multiple: boolean;
    maxSelect: number | null;
    options: ModifierOption[];
}

export interface ModifierOption {
    id: string;
    name: string;
    price: number;
}

interface SelectedModifier {
    groupName: string;
    optionName: string;
    price: number;
}

interface ModifierPickerProps {
    open: boolean;
    onClose: () => void;
    product: {
        id: string;
        name: string;
        price: number;
        variantId: string | null;
        stock: number;
        images: string[];
        category?: { name: string; icon: string | null };
        modifierGroups: ModifierGroup[];
    } | null;
    onConfirm: (product: any, modifiers: SelectedModifier[]) => void;
}

export function ModifierPicker({ open, onClose, product, onConfirm }: ModifierPickerProps) {
    // Track selections per group: groupId → set of optionIds
    const [selections, setSelections] = useState<Record<string, Set<string>>>({});

    const resetSelections = useCallback(() => setSelections({}), []);

    if (!product) return null;

    const groups = product.modifierGroups;

    const toggleOption = (group: ModifierGroup, option: ModifierOption) => {
        setSelections((prev) => {
            const current = new Set(prev[group.id] || []);
            if (group.multiple) {
                // Toggle
                if (current.has(option.id)) {
                    current.delete(option.id);
                } else {
                    // Check max
                    if (group.maxSelect && current.size >= group.maxSelect) return prev;
                    current.add(option.id);
                }
            } else {
                // Radio: single select
                current.clear();
                current.add(option.id);
            }
            return { ...prev, [group.id]: current };
        });
    };

    const isSelected = (groupId: string, optionId: string) =>
        selections[groupId]?.has(optionId) ?? false;

    // Validate required groups
    const allRequiredFilled = groups
        .filter((g) => g.required)
        .every((g) => (selections[g.id]?.size ?? 0) > 0);

    // Calculate modifier price total
    const modifierTotal = groups.reduce((sum, group) => {
        const selected = selections[group.id];
        if (!selected) return sum;
        return sum + group.options
            .filter((o) => selected.has(o.id))
            .reduce((s, o) => s + o.price, 0);
    }, 0);

    const handleConfirm = () => {
        const mods: SelectedModifier[] = [];
        for (const group of groups) {
            const selected = selections[group.id];
            if (!selected) continue;
            for (const opt of group.options) {
                if (selected.has(opt.id)) {
                    mods.push({
                        groupName: group.name,
                        optionName: opt.name,
                        price: opt.price,
                    });
                }
            }
        }
        onConfirm(product, mods);
        resetSelections();
    };

    const handleClose = () => {
        resetSelections();
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span className="text-xl">{product.category?.icon || "📦"}</span>
                        {product.name}
                    </DialogTitle>
                    <DialogDescription>
                        Harga dasar: {formatCurrency(product.price)}
                        {modifierTotal > 0 && (
                            <span className="text-primary font-medium">
                                {" "}+ {formatCurrency(modifierTotal)}
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {groups.map((group) => (
                        <div key={group.id} className="space-y-2">
                            <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-sm">{group.name}</h4>
                                {group.required && (
                                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                        Wajib
                                    </Badge>
                                )}
                                {group.multiple && group.maxSelect && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                        Maks. {group.maxSelect}
                                    </Badge>
                                )}
                            </div>

                            {group.multiple ? (
                                // Checkbox mode
                                <div className="space-y-1.5">
                                    {group.options.map((option) => (
                                        <label
                                            key={option.id}
                                            className="flex items-center gap-3 p-2.5 rounded-lg border bg-white hover:bg-slate-50 cursor-pointer transition-colors"
                                        >
                                            <Checkbox
                                                checked={isSelected(group.id, option.id)}
                                                onCheckedChange={() => toggleOption(group, option)}
                                                disabled={
                                                    !isSelected(group.id, option.id) &&
                                                    !!group.maxSelect &&
                                                    (selections[group.id]?.size ?? 0) >= group.maxSelect
                                                }
                                            />
                                            <span className="flex-1 text-sm">{option.name}</span>
                                            {option.price > 0 && (
                                                <span className="text-xs text-muted-foreground">
                                                    +{formatCurrency(option.price)}
                                                </span>
                                            )}
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                // Radio mode (single select)
                                <RadioGroup
                                    value={Array.from(selections[group.id] || [])[0] || ""}
                                    onValueChange={(val) => {
                                        const opt = group.options.find((o) => o.id === val);
                                        if (opt) toggleOption(group, opt);
                                    }}
                                >
                                    <div className="space-y-1.5">
                                        {group.options.map((option) => (
                                            <label
                                                key={option.id}
                                                className="flex items-center gap-3 p-2.5 rounded-lg border bg-white hover:bg-slate-50 cursor-pointer transition-colors"
                                            >
                                                <RadioGroupItem value={option.id} />
                                                <span className="flex-1 text-sm">{option.name}</span>
                                                {option.price > 0 && (
                                                    <span className="text-xs text-muted-foreground">
                                                        +{formatCurrency(option.price)}
                                                    </span>
                                                )}
                                            </label>
                                        ))}
                                    </div>
                                </RadioGroup>
                            )}

                            <Separator />
                        </div>
                    ))}
                </div>

                <DialogFooter className="flex gap-2 sm:gap-2">
                    <Button variant="outline" onClick={handleClose}>
                        Batal
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!allRequiredFilled}
                        className="gap-1.5"
                    >
                        <Plus className="h-4 w-4" />
                        Tambah — {formatCurrency(product.price + modifierTotal)}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
