/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  ShoppingBag, 
  Heart, 
  Search, 
  Filter, 
  Wifi, 
  WifiOff, 
  CloudLightning, 
  SlidersHorizontal,
  ChevronRight,
  MessageSquare,
  AlertCircle
} from "lucide-react";

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AiAssistantHub from "./components/AiAssistantHub";
import SellerDashboard from "./components/SellerDashboard";
import AdminDashboard from "./components/AdminDashboard";
import BuyerDashboard from "./components/BuyerDashboard";
import MyAccount from "./components/MyAccount";
import ProductDetailModal from "./components/ProductDetailModal";
import CartDrawer from "./components/CartDrawer";
import LiveChat from "./components/LiveChat";
import AuthPage from "./components/AuthPage";

// Persistence & Types
import { localOrderStore } from "./utils/indexedDB";
import { 
  User, 
  Seller, 
  Product, 
  Order, 
  Review, 
  Message, 
  Notification, 
  SecurityLog, 
  ActivityLog, 
  Coupon,
  ProductVariation
} from "./types";

interface CartItem {
  id: string;
  product: Product;
  variation: ProductVariation;
  quantity: number;
}

export default function App() {
  // Global App Context States
  const [isSwahili, setIsSwahili] = useState(true); // Defaults to Kiswahili for Tanzanian authentic feel
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [viewMode, setViewMode] = useState<"marketplace" | "seller-dashboard" | "admin-panel" | "buyer-dashboard" | "my-account">("marketplace");

  // Models fetched from server
  const [users, setUsers] = useState<User[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  // Current logged in simulated user
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Shopping States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPriceRange, setSelectedPriceRange] = useState("All");

  // AI Assistant trigger states
  const [showAiHub, setShowAiHub] = useState(false);
  const [aiHubInitialAgent, setAiHubInitialAgent] = useState<"shopping" | "seller" | "support" | "fraud" | "marketing">("shopping");

  // Local storage orders state for offline sync
  const [offlineOrders, setOfflineOrders] = useState<Order[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [showWelcomeTooltip, setShowWelcomeTooltip] = useState(true);

  // Fetch all initial data on mount
  useEffect(() => {
    fetchInitialData();
    // Load local cart & wishlist
    const localCart = localStorage.getItem("soko_vitenge_cart");
    if (localCart) setCart(JSON.parse(localCart));

    const localWish = localStorage.getItem("soko_vitenge_wishlist");
    if (localWish) setWishlist(JSON.parse(localWish));

    // Get offline orders
    setOfflineOrders(localOrderStore.getOrders());
  }, []);

  const fetchInitialData = async () => {
    try {
      const [pRes, sRes, uRes, mRes, nRes, secRes, actRes, cRes] = await Promise.all([
        fetch("/api/products").then(r => r.json()),
        fetch("/api/sellers").then(r => r.json()),
        fetch("/api/users").then(r => r.json()),
        fetch("/api/messages").then(r => r.json()),
        fetch("/api/notifications").then(r => r.json()),
        fetch("/api/logs/security").then(r => r.json()),
        fetch("/api/logs/activity").then(r => r.json()),
        fetch("/api/coupons").then(r => r.json())
      ]);

      setProducts(pRes);
      setSellers(sRes);
      setUsers(uRes);
      setMessages(mRes);
      setNotifications(nRes);
      setSecurityLogs(secRes);
      setActivityLogs(actRes);
      setCoupons(cRes);

      // Seed reviews on start from default
      setReviews([
        { id: "r_1", productId: "p_1", userId: "u_buyer", userName: "Fatuma Omari", rating: 5, comment: "The gold foil is stunning and does not wash out at all! Best wedding buy.", commentSw: "Nakshi ya dhahabu ni nzuri mno na haitoki kabisa wakati wa kufua! Ndiyo ununuzi wangu bora wa harusi.", createdAt: "2026-06-25T14:32:00Z" }
      ]);

      // Set default user role as Kamala Vitenge Store to showcase multi-vendor or buyer
      const defaultBuyer = uRes.find((u: any) => u.id === "u_buyer") || null;
      setCurrentUser(defaultBuyer);

    } catch (e) {
      console.error("Error fetching data from server APIs", e);
    }
  };

  // Synchronize Offline Orders with secure cloud backend
  const handleSyncOrders = async () => {
    const unsynced = offlineOrders.filter(o => o.frontendStatus !== "Submitted");
    if (unsynced.length === 0) return;

    setIsSyncing(true);
    // Mark them as "Synchronizing" locally first
    unsynced.forEach(o => {
      localOrderStore.updateStatus(o.id, "Synchronizing");
    });
    setOfflineOrders(localOrderStore.getOrders());

    try {
      const response = await fetch("/api/orders/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orders: unsynced })
      });
      const data = await response.json();

      if (data.success) {
        // Mark as fully submitted
        unsynced.forEach(o => {
          localOrderStore.updateStatus(o.id, "Submitted");
        });
        
        // Clear fully synchronized local order data as requested by standard
        localOrderStore.clearSyncedOrders();
        setOfflineOrders(localOrderStore.getOrders());

        // Refresh database stats
        fetchInitialData();

        alert(isSwahili 
          ? "Hongera! Maagizo yote ya offline yamesawazishwa kikamilifu na Database yetu ya Soko!" 
          : "Success! All pending offline orders have synchronized cleanly with our Marketplace Database!");
      }
    } catch (e) {
      console.error("Order sync failed", e);
      unsynced.forEach(o => {
        localOrderStore.updateStatus(o.id, "Failed");
      });
      setOfflineOrders(localOrderStore.getOrders());
      alert(isSwahili 
        ? "Mawasiliano na seva yameshindwa. Maagizo yatalindwa kwanza hapa." 
        : "Sync failed. Your orders are securely kept inside the device cache.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Toggle Wishlist
  const handleToggleWishlist = (product: Product) => {
    const exists = wishlist.some(p => p.id === product.id);
    let updated;
    if (exists) {
      updated = wishlist.filter(p => p.id !== product.id);
    } else {
      updated = [...wishlist, product];
    }
    setWishlist(updated);
    localStorage.setItem("soko_vitenge_wishlist", JSON.stringify(updated));
  };

  // Cart operations
  const handleAddToCart = (product: Product, variation: ProductVariation, qty: number) => {
    const cartItemId = `${product.id}_${variation.id}`;
    const existingIndex = cart.findIndex(item => item.id === cartItemId);
    let updated;

    if (existingIndex > -1) {
      updated = [...cart];
      updated[existingIndex].quantity += qty;
    } else {
      updated = [...cart, { id: cartItemId, product, variation, quantity: qty }];
    }

    setCart(updated);
    localStorage.setItem("soko_vitenge_cart", JSON.stringify(updated));
    setShowCartDrawer(true);
  };

  const handleRemoveCartItem = (id: string) => {
    const updated = cart.filter(item => item.id !== id);
    setCart(updated);
    localStorage.setItem("soko_vitenge_cart", JSON.stringify(updated));
  };

  const handleClearCart = () => {
    setCart([]);
    localStorage.removeItem("soko_vitenge_cart");
  };

  // Create Checkout Order (Offline Capable)
  const handleCheckoutSubmit = (shippingDetails: any) => {
    const newOrderId = `ORD_${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder: Order = {
      id: newOrderId,
      userId: currentUser?.id || "u_guest",
      customerName: shippingDetails.name,
      phone: shippingDetails.phone,
      email: shippingDetails.email,
      shippingAddress: `${shippingDetails.address}, ${shippingDetails.shippingRegion}`,
      items: cart.map(item => ({
        productId: item.product.id,
        productTitle: item.product.title,
        quantity: item.quantity,
        price: item.product.price + item.variation.priceModifier,
        variationSelected: item.variation.name
      })),
      totalAmount: cart.reduce((acc, item) => acc + (item.product.price + item.variation.priceModifier) * item.quantity, 0) + (shippingDetails.shippingRegion === "Dar es Salaam" ? 3000 : shippingDetails.shippingRegion === "East Africa" ? 15000 : 7000) - shippingDetails.discountAmount,
      paymentMethod: shippingDetails.paymentMethod,
      createdAt: new Date().toISOString(),
      frontendStatus: "Pending",
      backendStatus: "Received",
      isOfflineCreated: !isOnline
    };

    // Save locally
    localOrderStore.addOrder(newOrder);
    setOfflineOrders(localOrderStore.getOrders());

    // If online, auto sync immediately
    if (isOnline) {
      setTimeout(() => {
        handleSyncOrders();
      }, 1000);
    }
  };

  // Messaging operations
  const handleSendMessage = async (receiverId: string, content: string) => {
    if (!currentUser) return;
    const msgPayload = {
      senderId: currentUser.id,
      receiverId,
      senderName: currentUser.name,
      content
    };

    // Local append
    const localMsg: Message = {
      id: `m_${Date.now()}`,
      senderId: currentUser.id,
      receiverId,
      senderName: currentUser.name,
      content,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, localMsg]);

    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(msgPayload)
      });
    } catch (e) {
      console.error("Offline message saved locally", e);
    }
  };

  // Reviews operations
  const handleAddReview = (productId: string, rating: number, comment: string) => {
    const newReview: Review = {
      id: `r_${Date.now()}`,
      productId,
      userId: currentUser?.id || "u_guest",
      userName: currentUser?.name || "Anonymous Buyer",
      rating,
      comment,
      commentSw: comment,
      createdAt: new Date().toISOString()
    };
    setReviews(prev => [newReview, ...prev]);
  };

  // Seller Dashboard modifications
  const handleAddProduct = async (prod: any) => {
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prod)
      });
      const data = await res.json();
      if (data.success) {
        setProducts(prev => [...prev, data.product]);
        fetchInitialData();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const handleEditProduct = async (productId: string, updated: any) => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      const data = await res.json();
      if (data.success) {
        setProducts(prev => prev.map(p => p.id === productId ? data.product : p));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setProducts(prev => prev.filter(p => p.id !== productId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveSeller = async (sellerId: string, approved: boolean) => {
    try {
      const res = await fetch("/api/sellers/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId, verified: approved })
      });
      const data = await res.json();
      if (data.success) {
        setSellers(prev => prev.map(s => s.id === sellerId ? data.seller : s));
        fetchInitialData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Open AI Agent Hub
  const handleOpenAiHub = (agentType?: "shopping" | "seller" | "support" | "fraud" | "marketing") => {
    if (agentType) {
      setAiHubInitialAgent(agentType);
    } else {
      setAiHubInitialAgent("shopping");
    }
    setShowAiHub(true);
  };

  // Advanced listings filtering
  const filteredProducts = products.filter((p) => {
    const titleMatch = (isSwahili ? p.titleSw : p.title).toLowerCase().includes(searchQuery.toLowerCase()) || p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const categoryMatch = selectedCategory === "All" || p.category === selectedCategory;
    
    let priceMatch = true;
    if (selectedPriceRange === "under30k") priceMatch = p.price < 30000;
    else if (selectedPriceRange === "30kto50k") priceMatch = p.price >= 30000 && p.price <= 50000;
    else if (selectedPriceRange === "over50k") priceMatch = p.price > 50000;

    return titleMatch && categoryMatch && priceMatch;
  });

  const activeSeller = sellers.find(s => s.userId === currentUser?.id) || null;
  const unsyncedCount = offlineOrders.filter(o => o.frontendStatus !== "Submitted").length;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
      isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"
    }`}>
      
      {/* Top Textile Gradient Banner */}
      <div className="h-2 w-full bg-textile-gradient" />

      {/* Navbar Global Setup */}
      <Navbar 
        isSwahili={isSwahili}
        setIsSwahili={setIsSwahili}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        isOnline={isOnline}
        setIsOnline={setIsOnline}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        allUsers={users}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        wishlistCount={wishlist.length}
        notifications={notifications}
        onOpenCart={() => setShowCartDrawer(true)}
        onOpenWishlist={() => alert(isSwahili ? `Wishlist yako ina Vitenge ${wishlist.length} vilivyolindwa.` : `Your Wishlist has ${wishlist.length} saved fabric designs.`)}
        onOpenAiHub={handleOpenAiHub}
        setViewMode={setViewMode}
        currentView={viewMode}
      />

      {/* Welcome instructions tooltip */}
      {showWelcomeTooltip && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 py-2.5 px-4 text-center text-xs text-slate-400 flex items-center justify-between gap-4 max-w-7xl mx-auto w-full">
          <p className="flex items-center gap-1.5 justify-center flex-1">
            <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
            <span>
              {isSwahili 
                ? "💡 JARIBU VITU VIPYA: Unaweza kubadili akaunti kati ya Kamala (Muuzaji), Mangi (Muuzaji), au Allen Dreamer77 (Admin) ukitumia kiigaji kilicho juu kulia!"
                : "💡 SYSTEM PRO-TIP: Toggle user accounts using the Simulator in the top-right corner to test complete Buyer, Vendor, or Admin dashboards!"}
            </span>
          </p>
          <button onClick={() => setShowWelcomeTooltip(false)} className="text-amber-500 hover:underline font-bold shrink-0 cursor-pointer">✕</button>
        </div>
      )}

      {/* Offline Unsynced orders Alert bar */}
      {unsyncedCount > 0 && isOnline && (
        <div className="bg-emerald-600 text-white text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-2">
          <span>⚠️ {isSwahili ? `Una maagizo ${unsyncedCount} yaliyoundwa nje ya mtandao (offline)!` : `You have ${unsyncedCount} pending offline-created orders!`}</span>
          <button 
            onClick={handleSyncOrders} 
            disabled={isSyncing}
            className="bg-white text-emerald-600 px-3 py-1 rounded-md font-bold hover:bg-slate-100 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1"
          >
            {isSyncing ? (isSwahili ? "Inasawazisha..." : "Syncing...") : (isSwahili ? "Sasa sawazisha na Database" : "Sync with Database Now")}
          </button>
        </div>
      )}

      {/* MAIN LAYOUT CANVAS */}
      <main className="flex-1">
        {!currentUser ? (
          <AuthPage 
            isSwahili={isSwahili}
            isDarkMode={isDarkMode}
            onLoginSuccess={(user) => {
              setCurrentUser(user);
              if (user.role === "admin") {
                setViewMode("admin-panel");
              } else if (user.role === "seller") {
                setViewMode("seller-dashboard");
              } else {
                setViewMode("marketplace");
              }
              fetchInitialData();
            }}
          />
        ) : (
          <>
            {/* VIEW 1: MARKETPLACE HOME */}
            {viewMode === "marketplace" && (
          <div className="space-y-8 pb-12">
            
            {/* HERO BANNER SECTION WITH LUXURY ARTISTIC FLAIR */}
            <section className="relative overflow-hidden bg-slate-900 text-white py-12 sm:py-20 border-b-4 border-yellow-500">
              {/* African Motifs backdrop simulation using grid overlay */}
              <div className="absolute inset-0 opacity-15 bg-fabric-pattern pointer-events-none" />
              
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                
                {/* Left: Content */}
                <div className="lg:col-span-7 text-left space-y-6">
                  <span className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-mono text-[10px] sm:text-xs uppercase px-4 py-1.5 rounded-full tracking-widest inline-block font-bold">
                    {isSwahili ? "Soko la kwanza la Vitenge la AI Afrika Mashariki" : "East Africa's premier AI-powered Vitenge hub"}
                  </span>

                  <h1 className="text-3xl sm:text-5xl font-display-serif tracking-tight text-white leading-tight">
                    {isSwahili ? "Nunua na Uuze Vitenge " : "Buy & Sell Authentic "}
                    <span className="relative inline-block text-yellow-400 font-bold italic">
                      Vitenge
                      <span className="absolute left-0 bottom-0 w-full h-1 bg-yellow-500 rounded-full" />
                    </span>
                    {isSwahili ? " Mtandaoni Kwa Urahisi" : " Fabrics Online"}
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                    {isSwahili 
                      ? "Gundua Vitenge vya asili vya nta (Super Wax), Batik za Morogoro, na Kanga za Harusi zilizoundwa kiasili. Nunua salama ukiwa online au offline!"
                      : "Discover 100% premium wax prints, local hand-dyed batiks, and royal wedding brocades. Experience offline checkout and multi-agent AI shopping recommendations!"}
                  </p>

                  {/* SEARCH INPUT & FILTER BAR */}
                  <div className="max-w-md bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-2xl flex items-center gap-2 border border-yellow-500/20">
                    <Search className="w-5 h-5 text-slate-400 shrink-0 ml-2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={isSwahili ? "Tafuta Vitenge vya Harusi, Batik, Wax..." : "Search wedding brocades, Morogoro Batik, Wax prints..."}
                      className="w-full text-xs text-slate-800 dark:text-white bg-transparent focus:outline-hidden"
                    />
                    <button 
                      onClick={() => handleOpenAiHub("shopping")}
                      className="bg-yellow-500 hover:bg-yellow-600 text-slate-950 text-[10px] font-bold px-3.5 py-2.5 rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1.5 shadow-md"
                    >
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      <span>AI Find</span>
                    </button>
                  </div>
                </div>

                {/* Right: Beautiful Visual Fabric Showcase Panel */}
                <div className="lg:col-span-5 relative hidden lg:block">
                  <div className="w-full h-64 rounded-3xl overflow-hidden bg-slate-950 border-4 border-yellow-500/40 shadow-2xl p-6 relative flex flex-col justify-between">
                    {/* Golden pattern overlay */}
                    <div className="absolute inset-0 bg-fabric-pattern opacity-45" />
                    <div className="absolute -top-12 -left-12 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />

                    <div className="relative z-10 flex justify-between items-start">
                      <span className="text-3xl">🇹🇿</span>
                      <span className="bg-yellow-400 text-slate-950 font-mono text-[9px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider">
                        Premium Quality
                      </span>
                    </div>

                    <div className="relative z-10 text-left space-y-2">
                      <h3 className="font-display-serif text-xl font-bold text-yellow-400 italic">
                        "Mstahimilivu hula mbivu"
                      </h3>
                      <p className="text-[10px] font-mono text-slate-400">
                        {isSwahili ? "— Methali ya Kitenge cha Kiasili" : "— Traditional Swahili Proverb Fabric"}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </section>

            {/* PRODUCT CATEGORIES FILTER TABS */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center border-b border-slate-700/10 pb-4">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-amber-500" />
                  <h3 className="font-bold text-sm tracking-tight">
                    {isSwahili ? "Vinjari kwa Jamii" : "Browse Categories"}
                  </h3>
                </div>
                
                {/* Price range selector */}
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-400 hidden sm:inline">{isSwahili ? "Kichujio cha Bei:" : "Price Range:"}</span>
                  <select
                    value={selectedPriceRange}
                    onChange={(e) => setSelectedPriceRange(e.target.value)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border focus:outline-hidden ${
                      isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value="All">{isSwahili ? "Bei Zote" : "All Prices"}</option>
                    <option value="under30k">{isSwahili ? "Chini ya TSh 30,000" : "Under 30,000 TSh"}</option>
                    <option value="30kto50k">TSh 30,000 - 50,000</option>
                    <option value="over50k">{isSwahili ? "Zaidi ya TSh 50,000" : "Over 50,000 TSh"}</option>
                  </select>
                </div>
              </div>

              {/* Category buttons list */}
              <div className="flex gap-2 overflow-x-auto py-4 pr-4">
                {["All", "Traditional Vitenge", "Fashion Vitenge", "Wedding Vitenge", "Premium Vitenge", "Imported Vitenge", "Local Designs"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-xs font-semibold py-2 px-4 rounded-full border transition-all cursor-pointer whitespace-nowrap ${
                      selectedCategory === cat
                        ? "bg-amber-500 text-white border-amber-500 font-bold shadow-md"
                        : isDarkMode
                          ? "border-slate-800 text-slate-300 hover:bg-slate-800"
                          : "border-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {isSwahili ? cat : cat}
                  </button>
                ))}
              </div>
            </section>

            {/* PRODUCT CATALOG GRID */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-mono">
                  {isSwahili ? `Vitenge ${filteredProducts.length} vimepatikana` : `${filteredProducts.length} fabrics matches found`}
                </span>

                {/* Quick assistant advice banner */}
                <div className="hidden md:flex items-center gap-1.5 text-xs text-amber-500 bg-amber-500/5 px-3 py-1.5 rounded-lg border border-amber-500/10 font-medium">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>{isSwahili ? "Ushauri wa AI: Vitenge vya harusi vinapendekezwa!" : "AI Advice: Royal Wedding prints are trending!"}</span>
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="py-20 text-center space-y-2 border-2 border-dashed border-slate-700/10 rounded-3xl">
                  <p className="text-slate-500 text-sm">
                    {isSwahili ? "Hakuna Vitenge vilivyopatikana kwa kichujio hiki." : "No fabrics matched your current filters."}
                  </p>
                  <button onClick={() => { setSelectedCategory("All"); setSearchQuery(""); setSelectedPriceRange("All"); }} className="text-xs text-amber-500 font-bold hover:underline cursor-pointer">
                    {isSwahili ? "Safi Vichujio vyote" : "Clear all filters"}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-8">
                  {filteredProducts.map((p) => {
                    const isWished = wishlist.some(item => item.id === p.id);
                    return (
                      <div
                        key={p.id}
                        className={`group rounded-3xl border overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                          isDarkMode ? "bg-slate-800/30 border-slate-700/50" : "bg-white border-slate-100"
                        }`}
                      >
                        {/* Image banner area */}
                        <div className="h-56 relative bg-slate-100 dark:bg-slate-950 overflow-hidden">
                          <img
                            src={p.images[0]}
                            alt={p.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            onClick={() => setSelectedProduct(p)}
                          />

                          {/* Quick Wish toggle */}
                          <button
                            onClick={() => handleToggleWishlist(p)}
                            className={`absolute top-4 right-4 p-2 rounded-full shadow-lg transition-colors cursor-pointer ${
                              isWished ? "bg-rose-500 text-white" : "bg-slate-900/80 hover:bg-slate-900 text-white"
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${isWished ? "fill-white" : ""}`} />
                          </button>

                          {/* Category Tag */}
                          <span className="absolute top-4 left-4 bg-slate-900/80 text-amber-500 font-mono text-[9px] font-bold py-1 px-2.5 rounded-full uppercase">
                            {p.category}
                          </span>
                        </div>

                        {/* Text copy contents */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-1" onClick={() => setSelectedProduct(p)}>
                            <h4 className="font-bold text-sm tracking-tight text-slate-800 dark:text-white line-clamp-1 group-hover:text-amber-500 transition-colors">
                              {isSwahili ? p.titleSw : p.title}
                            </h4>
                            <p className="text-[11px] text-slate-400 line-clamp-2">
                              {isSwahili ? p.descriptionSw : p.description}
                            </p>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                              <span>⭐ {p.rating.toFixed(1)}</span>
                              <span>•</span>
                              <span>{p.sellerName}</span>
                            </div>
                          </div>

                          {/* Bottom price and CTA */}
                          <div className="flex justify-between items-center pt-3 border-t border-slate-700/5">
                            <div>
                              <span className="text-[9px] text-slate-400 uppercase font-mono">{isSwahili ? "Mchango wa Bei" : "Best Price"}</span>
                              <div className="text-amber-500 font-bold font-mono text-sm leading-none">
                                {p.price.toLocaleString()} TSh
                              </div>
                            </div>

                            <button
                              id={`add-cart-p-${p.id}`}
                              onClick={() => handleAddToCart(p, p.variations[0], 1)}
                              className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2 px-3 rounded-xl transition-all shadow-md flex items-center gap-1 hover:scale-105 cursor-pointer"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>{isSwahili ? "Nunua" : "Buy"}</span>
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </section>

          </div>
        )}

        {/* VIEW 2: SELLER DASHBOARD */}
        {viewMode === "seller-dashboard" && (
          <SellerDashboard 
            isSwahili={isSwahili}
            isDarkMode={isDarkMode}
            currentUser={currentUser}
            activeSeller={activeSeller}
            products={products}
            onAddProduct={handleAddProduct}
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
            onOpenAiHub={handleOpenAiHub}
          />
        )}

        {/* VIEW 3: ADMIN PANEL */}
        {viewMode === "admin-panel" && (
          <AdminDashboard 
            isSwahili={isSwahili}
            isDarkMode={isDarkMode}
            users={users}
            sellers={sellers}
            products={products}
            securityLogs={securityLogs}
            activityLogs={activityLogs}
            onApproveSeller={handleApproveSeller}
            onDeleteProduct={handleDeleteProduct}
            onRefreshLogs={fetchInitialData}
          />
        )}

        {/* VIEW 4: BUYER DASHBOARD */}
        {viewMode === "buyer-dashboard" && (
          <BuyerDashboard
            isSwahili={isSwahili}
            isDarkMode={isDarkMode}
            currentUser={currentUser}
            products={products}
            orders={offlineOrders}
            messages={messages}
            notifications={notifications}
            onUpdateUser={(updatedUser) => {
              setCurrentUser(updatedUser);
              fetchInitialData();
            }}
            onAddProduct={handleAddProduct}
            onSendMessage={handleSendMessage}
            onRefreshLogs={fetchInitialData}
            setViewMode={setViewMode}
          />
        )}

        {/* VIEW 5: MY ACCOUNT DETAILS */}
        {viewMode === "my-account" && (
          <div className="max-w-4xl mx-auto px-4 py-8">
            <MyAccount
              isSwahili={isSwahili}
              isDarkMode={isDarkMode}
              currentUser={currentUser}
              onUpdateUser={(updatedUser) => {
                setCurrentUser(updatedUser);
                fetchInitialData();
              }}
              onRefreshLogs={fetchInitialData}
            />
          </div>
        )}
          </>
        )}
      </main>

      {/* FOOTER AND DEVELOPER CREDITS */}
      <Footer isSwahili={isSwahili} />

      {/* LIGHTBOX MODALS AND OVERLAYS */}

      {/* AI Assistant chat drawer */}
      {showAiHub && (
        <AiAssistantHub 
          isSwahili={isSwahili}
          isDarkMode={isDarkMode}
          onClose={() => setShowAiHub(false)}
          initialAgentType={aiHubInitialAgent}
        />
      )}

      {/* Product Detail Modal with Zoom */}
      {selectedProduct && (
        <ProductDetailModal 
          isSwahili={isSwahili}
          isDarkMode={isDarkMode}
          product={selectedProduct}
          allProducts={products}
          reviews={reviews}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          onAddReview={handleAddReview}
          onSelectProduct={setSelectedProduct}
        />
      )}

      {/* Secure Shopping cart drawer with shipping/checkout options */}
      {showCartDrawer && (
        <CartDrawer 
          isSwahili={isSwahili}
          isDarkMode={isDarkMode}
          isOnline={isOnline}
          cart={cart}
          coupons={coupons}
          onRemoveItem={handleRemoveCartItem}
          onClearCart={handleClearCart}
          onCheckout={handleCheckoutSubmit}
          onClose={() => setShowCartDrawer(false)}
        />
      )}

      {/* Interactive live vendor support messaging */}
      <LiveChat 
        isSwahili={isSwahili}
        isDarkMode={isDarkMode}
        currentUser={currentUser}
        messages={messages}
        onSendMessage={handleSendMessage}
      />

    </div>
  );
}
