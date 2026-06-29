/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = "buyer" | "seller" | "admin";

export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  verifiedSeller?: boolean;
  country?: string;
  region?: string;
  city?: string;
  physicalAddress?: string;
  dob?: string;
  gender?: string;
  securityQuestion?: string;
  securityAnswer?: string;
  createdAt?: string;
  lockedUntil?: string;
  notificationsEnabled?: boolean;
  bio?: string;
}

export interface Seller {
  id: string;
  userId: string;
  storeName: string;
  description: string;
  verified: boolean;
  rating: number;
  salesCount: number;
  revenue: number;
  phone: string;
  whatsapp: string;
  location: string;
  businessCategory?: string;
  businessAddress?: string;
  nationalId?: string;
  businessLicense?: string;
  storeLogo?: string;
}

export interface ProductVariation {
  id: string;
  name: string; // e.g., "6 Yards", "12 Yards", "Premium Silk"
  priceModifier: number; // added to base price
  stock: number;
}

export interface Product {
  id: string;
  title: string;
  titleSw: string;
  description: string;
  descriptionSw: string;
  price: number; // in TSh
  category: string;
  sellerId: string;
  sellerName: string;
  images: string[]; // URLs or canvas/svg patterns
  variations: ProductVariation[];
  stock: number;
  tags: string[];
  rating: number;
  reviewsCount: number;
  featured?: boolean;
  trending?: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
  status?: "draft" | "pending" | "published" | "rejected";
  condition?: string;
  size?: string;
  color?: string;
  deliveryOptions?: string;
  createdAt?: string;
}

export type OrderStatusFrontend = "Draft" | "Pending" | "Synchronizing" | "Submitted" | "Failed";
export type OrderStatusBackend = "Received" | "Processing" | "Confirmed" | "Shipped" | "Delivered" | "Cancelled";

export interface OrderItem {
  productId: string;
  productTitle: string;
  quantity: number;
  price: number;
  variationSelected?: string;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  phone: string;
  email: string;
  shippingAddress: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  
  // Statuses
  frontendStatus: OrderStatusFrontend;
  backendStatus: OrderStatusBackend;
  syncedAt?: string;
  isOfflineCreated: boolean;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  commentSw: string;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  titleSw: string;
  message: string;
  messageSw: string;
  type: "order" | "seller" | "admin" | "marketing";
  read: boolean;
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  method: string; // M-Pesa, Airtel Money, Tigo Pesa, HaloPesa, Credit Card, PayPal
  phone?: string;
  status: "Pending" | "Success" | "Failed";
  transactionId: string;
  createdAt: string;
}

export interface AIConversationMessage {
  sender: "user" | "ai";
  text: string;
}

export interface AIConversation {
  id: string;
  agentType: "shopping" | "seller" | "support" | "fraud" | "marketing";
  userId?: string;
  messages: AIConversationMessage[];
  updatedAt: string;
}

export interface SecurityLog {
  id: string;
  event: string;
  severity: "info" | "warning" | "critical";
  ipAddress: string;
  userId?: string;
  timestamp: string;
  details: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
  details: string;
}

export interface Coupon {
  code: string;
  discountPercent: number;
  description: string;
  descriptionSw: string;
}

export interface LoginHistory {
  id: string;
  usernameOrEmail: string;
  ipAddress: string;
  device: string;
  status: "success" | "failed";
  reason?: string;
  timestamp: string;
}

export interface PasswordResets {
  id: string;
  email: string;
  securityQuestion: string;
  securityAnswer: string;
  resetToken?: string;
  status: "pending" | "completed";
  timestamp: string;
}
