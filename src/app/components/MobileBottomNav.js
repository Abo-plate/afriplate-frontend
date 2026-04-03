'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, Package, Briefcase, MessageCircle, User } from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Products', icon: Package, path: '/products' },
    { label: 'Jobs', icon: Briefcase, path: '/jobs' },
    { label: 'Messages', icon: MessageCircle, path: '/messages' },
    { label: 'Profile', icon: User, path: '/dashboard' },
  ];

  return (
    <div className="mobile-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.path;

        return (
          <button
            key={item.label}
            onClick={() => router.push(item.path)}
            className={`nav-item ${active ? 'active' : ''}`}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}