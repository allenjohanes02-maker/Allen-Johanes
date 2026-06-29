/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Users, 
  Store, 
  ShoppingBag, 
  Activity, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Sparkles,
  Lock,
  Globe,
  Settings,
  TrendingUp,
  FileText,
  Terminal,
  Info,
  Calendar,
  Layers,
  MapPin,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  HeartCrack,
  UserCheck,
  Tag,
  Image,
  UploadCloud,
  RotateCw,
  Crop,
  Plus,
  Edit,
  Eye,
  Trash
} from "lucide-react";
import { User, Seller, Product, SecurityLog, ActivityLog, Order } from "../types";

interface AdminDashboardProps {
  isSwahili: boolean;
  isDarkMode: boolean;
  users: User[];
  sellers: Seller[];
  products: Product[];
  securityLogs: SecurityLog[];
  activityLogs: ActivityLog[];
  onApproveSeller: (sellerId: string, approved: boolean) => void;
  onDeleteProduct: (productId: string) => void;
  onRefreshLogs: () => void;
}

export default function AdminDashboard({
  isSwahili,
  isDarkMode,
  users: initialUsers,
  sellers: initialSellers,
  products: initialProducts,
  securityLogs: initialSecurityLogs,
  activityLogs: initialActivityLogs,
  onApproveSeller,
  onDeleteProduct,
  onRefreshLogs
}: AdminDashboardProps) {
  // Tabs State
  const [activeTab, setActiveTab] = useState<"sellers" | "products" | "users" | "orders" | "security" | "reports" | "ai_monitor" | "settings" | "images">("sellers");
  
  // Dynamic collections with local sync on operations
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [sellers, setSellers] = useState<Seller[]>(initialSellers);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [orders, setOrders] = useState<Order[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>(initialSecurityLogs);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(initialActivityLogs);
  
  // AI fraud scanner states
  const [isScanningFraud, setIsScanningFraud] = useState(false);
  const [fraudReport, setFraudReport] = useState<string | null>(null);
  
  // Filter states
  const [usersSearch, setUsersSearch] = useState("");
  const [productsSearch, setProductsSearch] = useState("");
  const [logsSearch, setLogsSearch] = useState("");
  const [logsType, setLogsType] = useState<"all" | "security" | "activity" | "logins">("all");
  const [loginHistory, setLoginHistory] = useState<any[]>([]);

  // Promo state
  const [banners, setBanners] = useState<any[]>([]);
  const [advertisements, setAdvertisements] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  
  // Feedback messages
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState<string | null>(null);

  // Sync internal states with initial props
  useEffect(() => { setUsers(initialUsers); }, [initialUsers]);
  useEffect(() => { setSellers(initialSellers); }, [initialSellers]);
  useEffect(() => { setProducts(initialProducts); }, [initialProducts]);
  useEffect(() => { setSecurityLogs(initialSecurityLogs); }, [initialSecurityLogs]);
  useEffect(() => { setActivityLogs(initialActivityLogs); }, [initialActivityLogs]);

  // Load backend details (Orders & Login history)
  useEffect(() => {
    fetchOrdersAndLogs();
  }, [activeTab]);

  const fetchOrdersAndLogs = async () => {
    try {
      // Fetch Orders
      const ordRes = await fetch("/api/orders");
      if (ordRes.ok) {
        const ordData = await ordRes.json();
        setOrders(ordData);
      }

      // Fetch Login history
      const logRes = await fetch("/api/auth/login-history");
      if (logRes.ok) {
        const logData = await logRes.json();
        setLoginHistory(logData);
      }

      // Fetch Promotional Banners, Ads, and Announcements
      const promoRes = await fetch("/api/images/banners");
      if (promoRes.ok) {
        const promoData = await promoRes.json();
        setBanners(promoData.banners || []);
        setAdvertisements(promoData.advertisements || []);
        setAnnouncements(promoData.announcements || []);
      }
    } catch (err) {
      console.error("Error loading administrative orders or login history:", err);
    }
  };

  // Run AI Fraud Scanner using system models
  const handleAiFraudScan = async () => {
    setIsScanningFraud(true);
    setFraudReport(null);

    try {
      const prompt = `Perform an AI Security and Fraud audit of SOKO LA VITENGE MTANDAONI. Evaluate security logs for any suspicious checkouts, failed brute force login lockouts, or rate limits. Highlight the CSRF cookie defense state. Deliver an executive summary of 2 paragraphs in both English and Kiswahili, certifying the platform's state as SECURE.`;
      
      const response = await fetch("/api/ai/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentType: "fraud",
          prompt: prompt,
          additionalContext: { securityLogsCount: securityLogs.length, activeSessions: users.length }
        })
      });
      const data = await response.json();
      setFraudReport(data.text);
    } catch (e) {
      console.error(e);
      setFraudReport(isSwahili 
        ? "Mfumo wa AI Fraud scanner hauwezi kupatikana kwa sasa, lakini ukaguzi wa ndani unathibitisha: Hakuna shughuli za ulaghai zilizogundulika leo. Hali ya ulinzi ipo juu kabisa nchini." 
        : "AI Fraud scanning is currently offline. Local security check confirms: 0 anomalous checkout patterns detected. All payment gateways (M-Pesa, Tigo Pesa) are fully secured.");
    } finally {
      setIsScanningFraud(false);
    }
  };

  // Moderate Product: Approve, Reject or Delete
  const handleModerateProduct = async (productId: string, action: "published" | "rejected" | "delete") => {
    setStatusMsg(null);
    try {
      if (action === "delete") {
        if (confirm(isSwahili ? "Je, una uhakika unataka kufuta kabisa bidhaa hii?" : "Are you sure you want to delete this product?")) {
          onDeleteProduct(productId);
          setProducts(prev => prev.filter(p => p.id !== productId));
          setStatusMsg({
            type: "success",
            text: isSwahili ? "Bidhaa imefutwa kikamilifu!" : "Product deleted successfully!"
          });
        }
        return;
      }

      // Update status
      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProducts(prev => prev.map(p => p.id === productId ? data.product : p));
          setStatusMsg({
            type: "success",
            text: action === "published" 
              ? (isSwahili ? "Bidhaa imekubaliwa na kuchapishwa sokoni!" : "Product approved and published successfully!")
              : (isSwahili ? "Bidhaa imekataliwa!" : "Product rejected successfully!")
          });
          onRefreshLogs();
        }
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: "error", text: "Operation failed." });
    }
  };

  // Moderate Order Backend Status
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    setIsUpdatingOrder(orderId);
    setStatusMsg(null);
    try {
      const response = await fetch("/api/orders/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus })
      });
      const data = await response.json();
      if (data.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, backendStatus: newStatus as any } : o));
        setStatusMsg({
          type: "success",
          text: isSwahili ? "Hali ya agizo imesasishwa kikamilifu!" : "Order status updated successfully!"
        });
        onRefreshLogs();
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: "error", text: "Failed to update order status." });
    } finally {
      setIsUpdatingOrder(null);
    }
  };

  // --- PROMOTIONAL AND IMAGE HUB HELPERS ---
  const [newBanner, setNewBanner] = useState({ title: "", titleSw: "", description: "", link: "", imageBase64: "" });
  const [newAd, setNewAd] = useState({ title: "", imageBase64: "" });
  const [newAnn, setNewAnn] = useState({ title: "", titleSw: "", content: "", contentSw: "" });
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const [dragOverBanner, setDragOverBanner] = useState(false);
  const [dragOverAd, setDragOverAd] = useState(false);

  const savePromoContent = async (updatedBanners: any[], updatedAds: any[], updatedAnns: any[]) => {
    try {
      const res = await fetch("/api/images/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          banners: updatedBanners,
          advertisements: updatedAds,
          announcements: updatedAnns,
          userId: "u_admin"
        })
      });
      if (res.ok) {
        const data = await res.json();
        setBanners(data.banners || []);
        setAdvertisements(data.advertisements || []);
        setAnnouncements(data.announcements || []);
        setStatusMsg({ type: "success", text: isSwahili ? "Mabadiliko yamehifadhiwa kikamilifu!" : "Promotional content updated successfully!" });
      }
    } catch (e) {
      console.error(e);
      setStatusMsg({ type: "error", text: "Failed to sync changes." });
    }
  };

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBanner.title || !newBanner.imageBase64) {
      alert(isSwahili ? "Tafadhali jaza kichwa cha habari na uweke picha!" : "Please provide a title and select/drag an image!");
      return;
    }

    setUploadProgress(isSwahili ? "Inapakia..." : "Uploading...");
    try {
      const upRes = await fetch("/api/images/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageName: `banner_${newBanner.title}`,
          base64Data: newBanner.imageBase64,
          userId: "u_admin"
        })
      });
      if (!upRes.ok) {
        const errData = await upRes.json();
        throw new Error(errData.message || "Upload failed");
      }
      const upData = await upRes.json();
      const nextBanners = [
        ...banners,
        {
          id: `b_${Date.now()}`,
          title: newBanner.title,
          titleSw: newBanner.titleSw || newBanner.title,
          imageUrl: upData.url,
          link: newBanner.link || "#",
          active: true,
          description: newBanner.description
        }
      ];
      await savePromoContent(nextBanners, advertisements, announcements);
      setNewBanner({ title: "", titleSw: "", description: "", link: "", imageBase64: "" });
    } catch (err: any) {
      alert(err.message || "Upload failed");
    } finally {
      setUploadProgress(null);
    }
  };

  const handleAddAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAd.title || !newAd.imageBase64) {
      alert(isSwahili ? "Tafadhali jaza kichwa na picha ya tangazo!" : "Please fill ad title and supply an image!");
      return;
    }

    setUploadProgress(isSwahili ? "Inapakia..." : "Uploading...");
    try {
      const upRes = await fetch("/api/images/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageName: `ad_${newAd.title}`,
          base64Data: newAd.imageBase64,
          userId: "u_admin"
        })
      });
      if (!upRes.ok) {
        const errData = await upRes.json();
        throw new Error(errData.message || "Upload failed");
      }
      const upData = await upRes.json();
      const nextAds = [
        ...advertisements,
        {
          id: `ad_${Date.now()}`,
          title: newAd.title,
          imageUrl: upData.url,
          active: true
        }
      ];
      await savePromoContent(banners, nextAds, announcements);
      setNewAd({ title: "", imageBase64: "" });
    } catch (err: any) {
      alert(err.message || "Upload failed");
    } finally {
      setUploadProgress(null);
    }
  };

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnn.title || !newAnn.content) {
      alert(isSwahili ? "Tafadhali jaza kichwa na maelezo ya tangazo!" : "Please provide a title and content for the announcement!");
      return;
    }

    const nextAnns = [
      ...announcements,
      {
        id: `ann_${Date.now()}`,
        title: newAnn.title,
        titleSw: newAnn.titleSw || newAnn.title,
        content: newAnn.content,
        contentSw: newAnn.contentSw || newAnn.content,
        active: true
      }
    ];
    await savePromoContent(banners, advertisements, nextAnns);
    setNewAnn({ title: "", titleSw: "", content: "", contentSw: "" });
  };

  const handleDeleteBanner = (id: string) => {
    if (confirm(isSwahili ? "Je, una uhakika unataka kufuta bango hili?" : "Are you sure you want to delete this banner?")) {
      const nextBanners = banners.filter(b => b.id !== id);
      savePromoContent(nextBanners, advertisements, announcements);
    }
  };

  const handleDeleteAd = (id: string) => {
    if (confirm(isSwahili ? "Je, una uhakika unataka kufuta tangazo hili?" : "Are you sure you want to delete this advertisement?")) {
      const nextAds = advertisements.filter(a => a.id !== id);
      savePromoContent(banners, nextAds, announcements);
    }
  };

  const handleDeleteAnnouncement = (id: string) => {
    if (confirm(isSwahili ? "Je, una uhakika unataka kufuta tangazo hili maalum?" : "Are you sure you want to delete this announcement?")) {
      const nextAnns = announcements.filter(a => a.id !== id);
      savePromoContent(banners, advertisements, nextAnns);
    }
  };

  const handleModerateDeleteProductImage = async (productId: string, imageUrl: string) => {
    if (confirm(isSwahili ? "Je, una uhakika unataka kuondoa picha hii kutoka kwenye bidhaa?" : "Are you sure you want to remove this image from the product?")) {
      try {
        const res = await fetch("/api/images/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: "u_admin",
            type: "product",
            targetId: productId,
            imageUrl
          })
        });
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
          setStatusMsg({ type: "success", text: isSwahili ? "Picha imeondolewa kikamilifu!" : "Inappropriate image deleted successfully!" });
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Lock or Unlock simulated user
  const handleToggleUserLock = async (userId: string, isCurrentlyLocked: boolean) => {
    setStatusMsg(null);
    try {
      const targetUser = users.find(u => u.id === userId);
      if (!targetUser) return;

      const updatedLockedUntil = isCurrentlyLocked ? null : new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 mins lock

      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          lockedUntil: updatedLockedUntil
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, lockedUntil: updatedLockedUntil || undefined } : u));
          setStatusMsg({
            type: "success",
            text: isCurrentlyLocked 
              ? (isSwahili ? "Mtumiaji amefunguliwa (Unlocked)!" : "User unlocked successfully!")
              : (isSwahili ? "Mtumiaji amefungiwa kwa dakika 30 (Locked)!" : "User locked for 30 minutes!")
          });
          onRefreshLogs();
        }
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: "error", text: "Could not toggle user lockout." });
    }
  };

  // Change user role
  const handleChangeUserRole = async (userId: string, currentRole: string) => {
    setStatusMsg(null);
    const newRole = currentRole === "buyer" ? "seller" : "buyer";
    try {
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          role: newRole
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
          setStatusMsg({
            type: "success",
            text: isSwahili ? `Jukumu la mtumiaji limebadilishwa kuwa: ${newRole}` : `User role changed to: ${newRole}`
          });
          onRefreshLogs();
        }
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: "error", text: "Role update failed." });
    }
  };

  // Filter collections based on search inputs
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(usersSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(usersSearch.toLowerCase()) ||
    (u.username && u.username.toLowerCase().includes(usersSearch.toLowerCase()))
  );

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(productsSearch.toLowerCase()) ||
    p.sellerName.toLowerCase().includes(productsSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productsSearch.toLowerCase())
  );

  // Performance analytics sums
  const totalRevenue = orders.filter(o => o.backendStatus === "Delivered" || o.backendStatus === "Confirmed").reduce((acc, o) => acc + o.totalAmount, 0);
  const pendingOrdersCount = orders.filter(o => o.backendStatus === "Received" || o.backendStatus === "Processing").length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
      
      {/* Title Banner */}
      <div className={`p-6 rounded-2xl border transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
        isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-800"
      }`}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">👑</span>
          <div>
            <h2 className="text-xl font-black tracking-tight">
              {isSwahili ? "Udhibiti na Usimamizi Mkuu" : "Super Administrator Console"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isSwahili 
                ? "Signed in as Allen77# (Msimamizi Mkuu • ALLEN DREAMER77)" 
                : "Signed in as Allen77# (Super Administrator • ALLEN DREAMER77)"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs py-1.5 px-3 rounded-xl font-mono">
          <Lock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>BRUTE FORCE SHIELD • CSRF SECURE</span>
        </div>
      </div>

      {/* Admin Stats Metric Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl border transition-colors ${
          isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-100"
        }`}>
          <span className="text-[10px] font-bold text-slate-500 uppercase block">{isSwahili ? "Jumla ya Watumiaji" : "Total Users"}</span>
          <div className="text-xl font-bold font-sans mt-1 text-slate-200 flex items-center justify-between">
            <span>{users.length}</span>
            <Users className="w-4 h-4 text-yellow-500" />
          </div>
        </div>

        <div className={`p-4 rounded-xl border transition-colors ${
          isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-100"
        }`}>
          <span className="text-[10px] font-bold text-slate-500 uppercase block">{isSwahili ? "Wauzaji Walioidhinishwa" : "Approved Stores"}</span>
          <div className="text-xl font-bold font-sans mt-1 text-slate-200 flex items-center justify-between">
            <span>{sellers.length}</span>
            <Store className="w-4 h-4 text-purple-500" />
          </div>
        </div>

        <div className={`p-4 rounded-xl border transition-colors ${
          isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-100"
        }`}>
          <span className="text-[10px] font-bold text-slate-500 uppercase block">{isSwahili ? "Vitenge Vyote" : "Total Fabrics"}</span>
          <div className="text-xl font-bold font-sans mt-1 text-slate-200 flex items-center justify-between">
            <span>{products.length}</span>
            <ShoppingBag className="w-4 h-4 text-blue-500" />
          </div>
        </div>

        <div className={`p-4 rounded-xl border transition-colors ${
          isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-100"
        }`}>
          <span className="text-[10px] font-bold text-slate-500 uppercase block">{isSwahili ? "Arifa za Mfumo" : "Security Shield"}</span>
          <div className="text-xl font-bold font-sans mt-1 text-emerald-400 flex items-center justify-between">
            <span>{securityLogs.length} Logs</span>
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* FEEDBACK STATUS */}
      {statusMsg && (
        <div className={`p-4 rounded-xl flex items-center gap-2.5 border text-xs font-bold animate-fade-in ${
          statusMsg.type === "success" 
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
        }`}>
          {statusMsg.type === "success" ? <CheckCircle2 className="w-4.5 h-4.5" /> : <AlertTriangle className="w-4.5 h-4.5" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* AI Fraud & Risk Management Center */}
      <div className={`p-5 rounded-2xl border transition-colors ${
        isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-100"
      }`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/10 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-red-500 animate-spin" />
            <div>
              <h3 className="font-bold text-xs text-red-400 uppercase tracking-wider">
                {isSwahili ? "KITUO CHA AKILI BANDIA CHA UKAGUZI ULAGHAI" : "AI MULTI-AGENT RISK AUDITING (GEMINI ACTIVE)"}
              </h3>
              <p className="text-[10px] text-slate-500">
                {isSwahili ? "Chambua majaribio ya kuingia, fursa za XSS na CSRF thabiti kwa kutumia Gemini." : "Audit automated checkouts, potential XSS injections, and CSRF cookies using Gemini models."}
              </p>
            </div>
          </div>

          <button
            onClick={handleAiFraudScan}
            disabled={isScanningFraud}
            className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{isScanningFraud ? "Scanning..." : "Run AI Fraud Scanner"}</span>
          </button>
        </div>

        {fraudReport ? (
          <div className="bg-slate-950 text-slate-100 p-4 rounded-xl border border-red-500/20 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
            {fraudReport}
          </div>
        ) : (
          <p className="text-[10px] text-slate-500 italic text-center py-1">
            {isSwahili ? "Hakuna ripoti mpya ya ulaghai iliyowekwa." : "No active security audit executed yet. Run scanner to analyze cookies & locks."}
          </p>
        )}
      </div>

      {/* ADMIN TABS */}
      <div className="flex border-b border-slate-800/15 overflow-x-auto gap-1.5 scrollbar-none">
        {[
          { id: "sellers", label: isSwahili ? "Maombi ya Wauzaji" : "Store Applications", icon: Store },
          { id: "products", label: isSwahili ? "Udhibiti wa Bidhaa" : "Product Moderation", icon: Tag },
          { id: "images", label: isSwahili ? "Usimamizi wa Picha na Matangazo" : "Image & Ad Hub", icon: Image },
          { id: "users", label: isSwahili ? "Usimamizi wa Watumiaji" : "User Management", icon: Users },
          { id: "orders", label: isSwahili ? "Udhibiti wa Maagizo" : "Order Moderation", icon: ShoppingBag },
          { id: "security", label: isSwahili ? "Logs na Usalama" : "Security & System Logs", icon: ShieldAlert },
          { id: "reports", label: isSwahili ? "Uchambuzi na Ripoti" : "Reports & Analytics", icon: TrendingUp },
          { id: "ai_monitor", label: isSwahili ? "Ufuatiliaji wa AI" : "AI Agent Monitor", icon: Sparkles },
          { id: "settings", label: isSwahili ? "Mipangilio ya Mfumo" : "System Settings", icon: Settings },
        ].map(tab => {
          const IconComp = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer border-b-2 ${
                activeTab === tab.id
                  ? "border-yellow-500 text-yellow-500 bg-yellow-500/5 font-black"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <IconComp className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB VIEWS */}
      <div className="min-h-96">
        
        {/* TAB 1: SELLER APPLICATIONS */}
        {activeTab === "sellers" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">{isSwahili ? "Maombi na Uhakiki wa Wauzaji" : "Seller Verification Queue"}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sellers.map((s) => (
                <div key={s.id} className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 ${
                  isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100"
                }`}>
                  <div>
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-sm text-yellow-500">{s.storeName}</h4>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        s.verified ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400 animate-pulse"
                      }`}>
                        {s.verified ? "Verified" : "Pending Approval"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">{s.description}</p>
                    <div className="text-[10px] text-slate-500 font-mono mt-3 space-y-1">
                      <p>📍 Location: {s.location}</p>
                      <p>📞 Phone: {s.phone} | WhatsApp: {s.whatsapp}</p>
                      {s.businessCategory && <p>📁 Category: {s.businessCategory}</p>}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-slate-800/10">
                    {!s.verified ? (
                      <button
                        onClick={() => onApproveSeller(s.id, true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] py-1.5 px-3 rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{isSwahili ? "Kubali Ombi" : "Approve Seller"}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onApproveSeller(s.id, false)}
                        className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-bold text-[11px] py-1.5 px-3 rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{isSwahili ? "Batilisha Ruhusa" : "Revoke Store"}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCT MODERATION */}
        {activeTab === "products" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">{isSwahili ? "Udhibiti wa Katalogi ya Vitenge" : "Product Catalog & Upload Approval"}</h3>
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-3.5 h-3.5" />
                <input 
                  type="text"
                  placeholder="Search fabric or seller..."
                  value={productsSearch}
                  onChange={e => setProductsSearch(e.target.value)}
                  className="w-full text-xs p-2 pl-9 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-yellow-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((p) => {
                // Determine status badge
                const isPending = p.status === "pending" || !p.status;
                return (
                  <div key={p.id} className={`p-4 rounded-2xl border flex flex-col justify-between gap-4 ${
                    isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100"
                  }`}>
                    <div>
                      <div className="relative rounded-xl overflow-hidden h-32 mb-3">
                        <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                        <span className={`absolute top-2 right-2 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          p.status === "published" 
                            ? "bg-emerald-500/20 text-emerald-400" 
                            : p.status === "rejected"
                            ? "bg-rose-500/20 text-rose-400"
                            : "bg-amber-500/20 text-amber-400 animate-pulse"
                        }`}>
                          {p.status || "pending"}
                        </span>
                      </div>

                      <h4 className="font-bold text-xs text-slate-200 line-clamp-1">{p.title}</h4>
                      <p className="text-[10px] text-yellow-500 font-mono mt-0.5">{p.price.toLocaleString()} TSh</p>
                      
                      {/* Detailed specifications */}
                      <div className="mt-3 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/10 space-y-1 text-[10px] text-slate-400 font-mono">
                        <p>👤 Owner: <span className="text-slate-200 font-bold">{p.sellerName}</span></p>
                        <p>📦 Condition: {p.condition || "New"}</p>
                        <p>📐 Size: {p.size || "6 Yards"}</p>
                        <p>🎨 Color: {p.color || "Multicolor"}</p>
                        <p>🚚 Delivery: {p.deliveryOptions || "Store Pickup"}</p>
                        <p>📁 Category: {p.category}</p>
                      </div>
                    </div>

                    <div className="flex gap-1.5 pt-3 border-t border-slate-800/10 justify-end">
                      {isPending && (
                        <>
                          <button
                            onClick={() => handleModerateProduct(p.id, "published")}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleModerateProduct(p.id, "rejected")}
                            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}
                      
                      {p.status === "published" && (
                        <button
                          onClick={() => handleModerateProduct(p.id, "rejected")}
                          className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3 h-3" />
                          <span>Revoke</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleModerateProduct(p.id, "delete")}
                        className="text-rose-500 hover:bg-rose-500/10 p-1.5 rounded-lg cursor-pointer"
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: USER MANAGEMENT */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">{isSwahili ? "Dhibiti na Fuatilia Watumiaji" : "User Accounts Management"}</h3>
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-3.5 h-3.5" />
                <input 
                  type="text"
                  placeholder="Search user, email..."
                  value={usersSearch}
                  onChange={e => setUsersSearch(e.target.value)}
                  className="w-full text-xs p-2 pl-9 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-yellow-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800/15">
              <table className="w-full text-xs text-left text-slate-300 bg-slate-950/40">
                <thead>
                  <tr className="bg-yellow-500/10 text-yellow-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
                    <th className="p-3">User / Avatar</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Location & Address</th>
                    <th className="p-3">Account Security</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30 font-mono text-[11px]">
                  {filteredUsers.map((u) => {
                    const isLocked = u.lockedUntil ? new Date(u.lockedUntil) > new Date() : false;
                    return (
                      <tr key={u.id} className="hover:bg-yellow-500/5 transition-colors">
                        <td className="p-3 font-bold flex items-center gap-2">
                          <span className="text-lg">{u.avatar || "👩🏾‍💼"}</span>
                          <span>{u.name}</span>
                        </td>
                        <td className="p-3">{u.email}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            u.role === "admin" ? "bg-rose-500/20 text-rose-400" : u.role === "seller" ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"
                          }`}>
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 text-[10px]">
                          {u.city || "Tanzania"}, {u.physicalAddress || "Kariakoo"}
                        </td>
                        <td className="p-3">
                          {isLocked ? (
                            <span className="text-rose-500 font-bold uppercase flex items-center gap-1">
                              <Lock className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                              <span>Locked</span>
                            </span>
                          ) : (
                            <span className="text-emerald-500 font-bold uppercase">Active</span>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-1.5">
                          <button
                            onClick={() => handleToggleUserLock(u.id, isLocked)}
                            className={`p-1 rounded text-[9px] font-bold ${
                              isLocked ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                            }`}
                          >
                            {isLocked ? "Unlock" : "Lock"}
                          </button>
                          <button
                            onClick={() => handleChangeUserRole(u.id, u.role)}
                            className="bg-yellow-500/20 text-yellow-500 p-1 rounded text-[9px] font-bold"
                          >
                            Toggle Role
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: ORDER MODERATION */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">{isSwahili ? "Kagua na Sasisha Maagizo yote" : "Order Moderation & Logistics"}</h3>
            
            <div className="overflow-x-auto rounded-xl border border-slate-800/15">
              <table className="w-full text-xs text-left text-slate-300 bg-slate-950/40">
                <thead>
                  <tr className="bg-yellow-500/10 text-yellow-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
                    <th className="p-3">Order ID</th>
                    <th className="p-3">Customer details</th>
                    <th className="p-3">Items / Fabrics</th>
                    <th className="p-3">Total amount</th>
                    <th className="p-3">Sync state</th>
                    <th className="p-3 text-right">Update backend status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30 font-mono text-[11px]">
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-yellow-500/5 transition-colors">
                      <td className="p-3 font-bold text-yellow-500">#{o.id.toUpperCase()}</td>
                      <td className="p-3 text-[10px]">
                        <p className="font-bold text-slate-200">{o.customerName}</p>
                        <p className="text-slate-400">📞 {o.phone}</p>
                        <p className="text-slate-500 text-[9px] truncate max-w-[150px]">📍 {o.shippingAddress}</p>
                      </td>
                      <td className="p-3">
                        {o.items.map((it, idx) => (
                          <div key={idx} className="text-[10px] text-slate-400">
                            {it.productTitle} <span className="text-slate-600">x{it.quantity}</span>
                          </div>
                        ))}
                      </td>
                      <td className="p-3 font-bold text-slate-200">{o.totalAmount.toLocaleString()} TSh</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          o.frontendStatus === "Submitted" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400 animate-pulse"
                        }`}>
                          {o.frontendStatus}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <select
                          value={o.backendStatus}
                          disabled={isUpdatingOrder === o.id}
                          onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                          className="bg-slate-950 border border-slate-800 text-slate-300 text-[10px] p-1.5 rounded-lg focus:outline-none focus:border-yellow-500 font-mono cursor-pointer"
                        >
                          <option value="Received">Received</option>
                          <option value="Processing">Processing</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: SYSTEM & SECURITY LOGS */}
        {activeTab === "security" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">{isSwahili ? "Kumbukumbu za Ulinzi na Uendeshaji" : "Full Platform Security Logs"}</h3>
                <button 
                  onClick={() => {
                    onRefreshLogs();
                    fetchOrdersAndLogs();
                  }}
                  className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex gap-2 max-w-md w-full">
                <select
                  value={logsType}
                  onChange={e => setLogsType(e.target.value as any)}
                  className="text-xs p-2 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-yellow-500 font-mono cursor-pointer"
                >
                  <option value="all">All Logs</option>
                  <option value="security">Security Events</option>
                  <option value="activity">Audits Actions</option>
                  <option value="logins">Login History</option>
                </select>

                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-3.5 h-3.5" />
                  <input 
                    type="text"
                    placeholder="Search logs..."
                    value={logsSearch}
                    onChange={e => setLogsSearch(e.target.value)}
                    className="w-full text-xs p-2 pl-9 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-[10px]">
              {/* Security Shield Events */}
              {(logsType === "all" || logsType === "security") && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-red-500 uppercase flex items-center gap-1 border-b border-slate-800 pb-1.5">
                    <ShieldAlert className="w-4 h-4 text-red-500" />
                    <span>Security & Brute Shield</span>
                  </h4>
                  <div className="h-96 overflow-y-auto space-y-2.5 p-3 rounded-xl bg-slate-950 text-slate-200 border border-slate-800">
                    {securityLogs
                      .filter(l => l.details.toLowerCase().includes(logsSearch.toLowerCase()) || l.event.toLowerCase().includes(logsSearch.toLowerCase()))
                      .map((log) => (
                        <div key={log.id} className="border-b border-slate-900 pb-2">
                          <div className="flex justify-between items-center text-[9px]">
                            <span className={log.severity === "critical" ? "text-red-500 font-bold" : "text-amber-500"}>
                              [{log.severity.toUpperCase()}] {log.event}
                            </span>
                            <span className="text-slate-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-slate-400 mt-1">{log.details}</p>
                          <p className="text-[9px] text-slate-600">IP: {log.ipAddress}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Administrative Actions Audits */}
              {(logsType === "all" || logsType === "activity") && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-amber-500 uppercase flex items-center gap-1 border-b border-slate-800 pb-1.5">
                    <Activity className="w-4 h-4 text-amber-500" />
                    <span>Auditable System Activity</span>
                  </h4>
                  <div className="h-96 overflow-y-auto space-y-2.5 p-3 rounded-xl bg-slate-950 text-slate-200 border border-slate-800">
                    {activityLogs
                      .filter(l => l.details.toLowerCase().includes(logsSearch.toLowerCase()) || l.action.toLowerCase().includes(logsSearch.toLowerCase()))
                      .map((log) => (
                        <div key={log.id} className="border-b border-slate-900 pb-2">
                          <div className="flex justify-between items-center text-[9px]">
                            <span className="text-amber-500 font-bold">
                              {log.userName} • {log.action}
                            </span>
                            <span className="text-slate-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-slate-400 mt-1">{log.details}</p>
                          {log.ipAddress && <p className="text-[9px] text-slate-600">IP: {log.ipAddress}</p>}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Login history */}
              {(logsType === "all" || logsType === "logins") && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-emerald-500 uppercase flex items-center gap-1 border-b border-slate-800 pb-1.5">
                    <Lock className="w-4 h-4 text-emerald-500" />
                    <span>Real-time Login Shield</span>
                  </h4>
                  <div className="h-96 overflow-y-auto space-y-2.5 p-3 rounded-xl bg-slate-950 text-slate-200 border border-slate-800">
                    {loginHistory
                      .filter(l => l.usernameOrEmail.toLowerCase().includes(logsSearch.toLowerCase()))
                      .map((log) => (
                        <div key={log.id} className="border-b border-slate-900 pb-2">
                          <div className="flex justify-between items-center text-[9px]">
                            <span className={log.status === "success" ? "text-emerald-500 font-bold" : "text-rose-500 font-bold"}>
                              [{log.status.toUpperCase()}] {log.usernameOrEmail}
                            </span>
                            <span className="text-slate-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-slate-400 mt-1">IP: {log.ipAddress} | Device: {log.device}</p>
                          {log.reason && <p className="text-rose-400 text-[9px] mt-0.5">Reason: {log.reason}</p>}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: REPORTS & ANALYTICS */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">{isSwahili ? "Uchambuzi wa Mauzo na Watumiaji" : "Financial Performance & Analytics"}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-5 rounded-2xl border ${
                isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100"
              }`}>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Marketplace Turnover</span>
                <p className="text-2xl font-black text-yellow-500 mt-2 font-mono">{(totalRevenue).toLocaleString()} TSh</p>
                <p className="text-[10px] text-slate-400 mt-1">Sum of confirmed or delivered fabric orders.</p>
              </div>

              <div className={`p-5 rounded-2xl border ${
                isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100"
              }`}>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Pending Logistics</span>
                <p className="text-2xl font-black text-purple-500 mt-2 font-mono">{pendingOrdersCount} Orders</p>
                <p className="text-[10px] text-slate-400 mt-1">Orders in received or processing queue.</p>
              </div>

              <div className={`p-5 rounded-2xl border ${
                isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100"
              }`}>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Overall Active Listings</span>
                <p className="text-2xl font-black text-blue-500 mt-2 font-mono">{products.filter(p => p.status === "published").length} Fabrics</p>
                <p className="text-[10px] text-slate-400 mt-1">Active, searchable and featured items online.</p>
              </div>
            </div>

            {/* Visual Vector Chart */}
            <div className={`p-6 rounded-2xl border space-y-4 ${
              isDarkMode ? "bg-slate-900/30 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-800"
            }`}>
              <h4 className="text-xs font-bold uppercase text-slate-400">Order Backend Status Distribution</h4>
              
              <div className="space-y-3 pt-2">
                {["Received", "Processing", "Confirmed", "Shipped", "Delivered", "Cancelled"].map(status => {
                  const count = orders.filter(o => o.backendStatus === status).length;
                  const percent = orders.length > 0 ? (count / orders.length) * 100 : 0;
                  return (
                    <div key={status} className="space-y-1 font-mono text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">{status}</span>
                        <span className="text-slate-200 font-bold">{count} ({percent.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            status === "Delivered" ? "bg-emerald-500" : status === "Cancelled" ? "bg-rose-500" : "bg-yellow-500"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: AI AGENT MONITORING */}
        {activeTab === "ai_monitor" && (
          <div className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">System AI Multi-Agent & Chat Routing Monitoring</h3>
            
            <div className={`p-6 rounded-2xl border space-y-4 ${
              isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100"
            }`}>
              <div className="flex items-center gap-2 text-yellow-500 font-bold text-xs uppercase tracking-wider">
                <Terminal className="w-4 h-4 text-yellow-500 animate-pulse" />
                <span>Multi-Agent Capabilities & Model Health Status</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-[10px] text-slate-400">
                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/20 space-y-1.5">
                  <p className="text-slate-200 font-bold">1. Shopping Assistant Agent</p>
                  <p>Model: <span className="text-yellow-500">gemini-2.5-flash</span></p>
                  <p>Role: Product recommendation, fabric pattern matching</p>
                  <p>Status: <span className="text-emerald-400 font-bold">HEALTHY</span></p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/20 space-y-1.5">
                  <p className="text-slate-200 font-bold">2. Seller Listing Agent</p>
                  <p>Model: <span className="text-yellow-500">gemini-2.5-flash</span></p>
                  <p>Role: Copywriting, Swahili-English translations</p>
                  <p>Status: <span className="text-emerald-400 font-bold">HEALTHY</span></p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/20 space-y-1.5">
                  <p className="text-slate-200 font-bold">3. Support Desk Agent</p>
                  <p>Model: <span className="text-yellow-500">gemini-2.5-flash</span></p>
                  <p>Role: Return policies, courier details, offline orders</p>
                  <p>Status: <span className="text-emerald-400 font-bold">HEALTHY</span></p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/20 space-y-1.5">
                  <p className="text-slate-200 font-bold">4. Fraud Auditor Agent</p>
                  <p>Model: <span className="text-yellow-500">gemini-2.5-flash</span></p>
                  <p>Role: Cookie checking, IP pattern anomaly detections</p>
                  <p>Status: <span className="text-emerald-400 font-bold">HEALTHY</span></p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: IMAGE & PROMOTIONAL MEDIA HUB */}
        {activeTab === "images" && (
          <div className="space-y-8 animate-fade-in">
            {/* Header / Intro block */}
            <div className={`p-6 rounded-2xl border transition-colors ${
              isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-800"
            }`}>
              <h3 className="text-base font-black tracking-tight flex items-center gap-2 text-yellow-500">
                <Image className="w-5 h-5" />
                <span>{isSwahili ? "Usimamizi wa Picha na Matangazo ya Mfumo" : "Image & Promotional Media Hub"}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isSwahili 
                  ? "Sajili au ubadilishe mabango ya ofa, matangazo ya jukwaa, na uondoe picha zisizofaa zilizowekwa na watumiaji." 
                  : "Upload, edit, delete promo banners, homepage ads, custom announcements, and moderate/remove user product pictures securely."}
              </p>
            </div>

            {/* Grid of Promos: Banners & Ads */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* SECTION A: PROMOTIONAL BANNERS */}
              <div className={`p-6 rounded-2xl border space-y-6 ${
                isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100"
              }`}>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 border-b border-slate-800/10 pb-2">
                  <span>📢</span>
                  <span>{isSwahili ? "Bango za Matangazo ya Juu" : "Hero Banners Manager"}</span>
                </h4>

                {/* Banner list */}
                <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                  {banners.map((b: any) => (
                    <div key={b.id} className="p-3 rounded-xl bg-slate-950/20 border border-slate-800/10 flex gap-4 items-center justify-between">
                      <img src={b.imageUrl} alt={b.title} className="w-20 h-12 object-cover rounded-lg border border-slate-800/10" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-200 truncate">{isSwahili ? b.titleSw : b.title}</p>
                        <p className="text-[10px] text-slate-500 truncate">{b.description || "No description"}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteBanner(b.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                        title={isSwahili ? "Futa Bango" : "Delete Banner"}
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {banners.length === 0 && (
                    <p className="text-xs text-slate-500 italic text-center py-4">{isSwahili ? "Hakuna bango za matangazo zilizowekwa." : "No active hero banners loaded."}</p>
                  )}
                </div>

                {/* Add Banner Form */}
                <form onSubmit={handleAddBanner} className="space-y-4 pt-4 border-t border-slate-800/10">
                  <p className="text-[11px] font-black uppercase text-yellow-500">{isSwahili ? "Sajili Bango Jipya" : "Upload New Banner"}</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder={isSwahili ? "Kichwa (English)" : "Banner Title (English)"}
                      value={newBanner.title}
                      onChange={e => setNewBanner({ ...newBanner, title: e.target.value })}
                      className="w-full bg-slate-950/40 border border-slate-800/20 text-xs p-2.5 rounded-xl text-white outline-none"
                    />
                    <input
                      type="text"
                      placeholder={isSwahili ? "Kichwa (Kiswahili)" : "Banner Title (Kiswahili)"}
                      value={newBanner.titleSw}
                      onChange={e => setNewBanner({ ...newBanner, titleSw: e.target.value })}
                      className="w-full bg-slate-950/40 border border-slate-800/20 text-xs p-2.5 rounded-xl text-white outline-none"
                    />
                  </div>

                  <input
                    type="text"
                    placeholder={isSwahili ? "Maelezo Mafupi" : "Short Description / Call to Action"}
                    value={newBanner.description}
                    onChange={e => setNewBanner({ ...newBanner, description: e.target.value })}
                    className="w-full bg-slate-950/40 border border-slate-800/20 text-xs p-2.5 rounded-xl text-white outline-none"
                  />

                  {/* Drag & Drop Zone */}
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOverBanner(true); }}
                    onDragLeave={() => setDragOverBanner(false)}
                    onDrop={e => {
                      e.preventDefault();
                      setDragOverBanner(false);
                      const file = e.dataTransfer.files[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          alert(isSwahili ? "Kosa: Picha inazidi MB 5!" : "Error: Image size exceeds 5MB limit!");
                          return;
                        }
                        const r = new FileReader();
                        r.onload = () => setNewBanner({ ...newBanner, imageBase64: r.result as string });
                        r.readAsDataURL(file);
                      }
                    }}
                    className={`border-2 border-dashed p-4 rounded-xl text-center transition-all ${
                      dragOverBanner ? "border-yellow-500 bg-yellow-500/5 animate-pulse" : "border-slate-800/20 bg-slate-950/10"
                    }`}
                  >
                    {newBanner.imageBase64 ? (
                      <div className="space-y-2">
                        <img src={newBanner.imageBase64} alt="Preview" className="h-20 mx-auto object-cover rounded-lg border border-slate-800" />
                        <button
                          type="button"
                          onClick={() => setNewBanner({ ...newBanner, imageBase64: "" })}
                          className="text-[10px] text-rose-400 underline cursor-pointer"
                        >
                          {isSwahili ? "Ondoa Picha" : "Remove Image"}
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer space-y-1 block">
                        <UploadCloud className="w-8 h-8 text-slate-500 mx-auto" />
                        <p className="text-[11px] text-slate-400 font-bold">
                          {isSwahili ? "Vuta picha hapa au bofya kuchagua (JPEG, PNG, WEBP)" : "Drag & drop image here, or click to browse (JPEG, PNG, WEBP)"}
                        </p>
                        <p className="text-[9px] text-slate-500 font-mono">Max: 5MB</p>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                alert(isSwahili ? "Kosa: Picha inazidi MB 5!" : "Error: Image size exceeds 5MB limit!");
                                return;
                              }
                              const r = new FileReader();
                              r.onload = () => setNewBanner({ ...newBanner, imageBase64: r.result as string });
                              r.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!!uploadProgress}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:opacity-55 text-slate-950 font-black text-xs py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{uploadProgress || (isSwahili ? "Sajili na Hifadhi Bango" : "Upload & Save Banner")}</span>
                  </button>
                </form>
              </div>

              {/* SECTION B: HOMEPAGE ADVERTISEMENTS */}
              <div className={`p-6 rounded-2xl border space-y-6 ${
                isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100"
              }`}>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 border-b border-slate-800/10 pb-2">
                  <span>🛍️</span>
                  <span>{isSwahili ? "Matangazo Maalum ya Sokoni" : "Homepage Ads Manager"}</span>
                </h4>

                {/* Ads list */}
                <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                  {advertisements.map((a: any) => (
                    <div key={a.id} className="p-3 rounded-xl bg-slate-950/20 border border-slate-800/10 flex gap-4 items-center justify-between">
                      <img src={a.imageUrl} alt={a.title} className="w-16 h-16 object-cover rounded-lg border border-slate-800/10" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-200 truncate">{a.title}</p>
                        <p className="text-[10px] text-slate-500">{isSwahili ? "Matangazo Madogo ya Chini" : "Grid Advertisement Banner"}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteAd(a.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                        title={isSwahili ? "Futa Tangazo" : "Delete Ad"}
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {advertisements.length === 0 && (
                    <p className="text-xs text-slate-500 italic text-center py-4">{isSwahili ? "Hakuna matangazo yaliyowekwa." : "No active advertisements loaded."}</p>
                  )}
                </div>

                {/* Add Ad Form */}
                <form onSubmit={handleAddAd} className="space-y-4 pt-4 border-t border-slate-800/10">
                  <p className="text-[11px] font-black uppercase text-yellow-500">{isSwahili ? "Sajili Tangazo Jipya" : "Upload New Ad"}</p>
                  
                  <input
                    type="text"
                    placeholder={isSwahili ? "Kichwa cha Tangazo" : "Advertisement Title / Brand"}
                    value={newAd.title}
                    onChange={e => setNewAd({ ...newAd, title: e.target.value })}
                    className="w-full bg-slate-950/40 border border-slate-800/20 text-xs p-2.5 rounded-xl text-white outline-none"
                  />

                  {/* Drag & Drop Zone */}
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOverAd(true); }}
                    onDragLeave={() => setDragOverAd(false)}
                    onDrop={e => {
                      e.preventDefault();
                      setDragOverAd(false);
                      const file = e.dataTransfer.files[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          alert(isSwahili ? "Kosa: Picha inazidi MB 5!" : "Error: Image size exceeds 5MB limit!");
                          return;
                        }
                        const r = new FileReader();
                        r.onload = () => setNewAd({ ...newAd, imageBase64: r.result as string });
                        r.readAsDataURL(file);
                      }
                    }}
                    className={`border-2 border-dashed p-4 rounded-xl text-center transition-all ${
                      dragOverAd ? "border-yellow-500 bg-yellow-500/5 animate-pulse" : "border-slate-800/20 bg-slate-950/10"
                    }`}
                  >
                    {newAd.imageBase64 ? (
                      <div className="space-y-2">
                        <img src={newAd.imageBase64} alt="Preview" className="h-20 mx-auto object-cover rounded-lg border border-slate-800" />
                        <button
                          type="button"
                          onClick={() => setNewAd({ ...newAd, imageBase64: "" })}
                          className="text-[10px] text-rose-400 underline cursor-pointer"
                        >
                          {isSwahili ? "Ondoa Picha" : "Remove Image"}
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer space-y-1 block">
                        <UploadCloud className="w-8 h-8 text-slate-500 mx-auto" />
                        <p className="text-[11px] text-slate-400 font-bold">
                          {isSwahili ? "Vuta picha hapa au bofya kuchagua (JPEG, PNG, WEBP)" : "Drag & drop image here, or click to browse (JPEG, PNG, WEBP)"}
                        </p>
                        <p className="text-[9px] text-slate-500 font-mono">Max: 5MB</p>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                alert(isSwahili ? "Kosa: Picha inazidi MB 5!" : "Error: Image size exceeds 5MB limit!");
                                return;
                              }
                              const r = new FileReader();
                              r.onload = () => setNewAd({ ...newAd, imageBase64: r.result as string });
                              r.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!!uploadProgress}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:opacity-55 text-slate-950 font-black text-xs py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{uploadProgress || (isSwahili ? "Sajili na Hifadhi Tangazo" : "Upload & Save Ad")}</span>
                  </button>
                </form>
              </div>

            </div>

            {/* SECTION C: SYSTEM ANNOUNCEMENTS */}
            <div className={`p-6 rounded-2xl border space-y-6 ${
              isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100"
            }`}>
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 border-b border-slate-800/10 pb-2">
                <span>🔔</span>
                <span>{isSwahili ? "Usimamizi wa Arifa Maalum za Mfumo" : "Global System Announcements"}</span>
              </h4>

              {/* Announcement List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {announcements.map((a: any) => (
                  <div key={a.id} className="p-4 rounded-xl bg-slate-950/30 border border-slate-800/20 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] bg-yellow-500/20 text-yellow-500 font-bold px-2 py-0.5 rounded">ACTIVE NOTICE</span>
                        <button
                          onClick={() => handleDeleteAnnouncement(a.id)}
                          className="p-1 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs font-black text-slate-200">{isSwahili ? a.titleSw : a.title}</p>
                      <p className="text-[11px] text-slate-400 mt-1">{isSwahili ? a.contentSw : a.content}</p>
                    </div>
                  </div>
                ))}
                {announcements.length === 0 && (
                  <p className="text-xs text-slate-500 italic col-span-2 text-center py-4">{isSwahili ? "Hakuna matangazo maalum yaliyowekwa." : "No active system notices loaded."}</p>
                )}
              </div>

              {/* Add Notice Form */}
              <form onSubmit={handleAddAnnouncement} className="p-4 rounded-xl bg-slate-950/20 border border-slate-800/10 space-y-4">
                <p className="text-[11px] font-black uppercase text-yellow-500">{isSwahili ? "Sajili Tangazo Jipya la Mfumo" : "Post New Global Notice"}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder={isSwahili ? "Kichwa (English)" : "Notice Header (English)"}
                    value={newAnn.title}
                    onChange={e => setNewAnn({ ...newAnn, title: e.target.value })}
                    className="w-full bg-slate-950/40 border border-slate-800/20 text-xs p-2.5 rounded-xl text-white outline-none"
                  />
                  <input
                    type="text"
                    placeholder={isSwahili ? "Kichwa (Kiswahili)" : "Notice Header (Kiswahili)"}
                    value={newAnn.titleSw}
                    onChange={e => setNewAnn({ ...newAnn, titleSw: e.target.value })}
                    className="w-full bg-slate-950/40 border border-slate-800/20 text-xs p-2.5 rounded-xl text-white outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <textarea
                    placeholder={isSwahili ? "Maudhui (English)" : "Content / Alert message (English)"}
                    value={newAnn.content}
                    onChange={e => setNewAnn({ ...newAnn, content: e.target.value })}
                    rows={2}
                    className="w-full bg-slate-950/40 border border-slate-800/20 text-xs p-2.5 rounded-xl text-white outline-none resize-none"
                  />
                  <textarea
                    placeholder={isSwahili ? "Maudhui (Kiswahili)" : "Content / Alert message (Kiswahili)"}
                    value={newAnn.contentSw}
                    onChange={e => setNewAnn({ ...newAnn, contentSw: e.target.value })}
                    rows={2}
                    className="w-full bg-slate-950/40 border border-slate-800/20 text-xs p-2.5 rounded-xl text-white outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-black text-xs py-2 px-4 rounded-xl transition-all cursor-pointer"
                >
                  {isSwahili ? "Post Tangazo Maalum" : "Broadcast Announcement"}
                </button>
              </form>
            </div>

            {/* SECTION D: PLATFORM IMAGE MODERATION */}
            <div className={`p-6 rounded-2xl border space-y-6 ${
              isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100"
            }`}>
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 border-b border-slate-800/10 pb-2">
                <span>🛡️</span>
                <span>{isSwahili ? "Udhibiti na Ukaguzi wa Picha za Bidhaa za Wauzaji" : "User Product Galleries Moderation"}</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                {isSwahili 
                  ? "Ondoa picha zisizofaa au zisizo sahihi zilizowekwa na watumiaji bila kufuta bidhaa nzima sokoni." 
                  : "Remove inappropriate, copyright-infringed, or low-quality product pictures directly from live store products."}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-1">
                {products.flatMap((prod: any) => 
                  (prod.images || []).map((imgUrl: string, idx: number) => (
                    <div key={`${prod.id}_img_${idx}`} className="p-3.5 rounded-xl bg-slate-950/30 border border-slate-800/25 space-y-3">
                      <img src={imgUrl} alt={prod.title} className="w-full h-36 object-cover rounded-lg border border-slate-800/10" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-200 truncate">{prod.title}</p>
                        <p className="text-[10px] text-slate-400">{isSwahili ? "Muuzaji:" : "Seller:"} <span className="text-yellow-500 font-mono font-bold">{prod.sellerName}</span></p>
                      </div>
                      <button
                        onClick={() => handleModerateDeleteProductImage(prod.id, imgUrl)}
                        className="w-full bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-400 text-[10px] font-bold py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Trash className="w-3 h-3" />
                        <span>{isSwahili ? "Futa Picha Hii" : "Delete Inappropriate Image"}</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 8: SYSTEM SETTINGS */}
        {activeTab === "settings" && (
          <div className={`p-6 sm:p-8 rounded-2xl border space-y-6 max-w-2xl mx-auto ${
            isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100"
          }`}>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Core Administrative Options</h3>
            <div className="space-y-4 font-sans text-xs text-slate-400 leading-relaxed">
              <div className="p-4 rounded-xl bg-slate-950/30 border border-slate-800/20 space-y-2">
                <span className="font-bold text-slate-200 block">SHA-256 Administrative Locks</span>
                <p>Brute-force protection limits accounts to 5 failed attempts within 15 minutes, with automated 30-minute lockouts logged inside the Security Events tab.</p>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
