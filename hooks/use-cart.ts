import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
export interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    stock: number;
    images: string[];
    category?: {
        name: string;
        icon: string | null;
    };
}

interface CartStore {
    items: CartItem[];
    addItem: (data: CartItem) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    removeAll: () => void;
}

const useCart = create(
    persist<CartStore>(
        (set, get) => ({
            items: [],
            addItem: (data: CartItem) => {
                const currentItems = get().items;
                const existingItem = currentItems.find((item) => item.id === data.id);

                if (existingItem) {
                    // If item exists, inc quantity
                    set({
                        items: currentItems.map((item) =>
                            item.id === data.id
                                ? { ...item, quantity: item.quantity + 1 }
                                : item
                        )
                    });
                } else {
                    set({ items: [...get().items, { ...data, quantity: 1 }] });
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
            removeAll: () => set({ items: [] }),
        }),
        {
            name: "cart-storage",
            storage: createJSONStorage(() => localStorage),
        }
    )
);

export default useCart;
