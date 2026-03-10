// Server Component — keep this file WITHOUT "use client"
import "./globals.css";
import ClientProviders from "@/components/ClientProviders";
import Footer from "@/components/Footer";

export const metadata = {
  title: {
    default: "AvaSquishi",
    template: "%s | AvaSquishi",
  },
  description: "Squishy toys for kids, by a kid. Shop AvaSquishi for cute, soft, squeezable toys.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Header lives inside ClientProviders (via CartProvider) */}
        <ClientProviders>{children}</ClientProviders>
        <Footer />
      </body>
    </html>
  );
}
