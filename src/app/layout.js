// Server Component — keep this file WITHOUT "use client"
import "./globals.css";
import ClientProviders from "@/components/ClientProviders";

export const metadata = {
  title: "AvaSquishi",
  description: "AvaSquishi storefront",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Header lives inside ClientProviders (via CartProvider) */}
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
