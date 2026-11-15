"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "../src/components/Marketplace";
import { useSession } from "../src/app/lib/SessionProvider";
export default function MobileBottomNav() {
  const pathname = usePathname();
  const { isAuthed, logout } = useSession();
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) return null;
  const items = [
    { label: "Home", icon: "home", path: "/" },
    { label: "Products", icon: "bag", path: "/products" },
    { label: "Services", icon: "book", path: "/services" },
    { label: "Jobs", icon: "work", path: "/jobs" },
    ...(isAuthed ? [
      { label: "Messages", icon: "chat", path: "/messages" },
      { label: "Profile", icon: "user", path: "/dashboard#settings" },
    ] : [
      { label: "Login", icon: "user", path: "/login" },
      { label: "Sign up", icon: "user", path: "/register" },
    ]),
  ];
  return (
    <nav className="mobile-nav" aria-label="Quick navigation">
      {items.map((item) => (
        <Link
          key={item.path}
          href={item.path}
          aria-current={pathname === item.path ? "page" : undefined}
          className={`nav-item ${pathname === item.path ? "active" : ""}`}
        >
          <Icon name={item.icon} />
          <span>{item.label}</span>
        </Link>
      ))}
      {isAuthed && <button type="button" className="nav-item" onClick={logout}><Icon name="arrow" /><span>Log out</span></button>}
    </nav>
  );
}
