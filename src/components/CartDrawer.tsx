/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { X, Trash2, Tag, ShieldCheck, ShoppingCart, Send, WifiOff, Check } from "lucide-react";
import { Product, ProductVariation, Coupon } from "../types";

interface CartItem {
  id: string; // productId + variationId
  product: Product;
  variation: ProductVariation;
  quantity: number;
}

interface CartDrawerProps {
  isSwahili: boolean;
  isDarkMode: boolean;
  isOnline: boolean;
  cart: CartItem[];
  coupons: Coupon[];
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onCheckout: (shippingDetails: {
    name: string;
    phone: string;
    email: string;
    address: string;
    paymentMethod: string;
    shippingRegion: string;
    couponCode?: string;
    discountAmount: number;
  }) => void;
  onClose: () => void;
}

export default function CartDrawer({
  isSwahili,
  isDarkMode,
  isOnline,
  cart,
  coupons,
  onRemoveItem,
  onClearCart,
  onCheckout,
  onClose
}: CartDrawerProps) {
  const [couponCode, setCouponCode] = useState("");
  const [activeDiscount, setActiveDiscount] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");
  
  // Checkout details
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [shippingRegion, setShippingRegion] = useState("Dar es Salaam");
  const [paymentMethod, setPaymentMethod] = useState("M-Pesa");
  const [isOrderSubmitted, setIsOrderSubmitted] = useState(false);

  // Subtotals
  const cartSubtotal = cart.reduce((acc, item) => {
    const base = item.product.price + item.variation.priceModifier;
    return acc + (base * item.quantity);
  }, 0);

  // Shipping cost rules
  const getShippingCost = (region: string) => {
    switch (region) {
      case "Dar es Salaam": return 3000;
      case "Morogoro":
      case "Arusha":
      case "Mwanza": return 7000;
      case "East Africa": return 15000;
      default: return 5000;
    }
  };

  const shippingCost = cart.length > 0 ? getShippingCost(shippingRegion) : 0;
  
  const discountAmount = activeDiscount 
    ? Math.round((cartSubtotal * activeDiscount.discountPercent) / 100)
    : 0;

  const totalAmount = cartSubtotal + shippingCost - discountAmount;

  const handleApplyCoupon = () => {
    const matched = coupons.find(c => c.code.toUpperCase() === couponCode.trim().toUpperCase());
    if (matched) {
      setActiveDiscount(matched);
      setCouponError("");
    } else {
      setCouponError(isSwahili ? "Kuponi si sahihi" : "Invalid coupon code");
      setActiveDiscount(null);
    }
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || !name || !phone || !address) return;

    onCheckout({
      name,
      phone,
      email,
      address,
      paymentMethod,
      shippingRegion,
      couponCode: activeDiscount?.code,
      discountAmount
    });

    setIsOrderSubmitted(true);
    onClearCart();
    setTimeout(() => {
      setIsOrderSubmitted(false);
      onClose();
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      {/* Outside close tap area */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

      <div className={`relative w-full max-w-md h-full flex flex-col justify-between shadow-2xl transition-colors duration-300 border-l border-amber-500/20 z-10 ${
        isDarkMode ? "bg-slate-900 text-white" : "bg-white text-slate-800"
      }`}>
        
        {/* Header */}
        <div className="p-4 border-b border-slate-700/10 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-sm uppercase tracking-wide">
              {isSwahili ? "Kikapu chako cha Ununuzi" : "Your Shopping Cart"} ({cart.length})
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success order placement screens */}
        {isOrderSubmitted ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-500/40">
              <Check className="w-10 h-10" />
            </div>
            <h3 className="font-bold text-base text-emerald-500">
              {isSwahili ? "Agizo Limepokelewa!" : "Order Received Successfully!"}
            </h3>
            <p className="text-xs text-slate-400">
              {isOnline 
                ? (isSwahili ? "Agizo lako limetumwa kikamilifu kwenye mfumo wetu salama. Miamala imethibitishwa." : "Your order has been synced securely to our cloud database.")
                : (isSwahili ? "Uko offline! Agizo limehifadhiwa kama DRAFT kwenye kifaa chako. Litasawazishwa ukirudi mtandaoni." : "You are currently offline. Your order is drafted locally and will sync once you connect to network.")}
            </p>
          </div>
        ) : (
          /* Main content flow */
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            
            {/* Cart item listing */}
            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <ShoppingCart className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs">{isSwahili ? "Kikapu chako kiko tupu." : "Your shopping cart is empty."}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => {
                  const itemPrice = item.product.price + item.variation.priceModifier;
                  return (
                    <div 
                      key={item.id} 
                      className={`p-3 rounded-xl border flex justify-between items-center gap-3 transition-colors ${
                        isDarkMode ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-100"
                      }`}
                    >
                      <img src={item.product.images[0]} alt={item.product.title} referrerPolicy="no-referrer" className="w-10 h-10 object-cover rounded-lg shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-bold text-xs line-clamp-1">
                          {isSwahili ? item.product.titleSw : item.product.title}
                        </h4>
                        <span className="text-[10px] text-amber-500 font-mono">
                          {item.variation.name} | Qty: {item.quantity}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold font-mono">{(itemPrice * item.quantity).toLocaleString()} TSh</span>
                        <button 
                          onClick={() => onRemoveItem(item.id)}
                          className="block text-[10px] text-rose-500 hover:underline text-right ml-auto mt-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Subtotals & Coupon entry if items exist */}
            {cart.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-700/10">
                {/* Coupon entry */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    <span>{isSwahili ? "Weka Kuponi ya Punguzo:" : "Have a promo coupon?"}</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="e.g. VITENGE10, MANGISHEKHE"
                      className={`text-xs px-3 py-2 rounded-xl border focus:outline-hidden flex-1 ${
                        isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200"
                      }`}
                    />
                    <button 
                      onClick={handleApplyCoupon}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2 px-3 rounded-xl transition-all cursor-pointer"
                    >
                      {isSwahili ? "Weka" : "Apply"}
                    </button>
                  </div>
                  {activeDiscount && (
                    <p className="text-[10px] text-emerald-500 font-bold">
                      ✓ {isSwahili ? activeDiscount.descriptionSw : activeDiscount.description}
                    </p>
                  )}
                  {couponError && <p className="text-[10px] text-rose-500 font-bold">{couponError}</p>}
                </div>

                {/* Subtotals pricing list */}
                <div className="space-y-1.5 text-xs text-slate-400 font-mono">
                  <div className="flex justify-between">
                    <span>{isSwahili ? "Mkusanyiko mdogo" : "Subtotal"}:</span>
                    <span>{cartSubtotal.toLocaleString()} TSh</span>
                  </div>
                  {activeDiscount && (
                    <div className="flex justify-between text-emerald-500">
                      <span>{isSwahili ? "Punguzo" : "Discount"} ({activeDiscount.discountPercent}%):</span>
                      <span>-{discountAmount.toLocaleString()} TSh</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>{isSwahili ? "Usafirishaji" : "Shipping Cost"} ({shippingRegion}):</span>
                    <span>{shippingCost.toLocaleString()} TSh</span>
                  </div>
                  <hr className="border-slate-800/10" />
                  <div className="flex justify-between font-bold text-sm text-amber-500">
                    <span>{isSwahili ? "Jumla Kuu" : "Total Amount"}:</span>
                    <span>{totalAmount.toLocaleString()} TSh</span>
                  </div>
                </div>
              </div>
            )}

            {/* Secure checkout inputs */}
            {cart.length > 0 && (
              <form onSubmit={handleCheckoutSubmit} className="space-y-4 pt-4 border-t border-slate-700/10">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSwahili ? "Fanya Malipo kwa Usalama" : "Secure Payment & Shipping"}</span>
                </h4>

                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      placeholder={isSwahili ? "Jina lako Kamili" : "Your Full Name"}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className={`w-full text-xs px-3.5 py-2 rounded-xl border focus:outline-hidden ${
                        isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200"
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder={isSwahili ? "Namba ya Simu" : "Phone Number"}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className={`w-full text-xs px-3.5 py-2 rounded-xl border focus:outline-hidden ${
                        isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200"
                      }`}
                    />
                    <input
                      type="email"
                      placeholder={isSwahili ? "Barua Pepe" : "Email Address"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={`w-full text-xs px-3.5 py-2 rounded-xl border focus:outline-hidden ${
                        isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200"
                      }`}
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder={isSwahili ? "Anwani ya Usafirishaji (Mtaa/Nyumba)" : "Shipping Address (Street/House)"}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                      className={`w-full text-xs px-3.5 py-2 rounded-xl border focus:outline-hidden ${
                        isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200"
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">{isSwahili ? "Mkoa" : "Region"}</label>
                      <select
                        value={shippingRegion}
                        onChange={(e) => setShippingRegion(e.target.value)}
                        className={`w-full text-xs px-3.5 py-2 rounded-xl border focus:outline-hidden ${
                          isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200"
                        }`}
                      >
                        <option value="Dar es Salaam">Dar es Salaam</option>
                        <option value="Arusha">Arusha</option>
                        <option value="Mwanza">Mwanza</option>
                        <option value="Morogoro">Morogoro</option>
                        <option value="East Africa">East Africa (KE/UG)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">{isSwahili ? "Njia ya Malipo" : "Payment Method"}</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className={`w-full text-xs px-3.5 py-2 rounded-xl border focus:outline-hidden ${
                          isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200"
                        }`}
                      >
                        <option value="M-Pesa">M-Pesa 🇹🇿</option>
                        <option value="Tigo Pesa">Tigo Pesa 🇹🇿</option>
                        <option value="Airtel Money">Airtel Money 🇹🇿</option>
                        <option value="HaloPesa">HaloPesa 🇹🇿</option>
                        <option value="Credit Card">Credit/Debit Card</option>
                        <option value="PayPal">PayPal</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Submitting order disclaimer */}
                {!isOnline && (
                  <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-center gap-2 text-[10px] text-amber-500 leading-relaxed font-semibold">
                    <WifiOff className="w-4 h-4 text-amber-500" />
                    <span>{isSwahili ? "Njia ya Offline inatumika. Agizo litalindwa ndani ya IndexedDB kwanza." : "Offline queue active. Order will be cached securely locally first."}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer mt-4"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSwahili ? "Kamilisha Ununuzi kwa Usalama" : "Submit Secure Checkout Order"}</span>
                </button>
              </form>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
