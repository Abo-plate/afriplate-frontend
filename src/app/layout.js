import "./globals.css";
import "./theme.css";
import {ThemeProvider} from "./lib/ThemeProvider";
import {THEME_BOOTSTRAP} from "./lib/themeBootstrap";
import { SessionProvider } from "./lib/SessionProvider";
import CartEntry, {CartProvider} from "../components/CartEntry";
import MobileBottomNav from "../../components/MobileBottomNav";

export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", interactiveWidget: "resizes-content" };

export const metadata = {
  title: "AfriPlate",
  description: "Campus marketplace for Nigerian students to buy, sell, and offer services.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{__html: THEME_BOOTSTRAP}}/></head>
      <body>
        <ThemeProvider><SessionProvider><CartProvider>
          <div className="app-content">{children}</div>
          <div className="mobile-cart-entry"><CartEntry /></div>
          <MobileBottomNav />
        </CartProvider></SessionProvider></ThemeProvider>
      </body>
    </html>
  );
}