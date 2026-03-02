import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItemModifier {
    groupName: string;
    optionName: string;
    price: number;
}

export interface CartItem {
    id: string;       // unique cart-line key (itemId or itemId::modifierHash)
    itemId: string;   // actual product ID
    variantId: string | null;
    name: string;
    price: number;    // base price of the item (without modifiers)
    quantity: number;
    stock: number;
    images: string[];
    category?: {
        name: string;
        icon: string | null;
    };
    modifiers?: CartItemModifier[];
    notes?: string;
}

interface CartStore {
    items: CartItem[];
    addItem: (data: CartItem) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    updateNotes: (id: string, notes: string) => void;
    removeAll: () => void;
}

/**
 * Generate a unique cart line ID from item ID + selected modifiers.
 * Two items with the same product but different modifiers become separate lines.
 */
function cartLineId(itemId: string, modifiers?: CartItemModifier[]): string {
    if (!modifiers || modifiers.length === 0) return itemId;
    const key = modifiers
        .map((m) => `${m.groupName}:${m.optionName}`)
        .sort()
        .join("|");
    return `${itemId}::${key}`;
}

const useCart = create(
    persist<CartStore>(
        (set, get) => ({
            items: [],
            addItem: (data: CartItem) => {
                const lineId = cartLineId(data.itemId, data.modifiers);
                const currentItems = get().items;
                const existingItem = currentItems.find((item) => item.id === lineId);

                if (existingItem) {
                    // If same item + same modifiers exists, increment quantity
                    set({
                        items: currentItems.map((item) =>
                            item.id === lineId
                                ? { ...item, quantity: item.quantity + 1 }
                                : item
                        )
                    });
                } else {
                    set({ items: [...currentItems, { ...data, id: lineId, quantity: 1 }] });
                }
            },
            removeItem: (id: string) => {
                set({ items: [...get().items.filter((item) => item.id !== id)] });
            },
            updateQuantity: (id: string, quantity: number) => {
                if (quantity < 1) return;
                set({
                    items: get().items.map((item) =>
                        item.id === id ? { ...item, quantity } : item
                    )
                })
            },
            updateNotes: (id: string, notes: string) => {
                set({
                    items: get().items.map((item) =>
                        item.id === id ? { ...item, notes } : item
                    )
                });
            },
            removeAll: () => set({ items: [] }),
        }),
        {
            name: "cart-storage",
            storage: createJSONStorage(() => localStorage),
        }
    )
);

export default useCart;
