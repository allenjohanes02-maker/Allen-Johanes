/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { X, Star, Check, ShoppingBag, ZoomIn, Sparkles, MessageSquare } from "lucide-react";
import { Product, ProductVariation, Review } from "../types";

interface ProductDetailModalProps {
  isSwahili: boolean;
  isDarkMode: boolean;
  product: Product;
  allProducts: Product[];
  reviews: Review[];
  onClose: () => void;
  onAddToCart: (product: Product, variation: ProductVariation, qty: number) => void;
  onAddReview: (productId: string, rating: number, comment: string) => void;
  onSelectProduct: (p: Product) => void;
}

export default function ProductDetailModal({
  isSwahili,
  isDarkMode,
  product,
  allProducts,
  reviews,
  onClose,
  onAddToCart,
  onAddReview,
  onSelectProduct
}: ProductDetailModalProps) {
  const [selectedVarId, setSelectedVarId] = useState<string>(product.variations[0]?.id || "");
  const [quantity, setQuantity] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  
  // Review form states
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [isReviewSubmitted, setIsReviewSubmitted] = useState(false);

  const productReviews = reviews.filter(r => r.productId === product.id);
  const activeVariation = product.variations.find(v => v.id === selectedVarId) || product.variations[0];
  const computedPrice = product.price + (activeVariation ? activeVariation.priceModifier : 0);

  // Related products query (same category, distinct product)
  const relatedProducts = allProducts.filter(p => p.category === product.category && p.id !== product.id).slice(0, 3);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return;
    onAddReview(product.id, rating, reviewText);
    setReviewText("");
    setIsReviewSubmitted(true);
    setTimeout(() => setIsReviewSubmitted(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className={`w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 border border-yellow-500/20 flex flex-col md:flex-row max-h-[92vh] md:max-h-[85vh] overflow-y-auto md:overflow-hidden ${
        isDarkMode ? "bg-slate-900 text-white" : "bg-white text-slate-800"
      }`}>
        
        {/* Left column - Images & Zoom */}
        <div className="w-full md:w-1/2 relative bg-slate-950 flex flex-col justify-center overflow-hidden h-72 md:h-auto">
          
          <img
            src={product.images[0]}
            alt={product.title}
            referrerPolicy="no-referrer"
            className={`w-full h-full object-cover transition-transform duration-300 ${
              isZoomed ? "scale-150 cursor-zoom-out" : "scale-100 cursor-zoom-in"
            }`}
            onClick={() => setIsZoomed(!isZoomed)}
          />

          <button 
            onClick={() => setIsZoomed(!isZoomed)}
            className="absolute bottom-4 right-4 bg-slate-900/80 hover:bg-slate-900 text-yellow-500 p-2.5 rounded-full flex items-center gap-1.5 text-xs font-semibold shadow-lg cursor-pointer transition-transform"
          >
            <ZoomIn className="w-4 h-4" />
            <span>{isZoomed ? (isSwahili ? "Punguza" : "Zoom Out") : (isSwahili ? "Kagua Karibu (Zoom)" : "Zoom Fabric")}</span>
          </button>

          {/* Banner Tag */}
          <span className="absolute top-4 left-4 bg-yellow-500 text-slate-950 font-bold text-[10px] uppercase px-3 py-1 rounded-full tracking-wider font-mono shadow-md">
            {isSwahili ? "Yadi 6 hadi 12" : "6 to 12 Yards"}
          </span>
        </div>

        {/* Right column - Copy & Interactivity */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto flex flex-col justify-between space-y-6">
          
          {/* Header */}
          <div>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-yellow-500 font-mono text-[10px] uppercase font-bold tracking-widest">{product.category}</span>
                <h3 className="text-lg md:text-xl font-bold font-display-serif tracking-tight mt-1 text-slate-900 dark:text-white">
                  {isSwahili ? product.titleSw : product.title}
                </h3>
              </div>
              <button 
                onClick={onClose} 
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Seller reference */}
            <p className="text-xs text-slate-400 mt-2">
              {isSwahili ? "Muuzaji:" : "Seller:"} <b className="text-yellow-500 dark:text-yellow-400 font-semibold">{product.sellerName}</b>
            </p>

            {/* Rating display */}
            <div className="flex items-center gap-1.5 mt-3">
              <div className="flex text-yellow-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? "fill-yellow-400" : "opacity-30"}`} />
                ))}
              </div>
              <span className="text-xs font-bold font-mono">({product.rating.toFixed(1)})</span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-500 underline">{productReviews.length} {isSwahili ? "Maoni ya wateja" : "Reviews"}</span>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-300 mt-4 leading-relaxed bg-slate-50/5 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-700/5">
              {isSwahili ? product.descriptionSw : product.description}
            </p>
          </div>

          {/* Pricing & Variations selection */}
          <div className="space-y-4">
            
            {/* Variations */}
            {product.variations.length > 0 && (
              <div>
                <span className="block text-xs font-bold text-slate-400 mb-2">{isSwahili ? "Chagua Upana (Yadi):" : "Select Fabric Length:"}</span>
                <div className="flex flex-wrap gap-2">
                  {product.variations.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVarId(v.id)}
                      className={`text-xs font-semibold py-2 px-4 rounded-xl border transition-all cursor-pointer ${
                        selectedVarId === v.id
                          ? "bg-yellow-500 text-slate-950 border-yellow-500 font-bold"
                          : "border-slate-700/20 text-slate-400 hover:bg-yellow-500/15"
                      }`}
                    >
                      {v.name} {v.priceModifier > 0 && `(+${v.priceModifier.toLocaleString()} TSh)`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Calculated Price & Qty selector */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-700/10">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-mono">{isSwahili ? "Bei ya Jumla" : "Total Price"}</span>
                <span className="text-2xl font-bold font-mono text-yellow-500">
                  {computedPrice.toLocaleString()} TSh
                </span>
              </div>

              {/* Quantity selector */}
              <div className="flex items-center gap-2 border border-slate-700/20 rounded-xl px-3 py-1.5">
                <button 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="font-bold text-lg text-slate-400 hover:text-white px-1 cursor-pointer"
                >
                  -
                </button>
                <span className="text-xs font-bold w-6 text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(q => q + 1)}
                  className="font-bold text-lg text-slate-400 hover:text-white px-1 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add To Cart trigger */}
            <button
              onClick={() => {
                onAddToCart(product, activeVariation, quantity);
                onClose();
              }}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold text-xs py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{isSwahili ? "Ongeza kwenye Kikapu" : "Add to Shopping Cart"}</span>
            </button>
          </div>

          {/* Related products slide */}
          {relatedProducts.length > 0 && (
            <div className="pt-4 border-t border-slate-700/10 space-y-2">
              <span className="block text-xs font-bold text-slate-400">{isSwahili ? "Vitenge Vinavyoendana:" : "Related Vitenge Fabrics:"}</span>
              <div className="grid grid-cols-3 gap-2">
                {relatedProducts.map((p) => (
                  <div 
                    key={p.id} 
                    onClick={() => {
                      onSelectProduct(p);
                      setSelectedVarId(p.variations[0]?.id || "");
                    }}
                    className="group cursor-pointer text-center space-y-1 bg-slate-50/5 p-2 rounded-xl border border-transparent hover:border-yellow-500/20"
                  >
                    <img src={p.images[0]} alt={p.title} referrerPolicy="no-referrer" className="w-full h-12 object-cover rounded-lg group-hover:scale-105 transition-transform" />
                    <span className="block text-[10px] font-bold line-clamp-1 group-hover:text-yellow-500 transition-colors">
                      {isSwahili ? p.titleSw : p.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews list & Write Review section */}
          <div className="pt-6 border-t border-slate-700/10 space-y-4">
            <h4 className="font-bold text-xs uppercase flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-yellow-500" />
              <span>{isSwahili ? "Maoni na Ukaguzi" : "Customer Reviews"} ({productReviews.length})</span>
            </h4>

            {/* Scrollable list */}
            <div className="space-y-3 max-h-36 overflow-y-auto pr-2">
              {productReviews.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic">
                  {isSwahili ? "Hakuna maoni ya bidhaa hii bado. Kuwa wa kwanza kutoa maoni!" : "No reviews for this fabric yet. Be the first to leave feedback!"}
                </p>
              ) : (
                productReviews.map((r) => (
                  <div key={r.id} className="p-2.5 rounded-xl bg-slate-50/5 border border-slate-700/10 space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-yellow-500">{r.userName}</span>
                      <div className="flex text-yellow-400">
                        {Array.from({ length: r.rating }).map((_, idx) => (
                          <Star key={idx} className="w-2.5 h-2.5 fill-yellow-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      {isSwahili ? r.commentSw : r.comment}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Review form */}
            <form onSubmit={handleReviewSubmit} className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-400">{isSwahili ? "Kadiria:" : "Your Rating:"}</span>
                <div className="flex gap-1 text-yellow-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="cursor-pointer"
                    >
                      <Star className={`w-4 h-4 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "opacity-30"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder={isSwahili ? "Andika maoni yako hapa..." : "Write your review comment..."}
                  className={`flex-1 text-xs px-3 py-2 rounded-xl border focus:outline-hidden ${
                    isDarkMode ? "bg-slate-950 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
                <button
                  type="submit"
                  className="bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer"
                >
                  {isSwahili ? "Tuma" : "Submit"}
                </button>
              </div>
              {isReviewSubmitted && (
                <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>{isSwahili ? "Asante kwa maoni yako!" : "Thank you for reviewing!"}</span>
                </p>
              )}
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
