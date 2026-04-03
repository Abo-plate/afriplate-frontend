import "./globals.css";
import MobileBottomNav from "@/components/MobileBottomNav";

export const metadata = {
  title: "AfriPlate",
  description: "Campus marketplace for Nigerian students to buy, sell, and offer services.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <MobileBottomNav />
      </body>
    </html>
  );
}