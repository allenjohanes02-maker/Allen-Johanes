/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  User as UserIcon, 
  ShoppingBag, 
  PlusCircle, 
  FileText, 
  MessageSquare, 
  Bell, 
  Settings as SettingsIcon, 
  Tag, 
  Plus, 
  Grid, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  Layers,
  MapPin,
  Calendar,
  CreditCard,
  Image,
  UploadCloud,
  RotateCw,
  Crop,
  Trash
} from "lucide-react";
import { User, Product, Order, Message, Notification } from "../types";
import MyAccount from "./MyAccount";

interface BuyerDashboardProps {
  isSwahili: boolean;
  isDarkMode: boolean;
  currentUser: User | null;
  products: Product[];
  orders: Order[];
  messages: Message[];
  notifications: Notification[];
  onUpdateUser: (updatedUser: User) => void;
  onAddProduct: (productData: any) => Promise<boolean>;
  onSendMessage: (receiverId: string, content: string) => void;
  onRefreshLogs: () => void;
  setViewMode: (view: "marketplace" | "seller-dashboard" | "admin-panel") => void;
}

const PRESET_FABRIC_IMAGES = [
  "/src/assets/images/kitenge_yellow_blue_1782736276162.jpg",
  "/src/assets/images/kitenge_blue_gold_1782736308148.jpg",
  "/src/assets/images/kitenge_red_black_1782736294642.jpg",
  "/src/assets/images/kitenge_green_orange_1782736323136.jpg"
];

const FABRIC_CATEGORIES = [
  "Traditional Vitenge",
  "Fashion Vitenge",
  "Wedding Vitenge",
  "Premium Vitenge",
  "Imported Vitenge",
  "Local Designs",
  "Men's Fabrics",
  "Women's Fabrics",
  "Children's Fabrics",
  "Accessories"
];

export default function BuyerDashboard({
  isSwahili,
  isDarkMode,
  currentUser,
  products,
  orders,
  messages,
  notifications,
  onUpdateUser,
  onAddProduct,
  onSendMessage,
  onRefreshLogs,
  setViewMode
}: BuyerDashboardProps) {
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4 animate-bounce" />
        <h3 className="text-xl font-bold">
          {isSwahili ? "Tafadhali ingia ili ufungue dashibodi" : "Please log in to open the dashboard"}
        </h3>
      </div>
    );
  }

  // Manage Active Tab
  const [activeTab, setActiveTab] = useState<"profile" | "products" | "orders" | "messages" | "notifications" | "settings" | "images">("profile");

  // --- BUYER IMAGE MANAGEMENT HELPERS ---
  const [selectedProductForImg, setSelectedProductForImg] = useState<string>("");
  const [dragOverProfile, setDragOverProfile] = useState(false);
  const [dragOverProduct, setDragOverProduct] = useState(false);
  const [imgUploadProgress, setImgUploadProgress] = useState<string | null>(null);

  // Simulated cropping state
  const [croppingImage, setCroppingImage] = useState<{ productId?: string; imageUrl: string; rotation: number; scale: number } | null>(null);

  const handleProfilePicUpload = async (base64Data: string) => {
    setImgUploadProgress(isSwahili ? "Inapakia..." : "Uploading profile picture...");
    try {
      const upRes = await fetch("/api/images/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageName: `profile_${currentUser.name}`,
          base64Data,
          userId: currentUser.id
        })
      });
      if (!upRes.ok) {
        const errData = await upRes.json();
        throw new Error(errData.message || "Upload failed");
      }
      const upData = await upRes.json();
      
      const updatedUser = { ...currentUser, avatar: upData.url };
      
      const saveRes = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          avatar: upData.url
        })
      });
      if (saveRes.ok) {
        onUpdateUser(updatedUser);
        onRefreshLogs();
        alert(isSwahili ? "Picha ya wasifu imesasishwa kikamilifu!" : "Profile picture updated successfully!");
      }
    } catch (err: any) {
      alert(err.message || "Failed to upload profile picture");
    } finally {
      setImgUploadProgress(null);
    }
  };

  const handleProfilePicDelete = async () => {
    if (confirm(isSwahili ? "Je, una uhakika unataka kufuta picha yako ya wasifu?" : "Are you sure you want to delete your profile picture?")) {
      try {
        const res = await fetch("/api/images/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser.id,
            type: "profile",
            targetId: currentUser.id
          })
        });
        if (res.ok) {
          const updatedUser = { ...currentUser, avatar: "👩🏾‍💼" };
          onUpdateUser(updatedUser);
          onRefreshLogs();
          alert(isSwahili ? "Picha ya wasifu imefutwa." : "Profile picture removed.");
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleProductImageUpload = async (productId: string, base64Data: string) => {
    setImgUploadProgress(isSwahili ? "Inapakia..." : "Uploading image to gallery...");
    try {
      const upRes = await fetch("/api/images/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageName: `product_${productId}_gallery`,
          base64Data,
          userId: currentUser.id
        })
      });
      if (!upRes.ok) {
        const errData = await upRes.json();
        throw new Error(errData.message || "Upload failed");
      }
      const upData = await upRes.json();

      const product = products.find(p => p.id === productId);
      if (product) {
        const updatedImages = [...(product.images || []), upData.url];
        
        const saveRes = await fetch(`/api/products/${productId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            images: updatedImages
          })
        });
        if (saveRes.ok) {
          onRefreshLogs();
          alert(isSwahili ? "Picha imeongezwa kwenye albamu ya bidhaa!" : "Product image added to gallery successfully!");
        }
      }
    } catch (err: any) {
      alert(err.message || "Failed to upload product image");
    } finally {
      setImgUploadProgress(null);
    }
  };

  const handleProductImageDelete = async (productId: string, imageUrl: string) => {
    if (confirm(isSwahili ? "Je, una uhakika unataka kufuta picha hii kutoka kwenye bidhaa yako?" : "Are you sure you want to delete this product image?")) {
      try {
        const res = await fetch("/api/images/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser.id,
            type: "product",
            targetId: productId,
            imageUrl
          })
        });
        if (res.ok) {
          onRefreshLogs();
          alert(isSwahili ? "Picha imefutwa kikamilifu!" : "Image deleted successfully from product gallery!");
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSaveCrop = async () => {
    if (!croppingImage) return;
    setImgUploadProgress(isSwahili ? "Inahifadhi mabadiliko ya kupunguza (Cropping)..." : "Saving cropped image configuration...");
    
    setTimeout(() => {
      alert(isSwahili 
        ? `Picha imekatwa (Rotated: ${croppingImage.rotation}deg, Scale: ${croppingImage.scale}x) na kuhifadhiwa kikamilifu!` 
        : `Image cropped (Rotated: ${croppingImage.rotation}deg, Scale: ${croppingImage.scale}x) and saved successfully!`);
      setCroppingImage(null);
      setImgUploadProgress(null);
    }, 1500);
  };

  // Manage Add Product form visibility
  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  // Add Product Form inputs
  const [productForm, setProductForm] = useState({
    title: "",
    category: "Traditional Vitenge",
    description: "",
    price: "",
    stock: "5",
    condition: "New",
    size: "6 Yards",
    color: "Multicolor",
    deliveryOptions: "Store Pickup, Courier Delivery",
    tagsInput: "BuyerPost, Traditional, Cotton",
    selectedImage: PRESET_FABRIC_IMAGES[0],
    status: "pending" as "draft" | "pending"
  });

  // Messaging state
  const [selectedReceiver, setSelectedReceiver] = useState("u_seller_kamala");
  const [chatInput, setChatInput] = useState("");

  // Filters
  const buyerProducts = products.filter(p => p.sellerId === currentUser.id);
  const buyerOrders = orders.filter(o => o.userId === currentUser.id);
  const userNotifications = notifications.filter(n => n.userId === currentUser.id);
  const chatMessages = messages.filter(
    m => m.senderId === currentUser.id || m.receiverId === currentUser.id
  );

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!productForm.title || !productForm.price || !productForm.description) {
      setFormError(isSwahili ? "Tafadhali jaza uga zote za lazima!" : "Please fill out all required fields!");
      return;
    }

    setIsSubmittingProduct(true);
    try {
      const tags = productForm.tagsInput.split(",").map(t => t.trim()).filter(Boolean);
      const success = await onAddProduct({
        title: productForm.title,
        titleSw: productForm.title,
        description: productForm.description,
        descriptionSw: productForm.description,
        price: Number(productForm.price),
        category: productForm.category,
        sellerId: currentUser.id,
        sellerName: currentUser.name,
        stock: Number(productForm.stock),
        images: [productForm.selectedImage],
        condition: productForm.condition,
        size: productForm.size,
        color: productForm.color,
        deliveryOptions: productForm.deliveryOptions,
        tags,
        status: productForm.status
      });

      if (success) {
        setFormSuccess(
          productForm.status === "pending"
            ? (isSwahili ? "Hongera! Bidhaa imewasilishwa na inasubiri kuidhinishwa na msimamizi." : "Success! Your product is uploaded and pending admin approval.")
            : (isSwahili ? "Bidhaa imehifadhiwa kama rasimu (Draft) kikamilifu." : "Draft saved successfully.")
        );
        // Reset Form
        setProductForm({
          title: "",
          category: "Traditional Vitenge",
          description: "",
          price: "",
          stock: "5",
          condition: "New",
          size: "6 Yards",
          color: "Multicolor",
          deliveryOptions: "Store Pickup, Courier Delivery",
          tagsInput: "BuyerPost, Traditional, Cotton",
          selectedImage: PRESET_FABRIC_IMAGES[0],
          status: "pending"
        });
        setTimeout(() => {
          setShowAddForm(false);
          setFormSuccess("");
        }, 3000);
      } else {
        setFormError(isSwahili ? "Imeshindwa kupost bidhaa!" : "Failed to post product!");
      }
    } catch (err) {
      setFormError(isSwahili ? "Hitilafu imetokea wakati wa kupost!" : "Error occurred during upload!");
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    onSendMessage(selectedReceiver, chatInput);
    setChatInput("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
      
      {/* Buyer Cover / Header summary block */}
      <div className={`p-6 rounded-2xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors ${
        isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-800"
      }`}>
        <div className="flex items-center gap-4">
          <span className="text-4xl bg-yellow-500/10 p-3.5 rounded-2xl border border-yellow-500/20">👗</span>
          <div>
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              <span>{isSwahili ? "Dashibodi ya Mnunuzi" : "Buyer Workspace"}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-yellow-500/15 text-yellow-500 uppercase">
                {currentUser.role}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isSwahili 
                ? "Dhibiti wasifu wako, pakia bidhaa, na fuatilia maagizo yako yote ya Vitenge sehemu moja." 
                : "Manage profile, post products, and monitor your authentic Tanzanian fabric purchases."}
            </p>
          </div>
        </div>

        {/* Quick action button for posting a product */}
        <button
          onClick={() => {
            setActiveTab("products");
            setShowAddForm(!showAddForm);
          }}
          className="bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md hover:scale-105 flex items-center gap-1.5 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{showAddForm ? (isSwahili ? "Funga Fomu" : "Close Form") : (isSwahili ? "Sajili Bidhaa Mpya" : "Post Product To Soko")}</span>
        </button>
      </div>

      {/* DASHBOARD TAB NAVIGATION BAR */}
      <div className="flex flex-wrap border-b border-slate-800/15 gap-1.5">
        {[
          { id: "profile", label: isSwahili ? "Wasifu Wangu" : "My Profile", icon: UserIcon },
          { id: "products", label: isSwahili ? "Bidhaa Zangu" : "My Products", icon: Tag },
          { id: "images", label: isSwahili ? "Usimamizi wa Picha" : "Manage Images", icon: Image },
          { id: "orders", label: isSwahili ? "Maagizo Yangu" : "My Orders", icon: ShoppingBag },
          { id: "messages", label: isSwahili ? "Ujumbe" : "Messages", icon: MessageSquare },
          { id: "notifications", label: isSwahili ? "Arifa" : "Notifications", icon: Bell },
          { id: "settings", label: isSwahili ? "Mipangilio" : "Settings", icon: SettingsIcon },
        ].map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id !== "products") setShowAddForm(false);
              }}
              className={`px-4 py-3 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border-b-2 ${
                activeTab === tab.id
                  ? "border-yellow-500 text-yellow-500 bg-yellow-500/5 font-black"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-yellow-500/5"
              }`}
            >
              <IconComponent className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.id === "notifications" && userNotifications.length > 0 && (
                <span className="bg-yellow-500 text-slate-950 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {userNotifications.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENTS CONTAINER */}
      <div className="min-h-96">
        
        {/* TAB 1: MY PROFILE */}
        {activeTab === "profile" && (
          <MyAccount 
            isSwahili={isSwahili}
            isDarkMode={isDarkMode}
            currentUser={currentUser}
            onUpdateUser={onUpdateUser}
            onRefreshLogs={onRefreshLogs}
          />
        )}

        {/* TAB 1.5: IMAGE MANAGEMENT HUB */}
        {activeTab === "images" && (
          <div className="space-y-8 animate-fade-in">
            {/* Header / Instructions */}
            <div className={`p-6 rounded-2xl border transition-colors ${
              isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-800"
            }`}>
              <h3 className="text-base font-black tracking-tight flex items-center gap-2 text-yellow-500">
                <Image className="w-5 h-5 animate-pulse" />
                <span>{isSwahili ? "Usimamizi wa Wasifu na Picha za Bidhaa" : "Profile & Product Images Manager"}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isSwahili 
                  ? "Boresha picha yako ya wasifu au dhibiti albamu za picha za bidhaa zako kwa kutumia buruta na udondoshe." 
                  : "Upload, replace, delete, rearrange, or crop your profile picture and product photos securely with live drag & drop support."}
              </p>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* PANEL A: PROFILE PICTURE MANAGEMENT */}
              <div className={`p-6 rounded-2xl border space-y-6 ${
                isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100"
              }`}>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 border-b border-slate-800/10 pb-2">
                  <span>👤</span>
                  <span>{isSwahili ? "Picha ya Wasifu (Avatar)" : "Profile Avatar Picture"}</span>
                </h4>

                {/* Profile Pic Display and controls */}
                <div className="flex flex-col items-center justify-center space-y-4 py-4">
                  <div className="relative group">
                    {currentUser.avatar && currentUser.avatar.startsWith("http") ? (
                      <img 
                        src={currentUser.avatar} 
                        alt={currentUser.name} 
                        className="w-28 h-28 object-cover rounded-full border-4 border-yellow-500 shadow-xl"
                      />
                    ) : (
                      <div className="w-28 h-28 bg-slate-800 rounded-full border-4 border-slate-700 flex items-center justify-center text-4xl shadow-xl">
                        {currentUser.avatar || "👩🏾‍💼"}
                      </div>
                    )}
                    {currentUser.avatar && currentUser.avatar.startsWith("http") && (
                      <button
                        onClick={handleProfilePicDelete}
                        className="absolute -top-1 -right-1 bg-rose-500 text-white p-1.5 rounded-full hover:bg-rose-600 transition-all cursor-pointer shadow-md"
                        title={isSwahili ? "Futa picha ya wasifu" : "Delete profile picture"}
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  
                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-200">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{currentUser.email}</p>
                  </div>
                </div>

                {/* Upload Avatar Drag & Drop */}
                <div
                  onDragOver={e => { e.preventDefault(); setDragOverProfile(true); }}
                  onDragLeave={() => setDragOverProfile(false)}
                  onDrop={e => {
                    e.preventDefault();
                    setDragOverProfile(false);
                    const file = e.dataTransfer.files[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        alert(isSwahili ? "Kosa: Picha inazidi MB 5!" : "Error: Image size exceeds 5MB limit!");
                        return;
                      }
                      const r = new FileReader();
                      r.onload = () => handleProfilePicUpload(r.result as string);
                      r.readAsDataURL(file);
                    }
                  }}
                  className={`border-2 border-dashed p-4 rounded-xl text-center transition-all ${
                    dragOverProfile ? "border-yellow-500 bg-yellow-500/5" : "border-slate-800/20 bg-slate-950/10"
                  }`}
                >
                  <label className="cursor-pointer space-y-1 block">
                    <UploadCloud className="w-8 h-8 text-slate-500 mx-auto" />
                    <p className="text-[11px] text-slate-400 font-bold">
                      {isSwahili ? "Buruta hapa picha ya wasifu au bofya" : "Drag profile photo here, or click to browse"}
                    </p>
                    <p className="text-[9px] text-slate-500 font-mono">JPG, PNG, WEBP (Max 5MB)</p>
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
                          r.onload = () => handleProfilePicUpload(r.result as string);
                          r.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* PANEL B & C: PRODUCT GALLERIES & THUMBNAILS MODERATION */}
              <div className={`p-6 rounded-2xl border space-y-6 lg:col-span-2 ${
                isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100"
              }`}>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 border-b border-slate-800/10 pb-2">
                  <span>👗</span>
                  <span>{isSwahili ? "Usimamizi wa Albamu za Bidhaa Zangu" : "Product Gallery & Thumbnail Editor"}</span>
                </h4>

                {/* Product Dropdown Selector */}
                <div className="space-y-2">
                  <label className="text-[11px] text-slate-400 font-black block">{isSwahili ? "CHAGUA BIDHAA ILI KUONDA/KUHARIRI PICHA:" : "CHOOSE PRODUCT TO MANAGE:"}</label>
                  <select
                    value={selectedProductForImg}
                    onChange={e => {
                      setSelectedProductForImg(e.target.value);
                      setCroppingImage(null);
                    }}
                    className={`w-full text-xs p-3 rounded-xl border outline-none ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value="">-- {isSwahili ? "Chagua Bidhaa" : "Select Product"} --</option>
                    {products.filter(p => p.sellerId === currentUser.id).map(prod => (
                      <option key={prod.id} value={prod.id}>{prod.title} (Price: TZS {prod.price})</option>
                    ))}
                  </select>
                </div>

                {/* If product is selected, show its photos with full actions */}
                {selectedProductForImg ? (() => {
                  const prod = products.find(p => p.id === selectedProductForImg);
                  if (!prod) return null;
                  const gallery = prod.images || [];

                  return (
                    <div className="space-y-6">
                      
                      {/* Interactive Drag and Drop Upload for Selected Product */}
                      <div
                        onDragOver={e => { e.preventDefault(); setDragOverProduct(true); }}
                        onDragLeave={() => setDragOverProduct(false)}
                        onDrop={e => {
                          e.preventDefault();
                          setDragOverProduct(false);
                          const file = e.dataTransfer.files[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              alert(isSwahili ? "Kosa: Picha inazidi MB 5!" : "Error: Image size exceeds 5MB limit!");
                              return;
                            }
                            const r = new FileReader();
                            r.onload = () => handleProductImageUpload(prod.id, r.result as string);
                            r.readAsDataURL(file);
                          }
                        }}
                        className={`border-2 border-dashed p-6 rounded-xl text-center transition-all ${
                          dragOverProduct ? "border-yellow-500 bg-yellow-500/5 animate-pulse" : "border-slate-800/20 bg-slate-950/10"
                        }`}
                      >
                        <label className="cursor-pointer space-y-1 block">
                          <UploadCloud className="w-10 h-10 text-yellow-500 mx-auto animate-bounce" />
                          <p className="text-xs text-slate-300 font-black">
                            {isSwahili ? `Sajili Picha mpya kwenye Albamu ya ${prod.title}` : `Upload new picture to ${prod.title}`}
                          </p>
                          <p className="text-[10px] text-slate-500">{isSwahili ? "Buruta au bofya kuchagua picha (JPEG, PNG, WEBP max 5MB)" : "Drag & drop file or browse (JPEG, PNG, WEBP max 5MB)"}</p>
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
                                r.onload = () => handleProductImageUpload(prod.id, r.result as string);
                                r.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>

                      {/* Photo Grid with Replace, Rearrange, Crop & Delete buttons */}
                      <p className="text-[11px] font-black uppercase text-yellow-500 tracking-wide">{isSwahili ? "PICHA ZILIZOPO KWENYE ALBAMU:" : "ACTIVE PRODUCT IMAGES:"}</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {gallery.map((imgUrl, idx) => (
                          <div key={`${prod.id}_gal_${idx}`} className="p-3 rounded-xl bg-slate-950/25 border border-slate-800/10 space-y-3 relative">
                            {/* Visual index label */}
                            <span className="absolute top-2 left-2 bg-slate-950/80 text-white font-mono text-[9px] px-1.5 py-0.5 rounded font-black">
                              {idx === 0 ? (isSwahili ? "KIKUU (Primary)" : "THUMBNAIL") : `${isSwahili ? "PICHA YA" : "GALLERY"} #${idx}`}
                            </span>

                            <img src={imgUrl} alt={prod.title} className="w-full h-32 object-cover rounded-lg border border-slate-800/10" />
                            
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              {/* Crop / Edit Trigger */}
                              <button
                                onClick={() => setCroppingImage({ productId: prod.id, imageUrl: imgUrl, rotation: 0, scale: 1 })}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-1 px-2 rounded flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Crop className="w-3.5 h-3.5" />
                                <span>{isSwahili ? "Kata (Crop)" : "Crop & Rotate"}</span>
                              </button>

                              {/* Rearrange: move thumbnail position forward/backward */}
                              <button
                                onClick={async () => {
                                  if (gallery.length <= 1) return;
                                  const updated = [...gallery];
                                  const nextIdx = (idx + 1) % gallery.length;
                                  // Swap images
                                  const tmp = updated[idx];
                                  updated[idx] = updated[nextIdx];
                                  updated[nextIdx] = tmp;

                                  const saveRes = await fetch(`/api/products/${prod.id}`, {
                                    method: "PUT",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ images: updated })
                                  });
                                  if (saveRes.ok) {
                                    onRefreshLogs();
                                    alert(isSwahili ? "Nafasi ya picha imebadilishwa kikamilifu!" : "Thumbnail order rearranged successfully!");
                                  }
                                }}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-1 px-2 rounded flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <RotateCw className="w-3.5 h-3.5" />
                                <span>{isSwahili ? "Badilisha Mpangilio" : "Rearrange"}</span>
                              </button>

                              {/* Delete Image button */}
                              <button
                                onClick={() => handleProductImageDelete(prod.id, imgUrl)}
                                className="col-span-2 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 font-bold py-1.5 px-2 rounded flex items-center justify-center gap-1 cursor-pointer transition-all"
                              >
                                <Trash className="w-3.5 h-3.5" />
                                <span>{isSwahili ? "Futa Picha Hii" : "Delete Image"}</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  );
                })() : (
                  <p className="text-xs text-slate-500 italic text-center py-8">{isSwahili ? "Tafadhali chagua bidhaa hapo juu ili kuongeza au kufuta picha." : "Please select one of your products above to upload, delete, rearrange, or crop its photos."}</p>
                )}

              </div>

            </div>

            {/* CROPPING SIMULATOR MODAL PANEL */}
            {croppingImage && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800/30 pb-3">
                    <span className="text-xs font-black uppercase text-yellow-500 flex items-center gap-1">
                      <Crop className="w-4 h-4" />
                      <span>{isSwahili ? "Uhariri na Upunguzaji wa Picha" : "Simulated Crop & Rotate Studio"}</span>
                    </span>
                    <button onClick={() => setCroppingImage(null)} className="text-slate-400 hover:text-white font-bold">✕</button>
                  </div>

                  {/* Crop Stage */}
                  <div className="bg-slate-950 rounded-xl p-6 overflow-hidden flex items-center justify-center min-h-[220px]">
                    <img 
                      src={croppingImage.imageUrl} 
                      alt="Cropping Preview" 
                      style={{
                        transform: `rotate(${croppingImage.rotation}deg) scale(${croppingImage.scale})`,
                        transition: "transform 0.15s ease-out"
                      }}
                      className="max-h-40 rounded border border-slate-800 shadow-2xl" 
                    />
                  </div>

                  {/* Controls */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 flex justify-between">
                        <span>{isSwahili ? "Mzunguko (Rotation):" : "Rotation Angle:"}</span>
                        <span className="font-mono text-yellow-500">{croppingImage.rotation}°</span>
                      </label>
                      <input 
                        type="range" 
                        min="0" 
                        max="360" 
                        step="90" 
                        value={croppingImage.rotation}
                        onChange={e => setCroppingImage({ ...croppingImage, rotation: parseInt(e.target.value) })}
                        className="w-full accent-yellow-500 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 flex justify-between">
                        <span>{isSwahili ? "Ukubwa (Zoom / Scale):" : "Zoom scale:"}</span>
                        <span className="font-mono text-yellow-500">{croppingImage.scale}x</span>
                      </label>
                      <input 
                        type="range" 
                        min="1" 
                        max="2" 
                        step="0.1" 
                        value={croppingImage.scale}
                        onChange={e => setCroppingImage({ ...croppingImage, scale: parseFloat(e.target.value) })}
                        className="w-full accent-yellow-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Save/Close */}
                  <div className="flex gap-3 justify-end pt-2">
                    <button
                      onClick={() => setCroppingImage(null)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-bold cursor-pointer"
                    >
                      {isSwahili ? "Ghairi" : "Cancel"}
                    </button>
                    <button
                      onClick={handleSaveCrop}
                      className="px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-xs text-slate-950 font-black flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isSwahili ? "Hifadhi Picha iliyokatwa" : "Save Cropped Photo"}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* General progress notification */}
            {imgUploadProgress && (
              <div className="fixed bottom-4 right-4 bg-yellow-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-black shadow-xl animate-pulse z-50">
                {imgUploadProgress}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY PRODUCTS (WITH POSTING FORM) */}
        {activeTab === "products" && (
          <div className="space-y-6">
            {showAddForm ? (
              /* BUYER PRODUCT POSTING FORM */
              <form onSubmit={handleProductSubmit} className={`p-6 sm:p-8 rounded-2xl border space-y-6 max-w-3xl mx-auto ${
                isDarkMode ? "bg-slate-900/60 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-800"
              }`}>
                <div className="flex items-center justify-between border-b border-slate-800/10 pb-3">
                  <div className="flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-yellow-500" />
                    <h3 className="text-base font-bold uppercase tracking-wider">{isSwahili ? "Sajili Bidhaa yako Sokoni" : "Post Fabric Product to Marketplace"}</h3>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setShowAddForm(false)} 
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                {formError && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4.5 h-4.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {formSuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4.5 h-4.5" />
                    <span>{formSuccess}</span>
                  </div>
                )}

                {/* FORM INPUTS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">{isSwahili ? "Jina la Bidhaa" : "Product Name"} *</label>
                    <input 
                      type="text"
                      placeholder={isSwahili ? "Mf. Kitenge cha Nta ya Kwanza cha Morogoro" : "e.g. Authentic Handwoven Morogoro Kitenge"}
                      value={productForm.title}
                      onChange={e => setProductForm(p => ({ ...p, title: e.target.value }))}
                      className="w-full text-xs p-3 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-yellow-500"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">{isSwahili ? "Kundi la Bidhaa" : "Product Category"}</label>
                    <select
                      value={productForm.category}
                      onChange={e => setProductForm(p => ({ ...p, category: e.target.value }))}
                      className="w-full text-xs p-3 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-yellow-500"
                    >
                      {FABRIC_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">{isSwahili ? "Bei ya Bidhaa (TSh)" : "Product Price (TSh)"} *</label>
                    <input 
                      type="number"
                      placeholder="e.g. 25000"
                      value={productForm.price}
                      onChange={e => setProductForm(p => ({ ...p, price: e.target.value }))}
                      className="w-full text-xs p-3 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-yellow-500"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">{isSwahili ? "Kiasi Kilichopo (Stock)" : "Quantity Available (Stock)"} *</label>
                    <input 
                      type="number"
                      placeholder="e.g. 10"
                      value={productForm.stock}
                      onChange={e => setProductForm(p => ({ ...p, stock: e.target.value }))}
                      className="w-full text-xs p-3 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-yellow-500"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">{isSwahili ? "Hali ya Bidhaa" : "Product Condition"}</label>
                    <select
                      value={productForm.condition}
                      onChange={e => setProductForm(p => ({ ...p, condition: e.target.value }))}
                      className="w-full text-xs p-3 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-yellow-500"
                    >
                      <option value="New">{isSwahili ? "Mpya kabisa (New)" : "Brand New"}</option>
                      <option value="Refurbished">{isSwahili ? "Iliyofanyiwa marekebisho" : "Refurbished / Tailored"}</option>
                      <option value="Used">{isSwahili ? "Imetumika (Used)" : "Pre-owned / Vintage"}</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">{isSwahili ? "Vipimo (Size)" : "Product Size"}</label>
                    <input 
                      type="text"
                      placeholder="e.g. 6 Yards, 12 Yards"
                      value={productForm.size}
                      onChange={e => setProductForm(p => ({ ...p, size: e.target.value }))}
                      className="w-full text-xs p-3 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-yellow-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">{isSwahili ? "Rangi Kuu" : "Product Color"}</label>
                    <input 
                      type="text"
                      placeholder="e.g. Blue Gold, Yellow Navy, Red Black"
                      value={productForm.color}
                      onChange={e => setProductForm(p => ({ ...p, color: e.target.value }))}
                      className="w-full text-xs p-3 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-yellow-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">{isSwahili ? "Chaguzi za Usafirishaji" : "Delivery Options"}</label>
                    <input 
                      type="text"
                      placeholder="e.g. Store Pickup, Courier, Bodaboda delivery"
                      value={productForm.deliveryOptions}
                      onChange={e => setProductForm(p => ({ ...p, deliveryOptions: e.target.value }))}
                      className="w-full text-xs p-3 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">{isSwahili ? "Maelezo ya Bidhaa" : "Product Description"} *</label>
                  <textarea 
                    placeholder={isSwahili ? "Andika maelezo marefu na mazuri ya Kitenge chako..." : "Describe the pattern, cotton blend, cultural significance, weight..."}
                    value={productForm.description}
                    onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))}
                    rows={3}
                    className="w-full text-xs p-3 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-yellow-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">{isSwahili ? "Lebo (Tags) tenganisha kwa mkato" : "Product Tags (comma separated)"}</label>
                  <input 
                    type="text"
                    placeholder="e.g. Traditional, Wedding, Wax, Golden"
                    value={productForm.tagsInput}
                    onChange={e => setProductForm(p => ({ ...p, tagsInput: e.target.value }))}
                    className="w-full text-xs p-3 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>

                {/* PRESET IMAGE SELECTOR */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase block">{isSwahili ? "Chagua Muundo/Picha ya Kitenge:" : "Select Kitenge Fabric Pattern Design:"}</label>
                  <div className="grid grid-cols-4 gap-2">
                    {PRESET_FABRIC_IMAGES.map((img, i) => (
                      <button
                        key={img}
                        type="button"
                        onClick={() => setProductForm(p => ({ ...p, selectedImage: img }))}
                        className={`relative rounded-lg overflow-hidden border-2 h-14 transition-all ${
                          productForm.selectedImage === img ? "border-yellow-500 scale-105" : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img src={img} alt="Kitenge preset pattern" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 right-1 bg-slate-950/70 text-[8px] text-white px-1 rounded">Pattern {i+1}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* STATUS ON SUBMISSION */}
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/30 flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block">{isSwahili ? "Hali ya Kuwasilisha" : "Submission Destination"}</label>
                    <p className="text-[10px] text-slate-500">
                      {isSwahili 
                        ? "Chagua kuwasilisha moja kwa moja msimamizi aidhinishe au uhifadhi kama rasimu kwanza." 
                        : "Submit immediately to admin queue or save locally as an offline draft."}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setProductForm(p => ({ ...p, status: "draft" }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        productForm.status === "draft" 
                          ? "bg-slate-800 text-yellow-500 border border-yellow-500/40" 
                          : "bg-slate-950 text-slate-500"
                      }`}
                    >
                      {isSwahili ? "Rasimu" : "Draft"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductForm(p => ({ ...p, status: "pending" }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        productForm.status === "pending" 
                          ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/40" 
                          : "bg-slate-950 text-slate-500"
                      }`}
                    >
                      {isSwahili ? "Kuidhinishwa" : "Submit"}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/20">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                  >
                    {isSwahili ? "Ghairi" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingProduct}
                    className="bg-yellow-500 hover:bg-yellow-600 text-slate-950 text-xs font-black px-6 py-2 rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    <span>{isSubmittingProduct ? (isSwahili ? "Inatuma..." : "Uploading...") : (isSwahili ? "Wasilisha Sasa" : "Upload Product")}</span>
                  </button>
                </div>
              </form>
            ) : (
              /* BUYER PRODUCT LISTING */
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-yellow-500" />
                    <span>{isSwahili ? "Mkusanyiko wa Bidhaa Zangu" : "My Uploaded Fabrics"}</span>
                  </h3>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="text-xs font-bold text-yellow-500 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isSwahili ? "Sajili Mpya" : "Add New Listing"}</span>
                  </button>
                </div>

                {buyerProducts.length === 0 ? (
                  <div className="text-center py-12 rounded-2xl border border-dashed border-slate-800 text-slate-500">
                    <Info className="w-10 h-10 mx-auto mb-2 text-slate-600 animate-pulse" />
                    <p className="text-sm font-bold">{isSwahili ? "Hujapakia bidhaa bado" : "You haven't posted any products yet"}</p>
                    <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                      {isSwahili 
                        ? "Kama Mnunuzi (Buyer), una uwezo wa kupost Vitenge unavyotaka kuuza pia! Bonyeza kitufe hapo juu kuanza."
                        : "As a Buyer account, you are also empowered to publish your fabric offers. Hit 'Add New Listing' to start!"}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {buyerProducts.map(p => (
                      <div key={p.id} className={`p-4 rounded-xl border flex flex-col justify-between transition-colors ${
                        isDarkMode ? "bg-slate-900/40 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-800"
                      }`}>
                        <div>
                          <div className="relative rounded-lg overflow-hidden h-32 mb-3 bg-slate-950">
                            <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                            <div className="absolute top-2 right-2">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border shadow ${
                                p.status === "published" 
                                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                                  : p.status === "rejected"
                                  ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                                  : p.status === "draft"
                                  ? "bg-slate-700/30 text-slate-400 border-slate-700/40"
                                  : "bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse"
                              }`}>
                                {p.status || "pending"}
                              </span>
                            </div>
                          </div>

                          <h4 className="font-bold text-sm tracking-tight">{p.title}</h4>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{p.category}</p>
                          <p className="text-xs text-slate-400 mt-2 line-clamp-2">{p.description}</p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-800/10 flex justify-between items-center">
                          <span className="text-sm font-bold text-yellow-500">{p.price.toLocaleString()} TSh</span>
                          <span className="text-[10px] text-slate-500 font-mono">Stock: {p.stock} pcs</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MY ORDERS */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-yellow-500" />
              <span>{isSwahili ? "Orodha ya Maagizo Yangu" : "My Orders History"}</span>
            </h3>

            {buyerOrders.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border border-dashed border-slate-800 text-slate-500">
                <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                <p className="text-xs font-bold">{isSwahili ? "Hakuna maagizo yaliyosajiliwa" : "No orders found in your account"}</p>
                <button 
                  onClick={() => setViewMode("marketplace")}
                  className="mt-3 text-xs bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-3.5 py-1.5 rounded-xl font-bold hover:bg-yellow-500/20 cursor-pointer"
                >
                  {isSwahili ? "Nenda Sokoni Kununua" : "Browse Marketplace"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {buyerOrders.map(o => (
                  <div key={o.id} className={`p-5 rounded-2xl border space-y-4 transition-colors ${
                    isDarkMode ? "bg-slate-900/40 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-800"
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/10 pb-3 gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-yellow-500 font-bold block">ORDER #{o.id.toUpperCase()}</span>
                        <span className="text-xs text-slate-400">{new Date(o.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase font-mono ${
                          o.backendStatus === "Delivered" 
                            ? "bg-emerald-500/20 text-emerald-400" 
                            : o.backendStatus === "Cancelled"
                            ? "bg-rose-500/20 text-rose-400"
                            : "bg-amber-500/20 text-amber-400 animate-pulse"
                        }`}>
                          Backend: {o.backendStatus}
                        </span>
                        <span className="bg-yellow-500/10 text-yellow-500 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase font-mono">
                          Sync: {o.frontendStatus}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {o.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-slate-300 font-medium">
                            {item.productTitle} <span className="text-slate-500">x{item.quantity}</span>
                          </span>
                          <span className="font-mono text-slate-300">{(item.price * item.quantity).toLocaleString()} TSh</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-slate-800/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                      <div className="flex flex-wrap gap-4 text-slate-400 font-mono text-[10px]">
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Pay: {o.paymentMethod}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Ship: {o.shippingAddress}</span>
                        </span>
                      </div>
                      <div className="font-bold text-sm text-yellow-500">
                        {isSwahili ? "Jumla Kuu" : "Grand Total"}: {o.totalAmount.toLocaleString()} TSh
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MESSAGES */}
        {activeTab === "messages" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* SENDER SELECTOR PANEL */}
            <div className={`p-4 rounded-2xl border space-y-3 ${
              isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-100"
            }`}>
              <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">{isSwahili ? "Zungumza Na:" : "Start Chat with:"}</h4>
              <div className="space-y-1.5">
                {[
                  { id: "u_seller_kamala", name: "Kamala Vitenge Store", avatar: "🏬" },
                  { id: "u_seller_mangi", name: "Mangi Fabrics EA", avatar: "🏢" },
                  { id: "u_admin", name: "ALLEN DREAMER77 (Admin)", avatar: "👑" },
                ].map(seller => (
                  <button
                    key={seller.id}
                    onClick={() => setSelectedReceiver(seller.id)}
                    className={`w-full text-left p-3 rounded-xl text-xs flex items-center gap-2.5 transition-all cursor-pointer ${
                      selectedReceiver === seller.id 
                        ? "bg-yellow-500 text-slate-950 font-bold" 
                        : "hover:bg-yellow-500/10 text-slate-300"
                    }`}
                  >
                    <span className="text-lg">{seller.avatar}</span>
                    <span>{seller.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* CONVERSATION BOX */}
            <div className={`col-span-2 p-5 rounded-2xl border flex flex-col justify-between min-h-96 ${
              isDarkMode ? "bg-slate-900/30 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-800"
            }`}>
              <div className="border-b border-slate-800/10 pb-3">
                <span className="text-xs font-bold text-yellow-500 uppercase tracking-widest font-mono">
                  Active Conversation with Vendor / Msaidizi
                </span>
              </div>

              {/* MESSAGE BALLOONS */}
              <div className="flex-1 overflow-y-auto space-y-3 py-4 max-h-72 font-sans">
                {chatMessages.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-12">
                    {isSwahili ? "Hakuna ujumbe uliopita. Tuma ujumbe kuanza mazungumzo." : "No previous messages. Type below to start talking."}
                  </p>
                ) : (
                  chatMessages.map(m => (
                    <div 
                      key={m.id} 
                      className={`flex flex-col max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                        m.senderId === currentUser.id 
                          ? "ml-auto bg-yellow-500 text-slate-950 rounded-tr-none" 
                          : "bg-slate-950 text-slate-200 border border-slate-800 rounded-tl-none"
                      }`}
                    >
                      <span className="font-bold text-[9px] opacity-75 mb-1">{m.senderName}</span>
                      <p>{m.content}</p>
                      <span className="text-[8px] opacity-60 text-right mt-1 font-mono">{new Date(m.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))
                )}
              </div>

              {/* CHAT INPUT FORM */}
              <form onSubmit={handleSendChat} className="flex gap-2 pt-3 border-t border-slate-800/10">
                <input 
                  type="text"
                  placeholder={isSwahili ? "Andika ujumbe wako..." : "Type your message to store owner..."}
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  className="flex-1 text-xs p-3 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-yellow-500"
                />
                <button
                  type="submit"
                  className="bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold text-xs px-5 rounded-xl transition-colors cursor-pointer"
                >
                  {isSwahili ? "Tuma" : "Send"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 5: NOTIFICATIONS */}
        {activeTab === "notifications" && (
          <div className="space-y-4 max-w-2xl mx-auto">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Bell className="w-4.5 h-4.5 text-yellow-500" />
              <span>{isSwahili ? "Mifumo ya Arifa Zako" : "Alerts & Profile Activity Events"}</span>
            </h3>

            {userNotifications.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border border-dashed border-slate-800 text-slate-500">
                <Bell className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                <p className="text-xs font-bold">{isSwahili ? "Hakuna arifa mpya" : "No alert notifications logged"}</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {userNotifications.map(n => (
                  <div key={n.id} className={`p-4 rounded-xl border transition-colors ${
                    isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100"
                  }`}>
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-xs text-yellow-500">{isSwahili ? n.titleSw : n.title}</h4>
                      <span className="text-[9px] text-slate-500 font-mono">{new Date(n.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1.5">{isSwahili ? n.messageSw : n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: SETTINGS */}
        {activeTab === "settings" && (
          <div className={`p-6 sm:p-8 rounded-2xl border space-y-6 max-w-2xl mx-auto ${
            isDarkMode ? "bg-slate-900/40 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-800"
          }`}>
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">{isSwahili ? "Mipangilio ya Dashibodi" : "Dashboard Preferences"}</h3>
            
            <div className="space-y-4 font-sans text-xs">
              <div className="p-4 rounded-xl bg-slate-950/20 border border-slate-800/10 space-y-2">
                <span className="font-bold block text-slate-300">{isSwahili ? "Maelezo ya Jukumu" : "Workspace Capabilities"}</span>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  {isSwahili 
                    ? "Kama Mnunuzi (Buyer), umepewa jukumu salama la kupost bidhaa na kuziwasilisha kwa msimamizi (ALLEN DREAMER77) kuzikagua kwa ajili ya usalama wa soko." 
                    : "As a Buyer account, you have advanced permission to create marketplace listings, which go to the Administrator queue to guarantee secure trading."}
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
