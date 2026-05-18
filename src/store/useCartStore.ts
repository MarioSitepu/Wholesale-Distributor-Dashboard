import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";

export interface CartItem {
  productId: string;
  quantity: number;
}

interface CartStore {
  currentBranch: string;
  cartsByBranch: Record<string, CartItem[]>;
  cart: CartItem[];
  setCurrentBranch: (branch: string) => void;
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

const getInitialBranch = () =>
  useAuthStore.getState().user?.branch || "General";

const getBranchCart = (
  cartsByBranch: Record<string, CartItem[]>,
  branch: string,
) => cartsByBranch[branch] || [];

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      currentBranch: getInitialBranch(),
      cartsByBranch: {},
      cart: [],
      setCurrentBranch: (branch: string) =>
        set((state) => ({
          currentBranch: branch,
          cart: getBranchCart(state.cartsByBranch, branch),
        })),
      addItem: (productId: string) =>
        set((state) => {
          const branch = state.currentBranch;
          const currentCart = getBranchCart(state.cartsByBranch, branch);
          const existingItem = state.cart.find(
            (item) => item.productId === productId,
          );
          if (existingItem) {
            const updatedCart = currentCart.map((item) =>
              item.productId === productId
                ? { ...item, quantity: item.quantity + 1 }
                : item,
            );
            return {
              cart: updatedCart,
              cartsByBranch: { ...state.cartsByBranch, [branch]: updatedCart },
            };
          }

          const updatedCart = [...currentCart, { productId, quantity: 1 }];
          return {
            cart: updatedCart,
            cartsByBranch: { ...state.cartsByBranch, [branch]: updatedCart },
          };
        }),
      decreaseQuantity: (productId: string) =>
        set((state) => {
          const branch = state.currentBranch;
          const currentCart = getBranchCart(state.cartsByBranch, branch);
          const existingItem = state.cart.find(
            (item) => item.productId === productId,
          );
          if (!existingItem) return state;

          if (existingItem.quantity === 1) {
            const updatedCart = currentCart.filter(
              (item) => item.productId !== productId,
            );
            return {
              cart: updatedCart,
              cartsByBranch: { ...state.cartsByBranch, [branch]: updatedCart },
            };
          }

          const updatedCart = currentCart.map((item) =>
            item.productId === productId
              ? { ...item, quantity: item.quantity - 1 }
              : item,
          );
          return {
            cart: updatedCart,
            cartsByBranch: { ...state.cartsByBranch, [branch]: updatedCart },
          };
        }),
      removeItem: (productId: string) =>
        set((state) => {
          const branch = state.currentBranch;
          const updatedCart = getBranchCart(state.cartsByBranch, branch).filter(
            (item) => item.productId !== productId,
          );

          return {
            cart: updatedCart,
            cartsByBranch: { ...state.cartsByBranch, [branch]: updatedCart },
          };
        }),
      clearCart: () =>
        set((state) => {
          const branch = state.currentBranch;
          return {
            cart: [],
            cartsByBranch: { ...state.cartsByBranch, [branch]: [] },
          };
        }),
    }),
    {
      name: "wholesale_cart_session",
      version: 1,
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : noopStorage,
      ),
      partialize: (state) => ({
        cartsByBranch: state.cartsByBranch,
      }),
      migrate: () => ({
        currentBranch: getInitialBranch(),
        cartsByBranch: {},
        cart: [],
      }),
    },
  ),
);
