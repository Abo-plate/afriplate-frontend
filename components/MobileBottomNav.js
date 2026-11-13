"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "../src/components/Marketplace";
export default function MobileBottomNav() {
  const pathname = usePathname();
  const items = [
    { label: "Home", icon: "home", path: "/" },
    { label: "Products", icon: "bag", path: "/products" },
    { label: "Services", icon: "book", path: "/services" },
    { label: "Jobs", icon: "work", path: "/jobs" },
    { label: "Messages", icon: "chat", path: "/messages" },
    { label: "Profile", icon: "user", path: "/dashboard" },
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
    </nav>
  );
}
