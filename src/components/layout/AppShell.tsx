'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { ProUpgradeButton } from '@/components/billing/ProUpgradeButton';
import { useShopEnabled } from '@/hooks/useShopEnabled';
import { useCartStore } from '@/stores/cartStore';
import { CartDrawer } from '@/components/shop/CartDrawer';
import { ShoppingBag } from 'lucide-react';
import { logout } from '@/lib/logout';

export function AppShell({ children }: { children: React.ReactNode }) {
 const user = useAuthStore((s) => s.user);
 const shopEnabled = useShopEnabled();
 const cartItems = useCartStore((s) => s.items);
 const toggleCartDrawer = useCartStore((s) => s.toggleDrawer);
 const router = useRouter();
 const [dropdownOpen, setDropdownOpen] = useState(false);
 const [scrolled, setScrolled] = useState(false);
 const dropdownRef = useRef<HTMLDivElement>(null);
 const pathname = usePathname();

 const isAuthenticated = !!user;

 useEffect(() => {
 function handleClickOutside(e: MouseEvent) {
 if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
 setDropdownOpen(false);
 }
 }
 document.addEventListener('mousedown', handleClickOutside);
 return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);

 useEffect(() => {
 function handleScroll() {
 setScrolled(window.scrollY > 20);
 }
 window.addEventListener('scroll', handleScroll, { passive: true });
 return () => window.removeEventListener('scroll', handleScroll);
 }, []);

 function isActive(path: string) {
 return pathname.startsWith(path);
 }

 return (
 <div className="min-h-screen relative">
 <nav
 aria-label="Main navigation"
 className={`sticky top-0 z-40 px-6 lg:px-12 py-2 flex items-center justify-between transition-colors duration-150 border-b ${scrolled
 ? 'bg-[#fdfaf7] border-[#e8e1da] shadow-[0_1px_2px_rgba(45,42,38,0.08)]'
 : 'bg-[#fdfaf7] border-transparent'
 }`}
 >
 <Link href="/dashboard" className="flex items-center gap-2.5">
 <Image
 src="/logo.png"
 alt="QuiltCorgi Logo"
 width={52}
 height={52}
 className="object-contain w-[52px] h-[52px]"
 />
 <span
 className="text-[28px] font-bold text-[#2d2a26] tracking-tight"
 style={{ fontFamily: 'var(--font-display)' }}
 >
 QuiltCorgi
 </span>
 </Link>

 <div className="hidden lg:flex items-center gap-6">
 <Link
 href="/dashboard"
 className={`font-medium transition-colors ${isActive('/dashboard') ? 'text-[#2d2a26]' : 'text-[#6b655e] hover:text-[#ff8d49]'
 }`}
 >
 Dashboard
 </Link>
 <Link
 href="/socialthreads"
 className={`font-medium transition-colors ${isActive('/socialthreads') ? 'text-[#2d2a26]' : 'text-[#6b655e] hover:text-[#ff8d49]'
 }`}
 >
 Social Threads
 </Link>
 {shopEnabled && (
 <Link
 href="/shop"
 className={`font-medium transition-colors ${isActive('/shop') ? 'text-[#2d2a26]' : 'text-[#6b655e] hover:text-[#ff8d49]'
 }`}
 >
 Shop
 </Link>
 )}
 {isAuthenticated && (
 <Link
 href="/profile"
 className={`font-medium transition-colors ${isActive('/profile') ? 'text-[#2d2a26]' : 'text-[#6b655e] hover:text-[#ff8d49]'
 }`}
 >
 Profile
 </Link>
 )}
 </div>

 <div className="flex items-center gap-3" ref={dropdownRef}>
 {isAuthenticated ? (
 <>
 {user?.role === 'free' && (
 <ProUpgradeButton variant="nav" />
 )}

 {shopEnabled && cartItems.length > 0 && (
 <button
 type="button"
 onClick={toggleCartDrawer}
 className="relative p-1.5 text-[#6b655e] hover:text-[#2d2a26] transition-colors"
 aria-label="Shopping cart"
 >
 <ShoppingBag size={20} />
 </button>
 )}

 <div className="relative">
 <NotificationBell />
 <NotificationDropdown />
 </div>

 <button
 type="button"
 onClick={() => setDropdownOpen((prev) => !prev)}
 aria-label="User menu"
 aria-expanded={dropdownOpen}
 aria-haspopup="true"
 className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-[#ff8d49]/30 transition-colors duration-150"
 >
 {user?.image ? (
 <Image
 src={user.image}
 alt={user.name}
 width={32}
 height={32}
 className="h-8 w-8 rounded-full object-cover ring-2 ring-transparent group-hover:ring-[#ff8d49] transition-colors duration-150"
 />
 ) : (
 <div className="h-8 w-8 rounded-lg bg-[#ff8d49]/20 flex items-center justify-center overflow-hidden ring-2 ring-transparent hover:ring-[#ff8d49] transition-colors duration-150">
 <Image
 src="/mascots&avatars/corgi1.png"
 alt="Default Avatar"
 width={32}
 height={32}
 className="object-cover scale-110 translate-y-1"
 />
 </div>
 )}
 </button>

 {dropdownOpen && (
 <div className="absolute top-12 right-4 z-50 w-48 rounded-lg bg-[#fdfaf7] border border-[#e8e1da] py-1.5">
 <div className="px-4 py-2 border-b border-[#e8e1da]">
 <p className="text-sm font-medium text-[#2d2a26] truncate">{user?.name}</p>
 <p className="text-xs text-[#6b655e] truncate">{user?.email}</p>
 </div>
 <Link
 href="/socialthreads"
 className="block px-4 py-2 text-sm text-[#6b655e] hover:bg-[#f5f2ef] transition-colors"
 onClick={() => setDropdownOpen(false)}
 >
 Profile
 </Link>
 <button
 type="button"
 onClick={async () => {
 await logout();
 router.push('/');
 router.refresh();
 }}
 className="w-full text-left px-4 py-2 text-sm text-[#ffc7c7] hover:bg-[#f5f2ef] transition-colors"
 >
 Sign Out
 </button>
 </div>
 )}
 </>
 ) : (
 <div className="flex items-center gap-3">
 <Link
 href="/auth/signin"
 className="text-label-lg text-[#6b655e] hover:text-[#2d2a26] transition-colors"
 >
 Sign In
 </Link>
 <Link
 href="/auth/signup"
 className="bg-[#ff8d49] text-[#2d2a26] px-5 py-2 rounded-lg font-semibold hover:opacity-90 transition-colors duration-150"
 >
 Start Designing
 </Link>
 </div>
 )}
 </div>
 </nav>

 <main id="main-content" className="relative z-10 p-6 max-w-7xl mx-auto">
 {children}
 </main>

 <CartDrawer />
 </div>
 );
}
