/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  ShoppingBag, 
  Heart, 
  Sun, 
  Moon, 
  User as UserIcon, 
  Wifi, 
  WifiOff, 
  Bell, 
  Sparkles,
  ChevronDown,
  Menu,
  X
} from "lucide-react";
import { User, Notification } from "../types";

interface NavbarProps {
  isSwahili: boolean;
  setIsSwahili: (val: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  isOnline: boolean;
  setIsOnline: (val: boolean) => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  allUsers: User[];
  cartCount: number;
  wishlistCount: number;
  notifications: Notification[];
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenAiHub: (agentType?: string) => void;
  setViewMode: (view: "marketplace" | "seller-dashboard" | "admin-panel" | "buyer-dashboard" | "my-account") => void;
  currentView: "marketplace" | "seller-dashboard" | "admin-panel" | "buyer-dashboard" | "my-account";
}

export default function Navbar({
  isSwahili,
  setIsSwahili,
  isDarkMode,
  setIsDarkMode,
  isOnline,
  setIsOnline,
  currentUser,
  setCurrentUser,
  allUsers,
  cartCount,
  wishlistCount,
  notifications,
  onOpenCart,
  onOpenWishlist,
  onOpenAiHub,
  setViewMode,
  currentView
}: NavbarProps) {
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const unreadNotifications = notifications.filter(n => !n.read);

  const handleRoleChange = (userId: string) => {
    const selected = allUsers.find(u => u.id === userId) || null;
    setCurrentUser(selected);
    setShowRoleSelector(false);

    // Auto-navigate views based on role selection to make things super intuitive
    if (selected?.role === "seller") {
      setViewMode("seller-dashboard");
    } else if (selected?.role === "admin") {
      setViewMode("admin-panel");
    } else {
      setViewMode("marketplace");
    }
  };

  const handleLogout = async () => {
    if (confirm(isSwahili ? "Je, una uhakika unataka kuondoka kwenye akaunti yako?" : "Are you sure you want to log out of your account securely?")) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUser?.id })
        });
      } catch (e) {
        console.error("API logout error", e);
      }
      setCurrentUser(null);
      setViewMode("marketplace");
      setShowRoleSelector(false);
      setShowMobileMenu(false);
    }
  };

  return (
    <nav className={`sticky top-0 z-50 transition-colors duration-300 shadow-md ${
      isDarkMode ? "bg-slate-900 border-b border-yellow-500/30 text-white" : "bg-white border-b border-yellow-500/20 text-slate-800"
    }`}>
      {/* Network Alert Banner when simulated Offline */}
      {!isOnline && (
        <div className="bg-yellow-600 text-slate-950 text-center py-1 px-4 text-xs font-bold flex items-center justify-center gap-1.5 animate-pulse">
          <WifiOff className="w-3.5 h-3.5" />
          <span>
            {isSwahili 
              ? "Uko Nje ya Mtandao! Unaweza kuagiza na miamala itahifadhiwa kwenye kifaa chako hadi utakapounganisha."
              : "Simulated Offline Mode! You can draft orders and they will sync securely once you go back online."}
          </span>
          <button 
            onClick={() => setIsOnline(true)} 
            className="underline ml-2 hover:text-slate-900 font-extrabold cursor-pointer"
          >
            {isSwahili ? "Washa Mtandao" : "Go Online"}
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Platform Title & Top-Left Mobile Hamburger Trigger */}
          <div className="flex items-center space-x-2">
            {/* Hamburger Menu (Three Minus Signs) */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-yellow-500 hover:bg-yellow-500/5 transition-all md:hidden cursor-pointer mr-1"
              aria-label="Toggle Menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Platform Title */}
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setViewMode("marketplace")}>
              <span className="text-xl sm:text-2xl animate-bounce">🇹🇿</span>
              <div>
                <h1 className="text-xs sm:text-base md:text-lg font-bold font-display-serif tracking-wide text-yellow-500 dark:text-yellow-400 line-clamp-1">
                  SOKO LA VITENGE MTANDAONI
                </h1>
                <p className="text-[8px] sm:text-[9px] text-slate-400 font-mono hidden sm:block">
                  {isSwahili ? "SOKO LA KIASILI LA AFRIKA MASHARIKI" : "EAST AFRICAN AUTHENTIC FABRIC MARKET"}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Tab Selectors */}
          <div className="hidden md:flex space-x-1">
            <button
              onClick={() => setViewMode("marketplace")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                currentView === "marketplace"
                  ? "bg-yellow-500/15 text-yellow-500 font-bold border-b-2 border-yellow-500"
                  : "hover:bg-yellow-500/5 text-slate-400 hover:text-yellow-500"
              }`}
            >
              {isSwahili ? "Sokoni (Nunua)" : "Marketplace (Buy)"}
            </button>

            {currentUser?.role === "buyer" && (
              <button
                onClick={() => setViewMode("buyer-dashboard")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  currentView === "buyer-dashboard"
                    ? "bg-yellow-500/15 text-yellow-500 font-bold border-b-2 border-yellow-500"
                    : "hover:bg-yellow-500/5 text-slate-400 hover:text-yellow-500"
                }`}
              >
                {isSwahili ? "Dashibodi ya Mnunuzi" : "Buyer Dashboard"}
              </button>
            )}

            {currentUser && (
              <button
                onClick={() => setViewMode("my-account")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  currentView === "my-account"
                    ? "bg-yellow-500/15 text-yellow-500 font-bold border-b-2 border-yellow-500"
                    : "hover:bg-yellow-500/5 text-slate-400 hover:text-yellow-500"
                }`}
              >
                {isSwahili ? "Akaunti Yangu" : "My Account"}
              </button>
            )}

            {currentUser?.role === "seller" && (
              <button
                onClick={() => setViewMode("seller-dashboard")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  currentView === "seller-dashboard"
                    ? "bg-yellow-500/15 text-yellow-500 font-bold border-b-2 border-yellow-500"
                    : "hover:bg-yellow-500/5 text-slate-400 hover:text-yellow-500"
                }`}
              >
                {isSwahili ? "Dashibodi ya Muuzaji" : "Seller Dashboard"}
              </button>
            )}

            {currentUser?.role === "admin" && (
              <button
                onClick={() => setViewMode("admin-panel")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  currentView === "admin-panel"
                    ? "bg-yellow-500/15 text-yellow-500 font-bold border-b-2 border-yellow-500"
                    : "hover:bg-yellow-500/5 text-slate-400 hover:text-yellow-500"
                }`}
              >
                {isSwahili ? "Udhibiti (Admin)" : "Admin Control"}
              </button>
            )}
          </div>

          {/* Utility Tools Grid */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            
            {/* AI Assistant Instant Trigger */}
            <button
              id="ai-quick-trigger"
              onClick={() => onOpenAiHub()}
              className="flex items-center gap-1.5 bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-950 hover:to-blue-850 text-white text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg font-semibold transition-all shadow-md hover:scale-105 border border-yellow-500/30 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span className="hidden sm:inline">{isSwahili ? "Msaidizi wa AI" : "AI Assistant"}</span>
            </button>

            {/* Offline/Online Simulated Toggle */}
            <button
              onClick={() => setIsOnline(!isOnline)}
              title={isOnline ? "Simulate Offline Mode" : "Simulate Online Mode"}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                isOnline ? "text-emerald-500 hover:bg-emerald-500/10" : "text-yellow-500 bg-yellow-500/10 animate-pulse"
              }`}
            >
              {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            </button>

            {/* Bilingual Translation Toggle */}
            <button
              onClick={() => setIsSwahili(!isSwahili)}
              className="text-xs font-bold border border-yellow-500/30 px-2 py-1 rounded-md hover:bg-yellow-500/10 transition-colors uppercase cursor-pointer"
              title="Change Language / Badili Lugha"
            >
              {isSwahili ? "ENG" : "SWA"}
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-yellow-500 hover:bg-yellow-500/5 transition-all cursor-pointer"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Wishlist Button */}
            <button
              onClick={onOpenWishlist}
              className="relative p-1.5 text-slate-400 hover:text-rose-500 transition-all cursor-pointer"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              id="cart-btn"
              onClick={onOpenCart}
              className="relative p-1.5 text-slate-400 hover:text-yellow-500 transition-all cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Alert Notifications Center */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                className="relative p-1.5 text-slate-400 hover:text-yellow-500 transition-all cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                    {unreadNotifications.length}
                  </span>
                )}
              </button>

              {/* Notification dropdown box */}
              {showNotificationDropdown && (
                <div className={`absolute right-0 mt-2 w-72 rounded-xl shadow-xl py-2 border transition-colors ${
                  isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-100 text-slate-800"
                }`}>
                  <div className="px-4 py-1.5 border-b border-slate-700/10 font-bold text-xs text-yellow-500 uppercase tracking-wider">
                    {isSwahili ? "Arifa Zako" : "Your Notifications"}
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-3 text-xs text-slate-500 text-center">
                        {isSwahili ? "Hakuna arifa mpya" : "No new notifications"}
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="px-4 py-2.5 border-b border-slate-700/5 hover:bg-yellow-500/5 transition-colors">
                          <div className="font-bold text-xs">
                            {isSwahili ? n.titleSw : n.title}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {isSwahili ? n.messageSw : n.message}
                          </div>
                          <span className="text-[9px] text-slate-500 font-mono">
                            {new Date(n.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Simulator Role Selector (Crucial for exploring app capabilities) */}
            <div className="relative">
              <button
                id="role-simulator-btn"
                onClick={() => setShowRoleSelector(!showRoleSelector)}
                className="flex items-center gap-1 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-yellow-500/20 transition-all cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{currentUser ? currentUser.name : (isSwahili ? "Ingia" : "Login")}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showRoleSelector && (
                <div className={`absolute right-0 mt-2 w-64 rounded-xl shadow-2xl py-2 border z-50 transition-colors ${
                  isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-100 text-slate-800"
                }`}>
                  <div className="px-4 py-2 border-b border-slate-700/10">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {isSwahili ? "Simulia kama Mtumiaji:" : "Simulate User Role:"}
                    </span>
                    <span className="text-xs font-mono text-yellow-500 font-bold break-all">
                      {currentUser ? `${currentUser.role.toUpperCase()}: ${currentUser.email}` : "Guest / Mgeni"}
                    </span>
                  </div>
                  <div className="p-1 space-y-1">
                    {allUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleRoleChange(u.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                          currentUser?.id === u.id 
                            ? "bg-yellow-500 text-slate-950 font-bold" 
                            : "hover:bg-yellow-500/10 text-slate-400 hover:text-yellow-500"
                        }`}
                      >
                        <span className="text-sm">{u.avatar}</span>
                        <div>
                          <div className="font-bold">{u.name}</div>
                          <div className="text-[9px] opacity-80">{u.role === "admin" ? "Admin (Allen Dreamer77)" : u.role === "seller" ? "Verified Seller" : "Buyer"}</div>
                        </div>
                      </button>
                    ))}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-rose-500 hover:bg-rose-500/10 font-bold transition-all cursor-pointer"
                    >
                      🚪 {isSwahili ? "Ondoka (Logout)" : "Logout / Logout"}
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* Mobile Slide-out Menu */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowMobileMenu(false)}
          />

          {/* Sidebar Drawer */}
          <div className={`relative flex flex-col w-full max-w-xs h-full p-6 shadow-2xl transition-transform duration-300 ease-in-out ${
            isDarkMode ? "bg-slate-900 text-white border-r border-slate-800" : "bg-white text-slate-800 border-r border-slate-100"
          }`}>
            <div className="flex items-center justify-between pb-5 border-b border-yellow-500/10">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🇹🇿</span>
                <span className="font-bold text-xs text-yellow-500 tracking-wide">SOKO LA VITENGE</span>
              </div>
              <button 
                onClick={() => setShowMobileMenu(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-yellow-500 hover:bg-yellow-500/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Links for Mobile */}
            <div className="flex-1 py-6 space-y-2 overflow-y-auto">
              {/* Sokoni (Nunua) */}
              <button
                onClick={() => {
                  setViewMode("marketplace");
                  setShowMobileMenu(false);
                }}
                className={`w-full text-left py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 cursor-pointer ${
                  currentView === "marketplace"
                    ? "bg-yellow-500/15 text-yellow-500 font-bold"
                    : "hover:bg-yellow-500/5 text-slate-400 hover:text-yellow-500"
                }`}
                style={{ minHeight: "44px" }}
              >
                🛍️ {isSwahili ? "Sokoni (Nunua)" : "Marketplace (Buy)"}
              </button>

              {/* Dashibodi ya Mnunuzi */}
              <button
                onClick={() => {
                  setViewMode("buyer-dashboard");
                  setShowMobileMenu(false);
                }}
                className={`w-full text-left py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 cursor-pointer ${
                  currentView === "buyer-dashboard"
                    ? "bg-yellow-500/15 text-yellow-500 font-bold"
                    : "hover:bg-yellow-500/5 text-slate-400 hover:text-yellow-500"
                }`}
                style={{ minHeight: "44px" }}
              >
                📊 {isSwahili ? "Dashibodi ya Mnunuzi" : "Buyer Dashboard"}
              </button>

              {/* Akaunti Yangu */}
              <button
                onClick={() => {
                  setViewMode("my-account");
                  setShowMobileMenu(false);
                }}
                className={`w-full text-left py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 cursor-pointer ${
                  currentView === "my-account"
                    ? "bg-yellow-500/15 text-yellow-500 font-bold"
                    : "hover:bg-yellow-500/5 text-slate-400 hover:text-yellow-500"
                }`}
                style={{ minHeight: "44px" }}
              >
                👩🏾‍💼 {isSwahili ? "Akaunti Yangu" : "My Account"}
              </button>

              {/* Msaidizi wa AI */}
              <button
                onClick={() => {
                  onOpenAiHub();
                  setShowMobileMenu(false);
                }}
                className="w-full text-left py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 cursor-pointer hover:bg-yellow-500/5 text-slate-400 hover:text-yellow-500"
                style={{ minHeight: "44px" }}
              >
                ✨ {isSwahili ? "Msaidizi wa AI" : "AI Assistant Hub"}
              </button>

              {/* Conditionally keep Seller Dashboard */}
              {currentUser?.role === "seller" && (
                <button
                  onClick={() => {
                    setViewMode("seller-dashboard");
                    setShowMobileMenu(false);
                  }}
                  className={`w-full text-left py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 cursor-pointer ${
                    currentView === "seller-dashboard"
                      ? "bg-yellow-500/15 text-yellow-500 font-bold"
                      : "hover:bg-yellow-500/5 text-slate-400 hover:text-yellow-500"
                  }`}
                  style={{ minHeight: "44px" }}
                >
                  🏪 {isSwahili ? "Dashibodi ya Muuzaji" : "Seller Dashboard"}
                </button>
              )}

              {/* Conditionally keep Admin Dashboard */}
              {currentUser?.role === "admin" && (
                <button
                  onClick={() => {
                    setViewMode("admin-panel");
                    setShowMobileMenu(false);
                  }}
                  className={`w-full text-left py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 cursor-pointer ${
                    currentView === "admin-panel"
                      ? "bg-yellow-500/15 text-yellow-500 font-bold"
                      : "hover:bg-yellow-500/5 text-slate-400 hover:text-yellow-500"
                  }`}
                  style={{ minHeight: "44px" }}
                >
                  👑 {isSwahili ? "Udhibiti (Admin)" : "Admin Control"}
                </button>
              )}
            </div>

            {/* User details footer of sidebar */}
            <div className="pt-4 border-t border-yellow-500/10 flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="text-2xl">{currentUser?.avatar || "👩🏾‍💼"}</span>
                <div className="min-w-0">
                  <p className="font-bold text-xs truncate">{currentUser?.name || "Guest"}</p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">{currentUser?.email || "allenben428@gmail.com"}</p>
                </div>
              </div>
              {currentUser && (
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl bg-rose-500/15 text-rose-500 hover:bg-rose-500 hover:text-white transition-all text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>🚪</span>
                  <span>{isSwahili ? "Ondoka" : "Logout"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
