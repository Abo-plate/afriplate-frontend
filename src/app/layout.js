import "./globals.css";
import { SessionProvider } from "./lib/SessionProvider";
import MobileBottomNav from "../../components/MobileBottomNav";

export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", interactiveWidget: "resizes-content" };

export const metadata = {
  title: "AfriPlate",
  description: "Campus marketplace for Nigerian students to buy, sell, and offer services.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <div className="app-content">{children}</div>
          <MobileBottomNav />
        </SessionProvider>
      </body>
    </html>
  );
}