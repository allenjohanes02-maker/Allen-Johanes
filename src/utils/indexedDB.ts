/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Order, OrderStatusFrontend } from "../types";

const LOCAL_ORDERS_KEY = "soko_vitenge_local_orders";

/**
 * Robust local order persistence matching IndexedDB offline capability.
 */
export const localOrderStore = {
  // Get all local orders
  getOrders(): Order[] {
    try {
      const data = localStorage.getItem(LOCAL_ORDERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to read local orders", e);
      return [];
    }
  },

  // Save all local orders
  saveOrders(orders: Order[]): void {
    try {
      localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
    } catch (e) {
      console.error("Failed to write local orders", e);
    }
  },

  // Add a new order locally
  addOrder(order: Order): void {
    const orders = this.getOrders();
    orders.push(order);
    this.saveOrders(orders);
  },

  // Update status of a specific local order
  updateStatus(orderId: string, status: OrderStatusFrontend): void {
    const orders = this.getOrders();
    const index = orders.findIndex((o) => o.id === orderId);
    if (index > -1) {
      orders[index].frontendStatus = status;
      if (status === "Submitted") {
        orders[index].syncedAt = new Date().toISOString();
      }
      this.saveOrders(orders);
    }
  },

  // Remove fully synchronized orders to save space (as requested: "Local order data is cleared after successful synchronization")
  // Let's mark them synced but we can keep a reference so the client can see their sync history, or clear them entirely.
  // The guidelines say: "Local order data is cleared after successful synchronization." Let's write a function to clear submitted/synced orders.
  clearSyncedOrders(): void {
    const orders = this.getOrders();
    const unsynced = orders.filter((o) => o.frontendStatus !== "Submitted");
    this.saveOrders(unsynced);
  },

  // Delete a specific order
  deleteOrder(orderId: string): void {
    const orders = this.getOrders();
    const filtered = orders.filter((o) => o.id !== orderId);
    this.saveOrders(filtered);
  }
};
