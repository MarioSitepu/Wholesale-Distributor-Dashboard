import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";

export interface CartItem {
  productId: string;
  quantity: number;
}

interface CartStore {
  cart: CartItem[];
  addItem: (productId: string) => void;
  decreaseQuantity: (productId: string) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
}

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      cart: [],
      addItem: (productId: string) =>
        set((state) => {
          const existingItem = state.cart.find((item) => item.productId === productId);
          if (existingItem) {
            return {
              cart: state.cart.map((item) =>
                item.productId === productId
                  ? { ...item, quantity: item.quantity + 1 }
                  : item,
              ),
            };
          }

          return {
            cart: [...state.cart, { productId, quantity: 1 }],
          };
        }),
      decreaseQuantity: (productId: string) =>
        set((state) => {
          const existingItem = state.cart.find((item) => item.productId === productId);
          if (!existingItem) return state;

          if (existingItem.quantity === 1) {
            return {
              cart: state.cart.filter((item) => item.productId !== productId),
            };
          }

          return {
            cart: state.cart.map((item) =>
              item.productId === productId
                ? { ...item, quantity: item.quantity - 1 }
                : item,
            ),
          };
        }),
      removeItem: (productId: string) =>
        set((state) => ({
          cart: state.cart.filter((item) => item.productId !== productId),
        })),
      clearCart: () => set({ cart: [] }),
    }),
    {
      name: "wholesale_cart_session",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : noopStorage,
      ),
    },
  ),
);