"use client";

import { CartProvider } from "@/context/CartContext";
import Header from "@/components/Header";

// Single place to mount client-only providers + header
export default function ClientProviders({ children }) {
  return (
    <CartProvider>
      <Header />
      {children}
    </CartProvider>
  );
}
