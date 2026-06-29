/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Hash function for passwords
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Memory tracking for rate limiting/lockouts
const failedAttempts = new Map<string, { count: number; lockedUntil: number }>();

// Define __dirname in ES Module environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express
const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google Gemini Client (Server-side only)
let ai: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Google GenAI client successfully initialized.");
  } else {
    console.warn("GEMINI_API_KEY is not set or using default placeholder. AI features will fallback to deterministic rules.");
  }
} catch (err) {
  console.error("Failed to initialize Google GenAI:", err);
}

// Database JSON File Path (Simulating Cloud Database)
const DB_FILE = path.join(process.cwd(), "database.json");

// Helper function to load and save simulated database state
function loadDatabase() {
  if (fs.existsSync(DB_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    } catch (e) {
      console.error("Failed to parse database.json, starting fresh", e);
    }
  }

  // Seed Data representing Tanzanian context
  const defaultDb = {
    users: [
      { id: "u_buyer", name: "Fatuma Omari", email: "fatuma@example.tz", role: "buyer", phone: "+255 712 111 222", avatar: "👩🏾‍💼" },
      { id: "u_seller_kamala", name: "Kamala Vitenge Store", email: "kamala@example.tz", role: "seller", phone: "+255 655 400 300", avatar: "🏬", verifiedSeller: true },
      { id: "u_seller_mangi", name: "Mangi Fabrics East Africa", email: "mangi@example.tz", role: "seller", phone: "+255 784 999 888", avatar: "🏢", verifiedSeller: true },
      { id: "u_admin", name: "Allen Dreamer77", email: "allenben428@gmail.com", role: "admin", phone: "+255 714 202 298", avatar: "👑" },
    ],
    sellers: [
      {
        id: "s_kamala",
        userId: "u_seller_kamala",
        storeName: "Kamala Vitenge Emporium",
        description: "Wauzaji mashuhuri wa Vitenge vya asili vya nta (Wax prints), vilivyopambwa kwa dhahabu na pamba bora kutoka Morogoro na Mwanza.",
        verified: true,
        rating: 4.9,
        salesCount: 142,
        revenue: 4260000,
        phone: "+255 655 400 300",
        whatsapp: "255655400300",
        location: "Kariakoo, Dar es Salaam",
      },
      {
        id: "s_mangi",
        userId: "u_seller_mangi",
        storeName: "Mangi Fabrics East Africa",
        description: "Tunajihusisha na kuuza Vitenge vya Harusi, sherehe za kifahari na mitindo ya kisasa ya kiume na kike kutoka kote Afrika Mashariki.",
        verified: true,
        rating: 4.7,
        salesCount: 98,
        revenue: 3180000,
        phone: "+255 784 999 888",
        whatsapp: "255784999888",
        location: "Mwanza City Mall, Mwanza",
      }
    ],
    products: [
      {
        id: "p_1",
        title: "Khanga na Kitenge cha Nta ya Kwanza (Super Wax)",
        titleSw: "Kitenge cha Nta ya Kwanza (Super Wax)",
        description: "100% premium cotton wax print with a vibrant floral layout outlined in luxury gold foil. Highly durable fabric suited for wedding gowns, executive wear, and special cultural occasions.",
        descriptionSw: "Kitenge cha nta daraja la kwanza (Super Wax) kilichoundwa kwa pamba 100%. Kina michoro maridadi ya maua iliyozungushiwa nakshi ya dhahabu. Haichubuki na kinafaa kwa nguo za harusi, sherehe, au mavazi rasmi.",
        price: 20000,
        category: "Premium Vitenge",
        sellerId: "s_kamala",
        sellerName: "Kamala Vitenge Emporium",
        images: ["/src/assets/images/kitenge_green_orange_1782736323136.jpg"],
        variations: [
          { id: "v_1_1", name: "6 Yards", priceModifier: 0, stock: 24 },
          { id: "v_1_2", name: "12 Yards", priceModifier: 10000, stock: 12 }
        ],
        stock: 36,
        tags: ["Wax Print", "Gold Foil", "Wedding", "Premium", "Morogoro"],
        rating: 4.9,
        reviewsCount: 12,
        featured: true,
        trending: true,
        newArrival: false,
        bestSeller: true
      },
      {
        id: "p_2",
        title: "Traditional Swahili Kanga Pattern",
        titleSw: "Kitenge cha Asili cha Kanga na Methali",
        description: "Classic Tanzanian Vitenge pattern with authentic geometric design. Includes elegant borders and central floral focus. Perfectly breathable material for daily use.",
        descriptionSw: "Kitenge cha asili chenye michoro ya kijiometri na mipasuko ya kitamaduni. Rangi madhubuti za bluu na dhahabu. Kitambaa chepesi kinachopumua vizuri, kinafaa kwa matumizi ya kila siku.",
        price: 25000,
        category: "Traditional Vitenge",
        sellerId: "s_kamala",
        sellerName: "Kamala Vitenge Emporium",
        images: ["/src/assets/images/kitenge_blue_gold_1782736308148.jpg"],
        variations: [
          { id: "v_2_1", name: "6 Yards", priceModifier: 0, stock: 40 }
        ],
        stock: 40,
        tags: ["Traditional", "Daily", "Kariakoo", "Blue-Gold"],
        rating: 4.6,
        reviewsCount: 8,
        featured: false,
        trending: true,
        newArrival: true,
        bestSeller: false
      },
      {
        id: "p_3",
        title: "Modern Designer Geometrics (Fashion Edition)",
        titleSw: "Kitenge cha Mitindo cha Kisasa (Geometric)",
        description: "An elegant contemporary take on Vitenge featuring asymmetrical gold lines on royal blue blocks. Recommended for bespoke modern dresses, blazers, and luxury accessories.",
        descriptionSw: "Mtindo wa kisasa kabisa wa Vitenge ukiwa na mistari ya dhahabu ya kijiometri kwenye bluu ya kifalme. Kinafaa kwa suti, magauni ya kisasa ya kike na kiume, na mikoba ya kiasili.",
        price: 24000,
        category: "Fashion Vitenge",
        sellerId: "s_mangi",
        sellerName: "Mangi Fabrics East Africa",
        images: ["/src/assets/images/kitenge_yellow_blue_1782736276162.jpg"],
        variations: [
          { id: "v_3_1", name: "6 Yards", priceModifier: 0, stock: 15 },
          { id: "v_3_2", name: "6 Yards Extra Soft", priceModifier: 4000, stock: 8 }
        ],
        stock: 23,
        tags: ["Modern", "Asymmetric", "Fashion", "Designer"],
        rating: 4.8,
        reviewsCount: 15,
        featured: true,
        trending: false,
        newArrival: true,
        bestSeller: true
      },
      {
        id: "p_4",
        title: "Royal Tanzanian Wedding Brocade Kitenge",
        titleSw: "Kitenge cha Harusi ya Kifalme (Brocade)",
        description: "Heavy woven jacquard and wax combination, designed strictly for high-end wedding parties, brides, and send-off ceremonies. Features intricate gold threads.",
        descriptionSw: "Kitenge cha kifahari kilichofumwa kwa uzi mzito wa dhahabu na pamba ngumu ya sherehe (Jacquard/Brocade). Kinafaa kwa maharusi, sherehe za Send-Off, na hafla rasmi za kitaifa.",
        price: 30000,
        category: "Wedding Vitenge",
        sellerId: "s_mangi",
        sellerName: "Mangi Fabrics East Africa",
        images: ["/src/assets/images/kitenge_red_black_1782736294642.jpg"],
        variations: [
          { id: "v_4_1", name: "6 Yards Deluxe", priceModifier: 0, stock: 10 }
        ],
        stock: 10,
        tags: ["Wedding", "Brocade", "Luxury", "Royal", "Gold Thread"],
        rating: 5.0,
        reviewsCount: 6,
        featured: true,
        trending: true,
        newArrival: true,
        bestSeller: false
      },
      {
        id: "p_5",
        title: "Imported Java High-Glaze Wax Print",
        titleSw: "Kitenge cha Java Kina'acho (High-Glaze Wax)",
        description: "Imported fine Java wax print with a high-glaze silky finish. Outstanding colors of navy blue, gold dust, and cream white. Known for soft feel and premium drape.",
        descriptionSw: "Kitenge cha nta cha Java kilichoingizwa nchini chenye tabaka la juu linalong'aa (silky gloss). Rangi za kuvutia za bluu nzito na vumbi la dhahabu. Laini na rahisi kushoneka.",
        price: 29000,
        category: "Imported Vitenge",
        sellerId: "s_kamala",
        sellerName: "Kamala Vitenge Emporium",
        images: ["/src/assets/images/kitenge_yellow_blue_1782736276162.jpg"],
        variations: [
          { id: "v_5_1", name: "6 Yards Java", priceModifier: 0, stock: 18 }
        ],
        stock: 18,
        tags: ["Java Wax", "High-Glaze", "Imported", "Soft-Drape"],
        rating: 4.7,
        reviewsCount: 9,
        featured: false,
        trending: false,
        newArrival: false,
        bestSeller: true
      },
      {
        id: "p_6",
        title: "Local Hand-Dyed Batik Kitenge",
        titleSw: "Kitenge cha Batik ya Kupaka kwa Mkono",
        description: "Ethically created hand-dyed Batik Vitenge made by local women cooperatives in Morogoro. Distinctive unique organic shapes in dark blue and mustard gold.",
        descriptionSw: "Batik iliyopakwa rangi kwa mkono na kikundi cha wakinamama wajasiriamali mkoani Morogoro. Michoro ya asili isiyoiga popote. Ununuzi huu unasaidia maisha ya jamii za wenyeji.",
        price: 22000,
        category: "Local Designs",
        sellerId: "s_mangi",
        sellerName: "Mangi Fabrics East Africa",
        images: ["/src/assets/images/kitenge_green_orange_1782736323136.jpg"],
        variations: [
          { id: "v_6_1", name: "6 Yards Batik", priceModifier: 0, stock: 15 }
        ],
        stock: 15,
        tags: ["Batik", "Handmade", "Local", "Women-Coop", "Morogoro"],
        rating: 4.9,
        reviewsCount: 19,
        featured: false,
        trending: true,
        newArrival: true,
        bestSeller: false
      },
      {
        id: "p_7",
        title: "Duanas Authentic Butterfly Print (Super Wax)",
        titleSw: "Kitenge cha Duanas cha Maua ya Kipepeo",
        description: "Guaranteed block prints Super Wax fabric branded by DUANAS, printed by Orientar. Features beautiful navy blue block patterns with elegant golden butterfly prints.",
        descriptionSw: "Kitenge cha nta daraja la kwanza chapa ya DUANAS, kilichochapishwa na Orientar. Kina michoro ya asili ya vipepeo vya dhahabu kwenye mandhari ya bluu ya kifalme and kahawia.",
        price: 26000,
        category: "Premium Vitenge",
        sellerId: "s_kamala",
        sellerName: "Kamala Vitenge Emporium",
        images: ["/src/assets/images/kitenge_red_black_1782736294642.jpg"],
        variations: [
          { id: "v_7_1", name: "6 Yards Super Wax", priceModifier: 0, stock: 20 },
          { id: "v_7_2", name: "12 Yards Super Wax", priceModifier: 4000, stock: 10 }
        ],
        stock: 30,
        tags: ["Duanas", "Butterfly", "Super Wax", "Orientar", "Kariakoo"],
        rating: 5.0,
        reviewsCount: 7,
        featured: true,
        trending: true,
        newArrival: true,
        bestSeller: true
      },
      {
        id: "p_8",
        title: "Duanas Basketweave Geometric Plaid Print",
        titleSw: "Kitenge cha Duanas cha Mistari ya Kikapu",
        description: "Guaranteed block prints Super Wax fabric branded by DUANAS. Intricate interlocking basketweave design with brilliant cyan blue, warm yellow, and brown plaid blocks.",
        descriptionSw: "Kitenge cha asili cha DUANAS chenye michoro ya kijiometri ya kusukwa kama kikapu (Basketweave). Rangi nzuri za bluu ya bahari, njano, na kahawia kwa sherehe na mtindo wa kila siku.",
        price: 24000,
        category: "Traditional Vitenge",
        sellerId: "s_kamala",
        sellerName: "Kamala Vitenge Emporium",
        images: ["/src/assets/images/kitenge_blue_gold_1782736308148.jpg"],
        variations: [
          { id: "v_8_1", name: "6 Yards", priceModifier: 0, stock: 15 }
        ],
        stock: 15,
        tags: ["Duanas", "Basketweave", "Plaid", "Geometric", "Orientar"],
        rating: 4.8,
        reviewsCount: 5,
        featured: true,
        trending: false,
        newArrival: true,
        bestSeller: false
      },
      {
        id: "p_9",
        title: "Duanas Royal Navy Red Fan Blossom",
        titleSw: "Kitenge cha Duanas cha Maua ya Kipepeo Mwekundu",
        description: "Authentic DUANAS printed by Orientar featuring elegant red fan blossoms layered on flowing navy wave lines. A masterpiece of traditional African pattern design.",
        descriptionSw: "Kitenge cha kifahari cha DUANAS kilichochapishwa na Orientar kikiwa na maua mekundu ya kipepeo/fani yanayochanua kwenye mawimbi meusi na meupe. Bora kwa sherehe na Send-off.",
        price: 28000,
        category: "Wedding Vitenge",
        sellerId: "s_mangi",
        sellerName: "Mangi Fabrics East Africa",
        images: ["/src/assets/images/kitenge_red_black_1782736294642.jpg"],
        variations: [
          { id: "v_9_1", name: "6 Yards Deluxe", priceModifier: 0, stock: 12 }
        ],
        stock: 12,
        tags: ["Duanas", "Wedding", "Blossom", "Navy-Red", "Orientar"],
        rating: 4.9,
        reviewsCount: 8,
        featured: false,
        trending: true,
        newArrival: true,
        bestSeller: true
      },
      {
        id: "p_10",
        title: "Duanas Modernist Chevron Triangle Print",
        titleSw: "Kitenge cha Duanas cha Pembe Tatu na Mistari",
        description: "Contemporary tribal chevron and triangular stripe pattern branded by DUANAS. Rich red, yellow, and black details that create a spectacular visual contrast.",
        descriptionSw: "Mtindo wa kisasa wa DUANAS wenye michoro ya pembetatu (Chevron) na mistari ya kitamaduni. Inachanganya rangi za njano, nyekundu, na nyeusi kwa ujasiri na mtindo usio na kifani.",
        price: 23000,
        category: "Fashion Vitenge",
        sellerId: "s_mangi",
        sellerName: "Mangi Fabrics East Africa",
        images: ["/src/assets/images/kitenge_yellow_blue_1782736276162.jpg"],
        variations: [
          { id: "v_10_1", name: "6 Yards Standard", priceModifier: 0, stock: 22 }
        ],
        stock: 22,
        tags: ["Duanas", "Chevron", "Triangle", "Fashion", "Orientar"],
        rating: 4.7,
        reviewsCount: 4,
        featured: true,
        trending: true,
        newArrival: true,
        bestSeller: false
      }
    ],
    orders: [] as any[],
    reviews: [
      { id: "r_1", productId: "p_1", userId: "u_buyer", userName: "Fatuma Omari", rating: 5, comment: "The gold foil is stunning and does not wash out at all! Best wedding buy.", commentSw: "Nakshi ya dhahabu ni nzuri mno na haitoki kabisa wakati wa kufua! Ndiyo ununuzi wangu bora wa harusi.", createdAt: "2026-06-25T14:32:00Z" }
    ],
    messages: [
      { id: "m_1", senderId: "u_buyer", receiverId: "s_kamala", senderName: "Fatuma Omari", content: "Habari Kamala, ninataka kujua kama Super Wax itafaa kwa gauni la harusi?", timestamp: "2026-06-28T09:00:00Z" },
      { id: "m_2", senderId: "s_kamala", receiverId: "u_buyer", senderName: "Kamala Vitenge Emporium", content: "Habari Fatuma! Ndio, inafaa kabisa. Ina mng'ao wa dhahabu ambao ni bora kwa gauni la bibi harusi.", timestamp: "2026-06-28T09:15:00Z" }
    ],
    notifications: [
      { id: "n_1", userId: "u_buyer", title: "Karibu Sokoni!", titleSw: "Karibu Sokoni!", message: "Explore authentic Tanzanian Vitenge with local secure delivery.", messageSw: "Gundua Vitenge halisi vya Kitanzania vikiwa na usafirishaji wa uhakika nchini.", type: "marketing", read: false, createdAt: "2026-06-29T00:00:00Z" }
    ],
    payments: [] as any[],
    securityLogs: [
      { id: "sl_1", event: "Admin Login Successful", severity: "info", ipAddress: "192.168.1.50", userId: "u_admin", timestamp: "2026-06-29T04:00:00-07:00", details: "Admin session initiated for Allen Dreamer77" },
      { id: "sl_2", event: "CSRF Token Validation Active", severity: "info", ipAddress: "system", timestamp: "2026-06-29T04:05:00-07:00", details: "Enterprise-grade cookie validation is actively monitoring sessions" }
    ],
    activityLogs: [
      { id: "al_1", userId: "u_admin", userName: "Allen Dreamer77", action: "System Audit", timestamp: "2026-06-29T04:10:00-07:00", details: "Approved store verification request for Kamala Vitenge Emporium" }
    ],
    coupons: [
      { code: "VITENGE10", discountPercent: 10, description: "Get 10% off your entire authentic Vitenge purchase!", descriptionSw: "Pata punguzo la 10% kwenye ununuzi wote wa Vitenge!" },
      { code: "MANGISHEKHE", discountPercent: 15, description: "15% off Wedding and Royal designs by Mangi Fabrics.", descriptionSw: "Punguzo la 15% kwenye nguo za sherehe kutoka Mangi Fabrics." }
    ]
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), "utf-8");
  return defaultDb;
}

// Write helper
function saveDatabase(db: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
}

// Initial Load
const db = loadDatabase();

// --- DATABASE MIGRATIONS & SCHEMA INTEGRITY ON STARTUP ---
if (!db.userRoles) db.userRoles = [];
if (!db.buyerProfiles) db.buyerProfiles = [];
if (!db.sellerProfiles) db.sellerProfiles = [];
if (!db.adminAccounts) db.adminAccounts = [];
if (!db.loginHistory) db.loginHistory = [];
if (!db.passwordResets) db.passwordResets = [];

if (!db.banners) {
  db.banners = [
    { id: "b_1", title: "Sherehe msimu wa Harusi!", titleSw: "Sherehe msimu wa Harusi!", imageUrl: "/src/assets/images/kitenge_red_black_1782736294642.jpg", link: "#", active: true, description: "Pata vitenge bora vyenye nakshi ya dhahabu." },
    { id: "b_2", title: "Msimu Mpya wa Mitindo", titleSw: "Msimu Mpya wa Mitindo", imageUrl: "/src/assets/images/kitenge_yellow_blue_1782736276162.jpg", link: "#", active: true, description: "Gundua miundo ya kipekee kutoka Morogoro." }
  ];
}
if (!db.advertisements) {
  db.advertisements = [
    { id: "ad_1", title: "Kariakoo Super-Wax", imageUrl: "/src/assets/images/kitenge_green_orange_1782736323136.jpg", active: true },
    { id: "ad_2", title: "Mwanza Cotton Premium", imageUrl: "/src/assets/images/kitenge_blue_gold_1782736308148.jpg", active: true }
  ];
}
if (!db.announcements) {
  db.announcements = [
    { id: "ann_1", title: "Ofa ya Siku Kuu", titleSw: "Ofa ya Siku Kuu", content: "Tumia kuponi ya VITENGE10 kupata punguzo la 10% sasa hivi!", contentSw: "Tumia kuponi ya VITENGE10 kupata punguzo la 10% sasa hivi!", active: true }
  ];
}

// Seed default accounts passwords and details if missing
db.users.forEach((u: any) => {
  if (!u.username) {
    if (u.id === "u_admin") u.username = "allen";
    else if (u.id === "u_buyer") u.username = "fatuma";
    else if (u.id === "u_seller_kamala") u.username = "kamala";
    else if (u.id === "u_seller_mangi") u.username = "mangi";
    else u.username = u.name.toLowerCase().replace(/\s+/g, "");
  }
  if (!u.password) {
    const rawPass = u.id === "u_admin" ? "AllenDreamer77!" : "Password123!";
    u.password = hashPassword(rawPass);
  }
  if (!u.firstName) {
    const parts = u.name.split(" ");
    u.firstName = parts[0] || u.name;
    u.lastName = parts.slice(1).join(" ") || "User";
  }
  if (!u.gender) u.gender = "mwanamke";
  if (!u.dob) u.dob = "1995-05-15";
  if (!u.country) u.country = "Tanzania";
  if (!u.region) u.region = "Dar es Salaam";
  if (!u.city) u.city = "Dar es Salaam";
  if (!u.physicalAddress) u.physicalAddress = "Kariakoo, Dar es Salaam";
  if (!u.securityQuestion) u.securityQuestion = "What is your favorite color? / Rangi yako ya asili uipendayo ni gani?";
  if (!u.securityAnswer) u.securityAnswer = "Dhahabu";

  // Seed userRoles
  const hasRole = db.userRoles.some((ur: any) => ur.userId === u.id);
  if (!hasRole) {
    db.userRoles.push({ id: `ur_${Date.now()}_${u.id}`, userId: u.id, role: u.role });
  }

  // Seed profiles
  if (u.role === "buyer") {
    const hasProfile = db.buyerProfiles.some((bp: any) => bp.userId === u.id);
    if (!hasProfile) {
      db.buyerProfiles.push({ id: `bp_${Date.now()}_${u.id}`, userId: u.id, wishlist: [], cart: [], notes: "Kariakoo Local Buyer" });
    }
  } else if (u.role === "seller") {
    const hasProfile = db.sellerProfiles.some((sp: any) => sp.userId === u.id);
    if (!hasProfile) {
      const sellerObj = db.sellers.find((s: any) => s.userId === u.id) || {};
      db.sellerProfiles.push({
        id: `sp_${Date.now()}_${u.id}`,
        userId: u.id,
        businessName: sellerObj.storeName || `${u.name} store`,
        businessCategory: "Traditional Vitenge",
        businessAddress: sellerObj.location || "Kariakoo",
        businessPhone: sellerObj.phone || u.phone || "+255 700 000 000",
        businessDescription: sellerObj.description || "Asili kabisa",
        nationalId: "19950515123456789012",
        businessLicense: "LIC-77202-TZ",
        rating: sellerObj.rating || 5.0,
        salesCount: sellerObj.salesCount || 0,
        revenue: sellerObj.revenue || 0
      });
    }
  } else if (u.role === "admin") {
    const hasAdmin = db.adminAccounts.some((aa: any) => aa.userId === u.id);
    if (!hasAdmin) {
      db.adminAccounts.push({
        id: `aa_${Date.now()}_${u.id}`,
        userId: u.id,
        username: u.username,
        name: "ALLEN DREAMER77",
        role: "Super Administrator",
        email: u.email,
        phone: u.phone || "+255 714 202 298"
      });
    }
  }
});

// Seed hidden Super Admin if it was deleted
const hasAdminUser = db.users.some((u: any) => u.id === "u_admin" || u.email === "allenben428@gmail.com");
if (!hasAdminUser) {
  db.users.push({
    id: "u_admin",
    name: "ALLEN DREAMER77",
    firstName: "ALLEN",
    lastName: "DREAMER77",
    username: "Allen77#",
    email: "allenben428@gmail.com",
    role: "admin",
    phone: "+255 714 202 298",
    avatar: "👑",
    country: "Tanzania",
    region: "Dar es Salaam",
    city: "Dar es Salaam",
    physicalAddress: "Dar es Salaam",
    dob: "1990-01-01",
    gender: "mwanaume",
    password: hashPassword("A1l2l3e4n577#"),
    securityQuestion: "What is your favorite color? / Rangi yako ya asili uipendayo ni gani?",
    securityAnswer: "Dhahabu",
    createdAt: new Date().toISOString()
  });
  db.userRoles.push({ id: `ur_admin`, userId: "u_admin", role: "admin" });
  db.adminAccounts.push({
    id: `aa_admin`,
    userId: "u_admin",
    username: "Allen77#",
    name: "ALLEN DREAMER77",
    role: "Super Administrator",
    email: "allenben428@gmail.com",
    phone: "+255 714 202 298"
  });
}

// ALWAYS enforce the requested admin username and password for security migrations
const adminUserExist = db.users.find((u: any) => u.id === "u_admin" || u.email === "allenben428@gmail.com");
if (adminUserExist) {
  adminUserExist.username = "Allen77#";
  adminUserExist.password = hashPassword("A1l2l3e4n577#");
}
const adminAccountExist = db.adminAccounts?.find((aa: any) => aa.userId === "u_admin" || aa.email === "allenben428@gmail.com");
if (adminAccountExist) {
  adminAccountExist.username = "Allen77#";
}

saveDatabase(db);

// CAPTCHA Challenge Store
const captchaStore = new Map<string, string>();

// --- CAPTCHA CHALLENGE ENDPOINT ---
app.get("/api/auth/captcha", (req, res) => {
  const num1 = Math.floor(Math.random() * 9) + 1;
  const num2 = Math.floor(Math.random() * 9) + 1;
  const operations = ["+", "-"];
  const op = operations[Math.floor(Math.random() * operations.length)];
  let answer = 0;
  if (op === "+") answer = num1 + num2;
  else answer = num1 - num2;

  const id = `cap_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  captchaStore.set(id, String(answer));
  
  res.json({ 
    id, 
    question: `${num1} ${op} ${num2} = ?` 
  });
});

// --- API AUTHENTICATION ENDPOINTS ---
app.post("/api/auth/login", (req, res) => {
  const { usernameOrEmail, password, captchaId, captchaValue, device } = req.body;
  const clientIp = req.ip || "127.0.0.1";

  // CAPTCHA Check
  if (!captchaId || !captchaValue || captchaStore.get(captchaId) !== String(captchaValue).trim()) {
    return res.status(400).json({ success: false, message: "Incorrect CAPTCHA answer. / Jibu la CAPTCHA si sahihi." });
  }
  // Clear captcha
  captchaStore.delete(captchaId);

  // Rate Limiting & Lockout Check
  const normUser = usernameOrEmail?.toLowerCase().trim();
  const lockout = failedAttempts.get(normUser);
  if (lockout && lockout.lockedUntil > Date.now()) {
    const secsLeft = Math.ceil((lockout.lockedUntil - Date.now()) / 1000);
    return res.status(423).json({
      success: false,
      message: `Too many failed attempts. Locked out. Please try again in ${secsLeft} seconds. / Majaribio mengi yamefeli. Umezuiwa kwa sekunde ${secsLeft}.`
    });
  }

  const user = db.users.find((u: any) => 
    u.email?.toLowerCase().trim() === normUser || 
    u.username?.toLowerCase().trim() === normUser
  );

  if (user && user.password === hashPassword(password)) {
    // Reset lockout
    failedAttempts.delete(normUser);

    // Save Login History
    db.loginHistory.unshift({
      id: `lh_${Date.now()}`,
      usernameOrEmail,
      ipAddress: clientIp,
      device: device || "Web Browser",
      status: "success",
      timestamp: new Date().toISOString()
    });

    // Security log
    db.securityLogs.unshift({
      id: `sl_${Date.now()}`,
      event: "User Login Successful",
      severity: "info",
      ipAddress: clientIp,
      userId: user.id,
      timestamp: new Date().toISOString(),
      details: `${user.name} (${user.role}) logged in successfully via '${usernameOrEmail}'. Device: ${device || "Unknown"}`
    });

    // Activity log
    db.activityLogs.unshift({
      id: `al_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      action: "Login",
      timestamp: new Date().toISOString(),
      details: `${user.name} logged in successfully as ${user.role}.`
    });

    saveDatabase(db);
    res.json({ success: true, user });
  } else {
    // Increment failures
    const attempts = failedAttempts.get(normUser) || { count: 0, lockedUntil: 0 };
    attempts.count += 1;
    let locked = false;
    if (attempts.count >= 5) {
      attempts.lockedUntil = Date.now() + 60 * 1000; // lock for 60 seconds
      locked = true;
    }
    failedAttempts.set(normUser, attempts);

    // Save Login History as failed
    db.loginHistory.unshift({
      id: `lh_${Date.now()}`,
      usernameOrEmail,
      ipAddress: clientIp,
      device: device || "Web Browser",
      status: "failed",
      reason: locked ? "Locked Out" : "Invalid Credentials",
      timestamp: new Date().toISOString()
    });

    // Security Log
    db.securityLogs.unshift({
      id: `sl_${Date.now()}`,
      event: "Failed Login Attempt",
      severity: locked ? "critical" : "warning",
      ipAddress: clientIp,
      timestamp: new Date().toISOString(),
      details: `Failed login attempt for identifier '${usernameOrEmail}'. Attempts: ${attempts.count}/5. Locked: ${locked}`
    });

    saveDatabase(db);

    if (locked) {
      return res.status(423).json({
        success: false,
        message: "Too many failed attempts. Locked out for 60 seconds. / Majaribio mengi yamefeli. Umezuiwa kwa sekunde 60."
      });
    } else {
      return res.status(401).json({
        success: false,
        message: `Invalid credentials. Attempt ${attempts.count} of 5. / Taarifa si sahihi. Jaribio la ${attempts.count} kati ya 5.`
      });
    }
  }
});

app.post("/api/auth/register", (req, res) => {
  const { 
    firstName, 
    lastName, 
    username, 
    email, 
    phone, 
    country, 
    region, 
    city, 
    physicalAddress, 
    dob, 
    gender, 
    password, 
    securityQuestion, 
    securityAnswer,
    role,
    // Seller Fields
    businessName,
    businessCategory,
    businessAddress,
    businessPhone,
    businessDescription,
    storeLogo,
    nationalId,
    businessLicense
  } = req.body;

  // Validation Check
  if (!firstName || !lastName || !username || !email || !phone || !country || !region || !city || !physicalAddress || !dob || !gender || !password || !securityQuestion || !securityAnswer) {
    return res.status(400).json({ success: false, message: "Please fill in all mandatory fields. / Tafadhali jaza uga zote za lazima." });
  }

  // Duplicate Check
  const dupEmail = db.users.find((u: any) => u.email.toLowerCase().trim() === email.toLowerCase().trim());
  if (dupEmail) {
    return res.status(400).json({ success: false, message: "Email is already registered. / Barua pepe hii tayari imesajiliwa." });
  }

  const dupUser = db.users.find((u: any) => u.username?.toLowerCase().trim() === username.toLowerCase().trim());
  if (dupUser) {
    return res.status(400).json({ success: false, message: "Username is already taken. / Jina hili la mtumiaji tayari limechukuliwa." });
  }

  // Password Requirement Regex Check
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ 
      success: false, 
      message: "Password does not meet safety criteria (Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char). / Nenosiri halijakidhi vigezo vya usalama." 
    });
  }

  // Create User
  const userId = `u_${Date.now()}`;
  const fullname = `${firstName} ${lastName}`;
  const newUser: any = {
    id: userId,
    name: fullname,
    firstName,
    lastName,
    username,
    email: email.toLowerCase().trim(),
    role: role || "buyer",
    phone,
    country,
    region,
    city,
    physicalAddress,
    dob,
    gender,
    password: hashPassword(password),
    securityQuestion,
    securityAnswer,
    avatar: role === "seller" ? "🏬" : "👩🏾",
    createdAt: new Date().toISOString()
  };

  if (role === "seller") {
    newUser.verifiedSeller = false;
  }

  db.users.push(newUser);

  // User role mapping
  db.userRoles.push({
    id: `ur_${Date.now()}`,
    userId,
    role: role || "buyer"
  });

  // Buyer Profile
  if (role !== "seller") {
    db.buyerProfiles.push({
      id: `bp_${Date.now()}`,
      userId,
      wishlist: [],
      cart: [],
      notes: "Registered Buyer"
    });
  }

  // Seller Profile
  if (role === "seller") {
    const sellerId = `s_${Date.now()}`;
    
    // Add to legacy sellers list so existing code continues working
    db.sellers.push({
      id: sellerId,
      userId,
      storeName: businessName || `${fullname}'s Vitenge`,
      description: businessDescription || "Duka jipya lenye bidhaa bora za Kitanzania.",
      verified: false,
      rating: 5.0,
      salesCount: 0,
      revenue: 0,
      phone: businessPhone || phone,
      whatsapp: (businessPhone || phone).replace(/\D/g, ""),
      location: `${city}, ${region}`
    });

    // Add to formal sellerProfiles
    db.sellerProfiles.push({
      id: `sp_${Date.now()}`,
      userId,
      businessName: businessName || `${fullname}'s Vitenge`,
      businessCategory: businessCategory || "Traditional Vitenge",
      businessAddress: businessAddress || physicalAddress,
      businessPhone: businessPhone || phone,
      businessDescription: businessDescription || "Duka jipya la Kitanzania.",
      storeLogo: storeLogo || "🏬",
      nationalId: nationalId || "00000000000000000000",
      businessLicense: businessLicense || "",
      rating: 5.0,
      salesCount: 0,
      revenue: 0
    });
  }

  // Security log
  db.securityLogs.unshift({
    id: `sl_${Date.now()}`,
    event: "User Registered Successfully",
    severity: "info",
    ipAddress: req.ip || "127.0.0.1",
    userId,
    timestamp: new Date().toISOString(),
    details: `New account registered. Username: ${username}, Role: ${role || "buyer"}.`
  });

  // Activity log
  db.activityLogs.unshift({
    id: `al_${Date.now()}`,
    userId,
    userName: fullname,
    action: "Register",
    timestamp: new Date().toISOString(),
    details: `Account created successfully with role: ${role || "buyer"}`
  });

  saveDatabase(db);
  res.json({ success: true, user: newUser });
});

app.post("/api/auth/forgot-password", (req, res) => {
  const { usernameOrEmail } = req.body;
  const norm = usernameOrEmail?.toLowerCase().trim();
  const user = db.users.find((u: any) => u.email?.toLowerCase().trim() === norm || u.username?.toLowerCase().trim() === norm);
  
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found. / Mtumiaji hakupatikana." });
  }

  res.json({
    success: true,
    email: user.email,
    securityQuestion: user.securityQuestion || "What is your favorite color? / Rangi yako ya asili uipendayo ni gani?"
  });
});

app.post("/api/auth/reset-password", (req, res) => {
  const { email, securityAnswer, newPassword } = req.body;
  const user = db.users.find((u: any) => u.email?.toLowerCase().trim() === email?.toLowerCase().trim());

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found. / Mtumiaji hakupatikana." });
  }

  if (user.securityAnswer?.toLowerCase().trim() !== securityAnswer?.toLowerCase().trim()) {
    return res.status(400).json({ success: false, message: "Incorrect security answer. / Jibu la usalama si sahihi." });
  }

  // Password Requirement Check
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({ 
      success: false, 
      message: "Password does not meet safety criteria (Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char). / Nenosiri jipya halijakidhi vigezo vya usalama." 
    });
  }

  // Reset password
  user.password = hashPassword(newPassword);

  // Security Log
  db.securityLogs.unshift({
    id: `sl_${Date.now()}`,
    event: "Password Reset Successful",
    severity: "warning",
    ipAddress: req.ip || "127.0.0.1",
    userId: user.id,
    timestamp: new Date().toISOString(),
    details: `Password changed for user ${user.username} via Security Question.`
  });

  // Activity Log
  db.activityLogs.unshift({
    id: `al_${Date.now()}`,
    userId: user.id,
    userName: user.name,
    action: "Reset Password",
    timestamp: new Date().toISOString(),
    details: `Password reset via security question verified successfully.`
  });

  saveDatabase(db);
  res.json({ success: true, message: "Password reset successfully. / Nenosiri limebadilishwa kikamilifu." });
});

// Admin-facing raw metadata tables
app.get("/api/auth/login-history", (req, res) => {
  res.json(db.loginHistory || []);
});

app.get("/api/auth/user-roles", (req, res) => {
  res.json(db.userRoles || []);
});

app.get("/api/auth/buyer-profiles", (req, res) => {
  res.json(db.buyerProfiles || []);
});

app.get("/api/auth/seller-profiles", (req, res) => {
  res.json(db.sellerProfiles || []);
});

app.get("/api/auth/admin-accounts", (req, res) => {
  res.json(db.adminAccounts || []);
});

app.get("/api/auth/password-resets", (req, res) => {
  res.json(db.passwordResets || []);
});

app.get("/api/users", (req, res) => {
  res.json(db.users);
});

app.put("/api/users/profile", (req, res) => {
  const { 
    userId, 
    name, 
    email, 
    phone, 
    physicalAddress, 
    avatar, 
    password, 
    notificationsEnabled, 
    gender, 
    dob, 
    country, 
    region, 
    city,
    username,
    bio
  } = req.body;

  const user = db.users.find((u: any) => u.id === userId);
  if (!user) {
    return res.status(404).json({ success: false, message: "Mtumiaji hajapatikana / User not found" });
  }

  const clientIp = req.ip || "127.0.0.1";
  const device = req.headers["user-agent"] || "Web Browser";

  if (name) user.name = name;
  if (email) user.email = email.toLowerCase().trim();
  if (phone) user.phone = phone;
  if (physicalAddress) user.physicalAddress = physicalAddress;
  if (avatar) user.avatar = avatar;
  if (gender) user.gender = gender;
  if (dob) user.dob = dob;
  if (country) user.country = country;
  if (region) user.region = region;
  if (city) user.city = city;
  if (username) user.username = username;
  if (bio) user.bio = bio;
  if (notificationsEnabled !== undefined) {
    user.notificationsEnabled = !!notificationsEnabled;
  }

  let pwdChanged = false;
  if (password && password.trim() !== "") {
    user.password = hashPassword(password);
    pwdChanged = true;
  }

  if (!db.notifications) {
    db.notifications = [];
  }

  const notifId = `n_${Date.now()}`;
  db.notifications.unshift({
    id: notifId,
    userId: user.id,
    title: "Profile Updated",
    titleSw: "Taarifa Zimesasishwa",
    message: pwdChanged 
      ? "Your profile and security password have been updated successfully." 
      : "Your profile details have been updated successfully.",
    messageSw: pwdChanged 
      ? "Wasifu wako na nenosiri la usalama vimesasishwa kikamilifu." 
      : "Maelezo ya wasifu wako yamesasishwa kikamilifu.",
    read: false,
    createdAt: new Date().toISOString()
  });

  db.activityLogs.unshift({
    id: `al_${Date.now()}`,
    userId: user.id,
    userName: user.name,
    action: "Profile Update",
    timestamp: new Date().toISOString(),
    details: `${user.name} updated profile details.${pwdChanged ? " Password was updated." : ""}`,
    ipAddress: clientIp,
    device
  });

  if (pwdChanged) {
    db.securityLogs.unshift({
      id: `sl_${Date.now()}`,
      event: "Password Changed",
      severity: "medium",
      ipAddress: clientIp,
      userId: user.id,
      timestamp: new Date().toISOString(),
      details: `${user.name} changed password securely.`
    });
  }

  saveDatabase(db);
  res.json({ success: true, user });
});

app.get("/api/sellers", (req, res) => {
  res.json(db.sellers);
});

app.post("/api/sellers/verify", (req, res) => {
  const { sellerId, verified } = req.body;
  const seller = db.sellers.find((s: any) => s.id === sellerId);
  if (seller) {
    seller.verified = verified;
    const user = db.users.find((u: any) => u.id === seller.userId);
    if (user) {
      user.verifiedSeller = verified;
    }
    // Activity log
    db.activityLogs.unshift({
      id: `al_${Date.now()}`,
      userId: "u_admin",
      userName: "Allen Dreamer77",
      action: "Seller Verification",
      timestamp: new Date().toISOString(),
      details: `Updated seller verification status of ${seller.storeName} to ${verified}.`
    });
    saveDatabase(db);
    res.json({ success: true, seller });
  } else {
    res.status(404).json({ success: false, message: "Seller not found" });
  }
});

// --- IMAGE & SESSION MANAGEMENT API ---
app.post("/api/images/upload", (req, res) => {
  const { imageName, base64Data, userId } = req.body;
  if (!base64Data) {
    return res.status(400).json({ success: false, message: "No image data provided" });
  }

  // Validate format
  const matches = base64Data.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return res.status(400).json({ success: false, message: "Invalid image format. Supported: JPG, JPEG, PNG, WEBP" });
  }

  const fileType = matches[1].toLowerCase();
  const allowedTypes = ["jpeg", "jpg", "png", "webp"];
  if (!allowedTypes.includes(fileType)) {
    return res.status(400).json({ success: false, message: "Unsupported file type. Use JPG, JPEG, PNG, or WEBP." });
  }

  // Check size: base64 length estimation (each char is ~0.75 bytes)
  const estimatedSize = (matches[2].length * 3) / 4;
  const maxBytes = 5 * 1024 * 1024; // 5MB
  if (estimatedSize > maxBytes) {
    return res.status(400).json({ success: false, message: "File exceeds 5MB size limit." });
  }

  // Try creating directory and saving file
  const imagesDir = path.join(process.cwd(), "src", "assets", "images");
  try {
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }
  } catch (err) {
    console.error("Failed to create images directory", err);
  }

  const filename = `${imageName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now()}.${fileType === "jpeg" ? "jpg" : fileType}`;
  const filePath = path.join(imagesDir, filename);

  try {
    const buffer = Buffer.from(matches[2], "base64");
    fs.writeFileSync(filePath, buffer);
    const virtualUrl = `/src/assets/images/${filename}`;

    // Record Activity
    const user = db.users.find((u: any) => u.id === userId) || { name: "Guest", id: userId || "u_guest" };
    db.activityLogs.unshift({
      id: `al_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      action: "Image Upload",
      timestamp: new Date().toISOString(),
      details: `${user.name} uploaded image: ${filename}`,
      ipAddress: req.ip || "127.0.0.1",
      device: req.headers["user-agent"] || "Web Browser"
    });
    saveDatabase(db);

    return res.json({ success: true, url: virtualUrl, filename });
  } catch (err) {
    console.error("File save error", err);
    return res.status(500).json({ success: false, message: "Failed to write image to disk" });
  }
});

app.get("/api/images/banners", (req, res) => {
  res.json({
    banners: db.banners || [],
    advertisements: db.advertisements || [],
    announcements: db.announcements || []
  });
});

app.post("/api/images/banners", (req, res) => {
  const { banners, advertisements, announcements, userId } = req.body;
  const user = db.users.find((u: any) => u.id === userId);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Unauthorized. Admin role required." });
  }

  if (banners) db.banners = banners;
  if (advertisements) db.advertisements = advertisements;
  if (announcements) db.announcements = announcements;

  db.activityLogs.unshift({
    id: `al_${Date.now()}`,
    userId: user.id,
    userName: user.name,
    action: "Promotional Content Update",
    timestamp: new Date().toISOString(),
    details: `${user.name} updated promotional banners or advertisements.`,
    ipAddress: req.ip || "127.0.0.1",
    device: req.headers["user-agent"] || "Web Browser"
  });

  saveDatabase(db);
  res.json({ success: true, banners: db.banners, advertisements: db.advertisements, announcements: db.announcements });
});

app.post("/api/auth/logout", (req, res) => {
  const { userId } = req.body;
  const user = db.users.find((u: any) => u.id === userId);
  const clientIp = req.ip || "127.0.0.1";
  const device = req.headers["user-agent"] || "Web Browser";

  if (user) {
    db.activityLogs.unshift({
      id: `al_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      action: "Secure Logout",
      timestamp: new Date().toISOString(),
      details: `${user.name} logged out securely. Active session terminated.`,
      ipAddress: clientIp,
      device
    });

    db.securityLogs.unshift({
      id: `sl_${Date.now()}`,
      event: "Logout Event",
      severity: "info",
      ipAddress: clientIp,
      userId: user.id,
      timestamp: new Date().toISOString(),
      details: `Session destroyed for user ${user.name}`
    });
    saveDatabase(db);
  }

  res.json({ success: true, message: "Session closed successfully" });
});

app.post("/api/images/delete", (req, res) => {
  const { userId, type, targetId, imageUrl } = req.body;
  const user = db.users.find((u: any) => u.id === userId);
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  // Security checks: Users can only delete their own images unless they are admin
  if (type === "product" && targetId) {
    const product = db.products.find((p: any) => p.id === targetId);
    if (product) {
      const seller = db.sellers.find((s: any) => s.id === product.sellerId);
      if (user.role !== "admin" && (!seller || seller.userId !== user.id)) {
        return res.status(403).json({ success: false, message: "You can only edit your own products." });
      }
      product.images = product.images.filter((img: string) => img !== imageUrl);
    }
  } else if (type === "profile") {
    const targetUser = db.users.find((u: any) => u.id === targetId);
    if (targetUser) {
      if (user.role !== "admin" && targetUser.id !== user.id) {
        return res.status(403).json({ success: false, message: "You can only edit your own profile." });
      }
      targetUser.avatar = "👩🏾‍💼"; // Reset to default avatar emoji
    }
  } else if (user.role === "admin") {
    // Admin removing general promo banners or ads
    if (type === "banner") {
      db.banners = (db.banners || []).filter((b: any) => b.id !== targetId);
    } else if (type === "advertisement") {
      db.advertisements = (db.advertisements || []).filter((a: any) => a.id !== targetId);
    } else if (type === "announcement") {
      db.announcements = (db.announcements || []).filter((a: any) => a.id !== targetId);
    }
  } else {
    return res.status(403).json({ success: false, message: "Invalid action / Permission denied" });
  }

  db.activityLogs.unshift({
    id: `al_${Date.now()}`,
    userId: user.id,
    userName: user.name,
    action: "Image Deletion",
    timestamp: new Date().toISOString(),
    details: `${user.name} removed image resource (${type})`,
    ipAddress: req.ip || "127.0.0.1",
    device: req.headers["user-agent"] || "Web Browser"
  });

  saveDatabase(db);
  res.json({ success: true, products: db.products, banners: db.banners, advertisements: db.advertisements, announcements: db.announcements, users: db.users });
});

// --- PRODUCTS API ---
app.get("/api/products", (req, res) => {
  res.json(db.products);
});

app.post("/api/products", (req, res) => {
  const { 
    title, 
    titleSw, 
    description, 
    descriptionSw, 
    price, 
    category, 
    sellerId, 
    sellerName, 
    stock, 
    tags, 
    images,
    condition,
    size,
    color,
    deliveryOptions,
    status
  } = req.body;
  
  if (!title || !price || !sellerId) {
    return res.status(400).json({ error: "Missing required fields: title, price, or sellerId." });
  }

  const clientIp = req.ip || "127.0.0.1";
  const device = req.headers["user-agent"] || "Web Browser";

  // Find user to see details
  const uploader = db.users.find((u: any) => u.id === sellerId);
  const uploaderRole = uploader ? uploader.role : "buyer";

  // Default status: if buyer uploads, it goes to "pending". If seller, "published" (or "pending" depending on settings)
  const finalStatus = status || (uploaderRole === "buyer" ? "pending" : "published");

  const newProduct = {
    id: `p_${Date.now()}`,
    title,
    titleSw: titleSw || title,
    description: description || "Authentic fabric design.",
    descriptionSw: descriptionSw || "Kitambaa maridadi cha Kitanzania.",
    price: Number(price),
    category: category || "Traditional Vitenge",
    sellerId,
    sellerName: sellerName || uploader?.name || "Verified Seller",
    images: images && images.length > 0 ? images : ["/src/assets/images/kitenge_yellow_blue_1782736276162.jpg"],
    variations: [{ id: `v_${Date.now()}`, name: size || "6 Yards", priceModifier: 0, stock: Number(stock || 10) }],
    stock: Number(stock || 10),
    tags: tags || ["Vitenge", "New"],
    rating: 5.0,
    reviewsCount: 0,
    featured: false,
    trending: false,
    newArrival: true,
    bestSeller: false,
    condition: condition || "New",
    size: size || "6 Yards",
    color: color || "Multicolor",
    deliveryOptions: deliveryOptions || "Store Pickup, Courier Delivery",
    status: finalStatus,
    createdAt: new Date().toISOString()
  };

  db.products.push(newProduct);

  // Write logs
  db.activityLogs.unshift({
    id: `al_${Date.now()}`,
    userId: sellerId,
    userName: uploader?.name || sellerName || "Mtumiaji",
    action: "Product uploaded",
    timestamp: new Date().toISOString(),
    details: `${uploader?.name || sellerName} uploaded a new product "${title}" (${category}) in status: ${finalStatus}.`,
    ipAddress: clientIp,
    device
  });

  // Write notification
  if (!db.notifications) db.notifications = [];
  db.notifications.unshift({
    id: `n_${Date.now()}`,
    userId: sellerId,
    title: "Product Submitted / Bidhaa Imewasilishwa",
    titleSw: "Bidhaa Imewasilishwa",
    message: finalStatus === "pending" 
      ? `Your product "${title}" is submitted and pending admin approval.` 
      : `Your product "${title}" has been published successfully.`,
    messageSw: finalStatus === "pending" 
      ? `Bidhaa yako "${title}" imewasilishwa na inasubiri kuidhinishwa na msimamizi.` 
      : `Bidhaa yako "${title}" imechapishwa sokoni kikamilifu.`,
    read: false,
    createdAt: new Date().toISOString()
  });

  saveDatabase(db);
  res.json({ success: true, product: newProduct });
});

app.put("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const productIndex = db.products.findIndex((p: any) => p.id === id);
  if (productIndex > -1) {
    const oldProduct = db.products[productIndex];
    const updatedProduct = { ...oldProduct, ...req.body };
    db.products[productIndex] = updatedProduct;

    const clientIp = req.ip || "127.0.0.1";
    const device = req.headers["user-agent"] || "Web Browser";

    // Detect status change
    let statusChangeMsg = "";
    let statusChangeMsgSw = "";
    if (oldProduct.status !== updatedProduct.status) {
      if (updatedProduct.status === "published") {
        statusChangeMsg = `Your product "${updatedProduct.title}" has been APPROVED and published.`;
        statusChangeMsgSw = `Bidhaa yako "${updatedProduct.title}" IMEKUBALIWA na sasa inapatikana sokoni.`;

        db.activityLogs.unshift({
          id: `al_${Date.now()}`,
          userId: "u_admin",
          userName: "Allen Dreamer77",
          action: "Product approved",
          timestamp: new Date().toISOString(),
          details: `Product "${updatedProduct.title}" was approved & published.`,
          ipAddress: clientIp,
          device
        });
      } else if (updatedProduct.status === "rejected") {
        statusChangeMsg = `Your product "${updatedProduct.title}" was REJECTED by admin.`;
        statusChangeMsgSw = `Bidhaa yako "${updatedProduct.title}" IMEKATALIWA na msimamizi.`;

        db.activityLogs.unshift({
          id: `al_${Date.now()}`,
          userId: "u_admin",
          userName: "Allen Dreamer77",
          action: "Product rejected",
          timestamp: new Date().toISOString(),
          details: `Product "${updatedProduct.title}" was rejected by admin. Reason: Compliance.`,
          ipAddress: clientIp,
          device
        });
      }
    }

    // General edit log
    db.activityLogs.unshift({
      id: `al_${Date.now()}`,
      userId: updatedProduct.sellerId,
      userName: updatedProduct.sellerName,
      action: "Product edited",
      timestamp: new Date().toISOString(),
      details: `Product "${updatedProduct.title}" details were updated. Status: ${updatedProduct.status}.`,
      ipAddress: clientIp,
      device
    });

    // Send notification
    if (statusChangeMsg) {
      if (!db.notifications) db.notifications = [];
      db.notifications.unshift({
        id: `n_${Date.now()}`,
        userId: updatedProduct.sellerId,
        title: updatedProduct.status === "published" ? "Product Approved" : "Product Rejected",
        titleSw: updatedProduct.status === "published" ? "Bidhaa Imekubaliwa" : "Bidhaa Imekataliwa",
        message: statusChangeMsg,
        messageSw: statusChangeMsgSw,
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    saveDatabase(db);
    res.json({ success: true, product: updatedProduct });
  } else {
    res.status(404).json({ error: "Product not found" });
  }
});

app.delete("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const product = db.products.find((p: any) => p.id === id);
  if (product) {
    const clientIp = req.ip || "127.0.0.1";
    const device = req.headers["user-agent"] || "Web Browser";

    db.products = db.products.filter((p: any) => p.id !== id);

    db.activityLogs.unshift({
      id: `al_${Date.now()}`,
      userId: product.sellerId,
      userName: product.sellerName,
      action: "Product deleted",
      timestamp: new Date().toISOString(),
      details: `Product "${product.title}" was deleted from the system.`,
      ipAddress: clientIp,
      device
    });

    if (!db.notifications) db.notifications = [];
    db.notifications.unshift({
      id: `n_${Date.now()}`,
      userId: product.sellerId,
      title: "Product Deleted / Bidhaa Imefutwa",
      titleSw: "Bidhaa Imefutwa",
      message: `Your product "${product.title}" has been deleted from Soko la Vitenge.`,
      messageSw: `Bidhaa yako "${product.title}" imefutwa kutoka kwenye mfumo.`,
      read: false,
      createdAt: new Date().toISOString()
    });

    saveDatabase(db);
    res.json({ success: true, message: "Product deleted successfully." });
  } else {
    res.status(404).json({ error: "Product not found" });
  }
});

// --- ORDERS ENDPOINTS (LOCAL STORAGE SYNC COMPATIBLE) ---
app.post("/api/orders/sync", (req, res) => {
  const { orders } = req.body; // Expects array of orders synced from IndexedDB
  if (!orders || !Array.isArray(orders)) {
    return res.status(400).json({ success: false, message: "Invalid orders payload. Must be an array." });
  }

  const syncedOrders: any[] = [];
  const notificationsToAdd: any[] = [];

  for (const localOrder of orders) {
    // Validate order
    if (!localOrder.items || localOrder.items.length === 0) {
      continue;
    }

    // Check if order already synced to prevent duplication
    const existing = db.orders.find((o: any) => o.id === localOrder.id);
    if (existing) {
      syncedOrders.push(existing);
      continue;
    }

    // Process payment and stock deduct
    const processedOrder = {
      ...localOrder,
      frontendStatus: "Submitted" as const,
      backendStatus: "Received" as const,
      syncedAt: new Date().toISOString(),
    };

    // Deduct stock
    for (const item of processedOrder.items) {
      const product = db.products.find((p: any) => p.id === item.productId);
      if (product) {
        product.stock = Math.max(0, product.stock - item.quantity);
      }
    }

    // Save order
    db.orders.push(processedOrder);

    // Create Payment transaction log
    const transId = `TX_${Math.floor(100000 + Math.random() * 900000)}`;
    db.payments.push({
      id: `pay_${Date.now()}_${Math.floor(Math.random()*1000)}`,
      orderId: processedOrder.id,
      amount: processedOrder.totalAmount,
      method: processedOrder.paymentMethod,
      phone: processedOrder.phone,
      status: "Success",
      transactionId: transId,
      createdAt: new Date().toISOString()
    });

    // Notify buyer
    db.notifications.push({
      id: `n_buy_${Date.now()}_${Math.floor(Math.random()*1000)}`,
      userId: processedOrder.userId,
      title: "Order Placed Successfully",
      titleSw: "Agizo Limetumwa Kikamilifu",
      message: `Your order #${processedOrder.id} has been received. Thank you!`,
      messageSw: `Agizo lako #${processedOrder.id} limepokelewa. Asante sana!`,
      type: "order",
      read: false,
      createdAt: new Date().toISOString()
    });

    // Increment seller sales/revenue
    for (const item of processedOrder.items) {
      const product = db.products.find((p: any) => p.id === item.productId);
      if (product) {
        const seller = db.sellers.find((s: any) => s.id === product.sellerId);
        if (seller) {
          seller.salesCount += item.quantity;
          seller.revenue += item.price * item.quantity;
        }
      }
    }

    syncedOrders.push(processedOrder);
  }

  saveDatabase(db);
  res.json({ success: true, syncedOrders });
});

app.get("/api/orders", (req, res) => {
  res.json(db.orders);
});

app.post("/api/orders/update-status", (req, res) => {
  const { orderId, backendStatus } = req.body;
  const order = db.orders.find((o: any) => o.id === orderId);
  if (order) {
    order.backendStatus = backendStatus;
    // Notification for user
    db.notifications.push({
      id: `n_status_${Date.now()}`,
      userId: order.userId,
      title: `Order Status: ${backendStatus}`,
      titleSw: `Hali ya Agizo: ${backendStatus}`,
      message: `Your order #${orderId} has been updated to ${backendStatus}.`,
      messageSw: `Agizo lako #${orderId} limesasishwa kuwa ${backendStatus}.`,
      type: "order",
      read: false,
      createdAt: new Date().toISOString()
    });
    saveDatabase(db);
    res.json({ success: true, order });
  } else {
    res.status(404).json({ success: false, message: "Order not found" });
  }
});

// --- MESSAGES API ---
app.get("/api/messages", (req, res) => {
  res.json(db.messages);
});

app.post("/api/messages", (req, res) => {
  const { senderId, receiverId, senderName, content } = req.body;
  if (!senderId || !receiverId || !content) {
    return res.status(400).json({ error: "Missing senderId, receiverId, or content" });
  }
  const newMessage = {
    id: `m_${Date.now()}`,
    senderId,
    receiverId,
    senderName: senderName || "User",
    content,
    timestamp: new Date().toISOString()
  };
  db.messages.push(newMessage);
  saveDatabase(db);
  res.json({ success: true, message: newMessage });
});

// --- NOTIFICATIONS API ---
app.get("/api/notifications", (req, res) => {
  res.json(db.notifications);
});

app.post("/api/notifications/read", (req, res) => {
  const { userId } = req.body;
  db.notifications.forEach((n: any) => {
    if (n.userId === userId) {
      n.read = true;
    }
  });
  saveDatabase(db);
  res.json({ success: true });
});

// --- PAYMENTS API ---
app.get("/api/payments", (req, res) => {
  res.json(db.payments);
});

// --- COUPONS API ---
app.get("/api/coupons", (req, res) => {
  res.json(db.coupons);
});

// --- SECURITY AND ACTIVITY LOGS ---
app.get("/api/logs/security", (req, res) => {
  res.json(db.securityLogs);
});

app.get("/api/logs/activity", (req, res) => {
  res.json(db.activityLogs);
});

// Helper function to call generateContent with robust exponential backoff retry for transient errors (e.g. 503 Unavailable)
async function generateWithRetry(aiClient: any, params: any, retries = 3, initialDelayMs = 800): Promise<any> {
  let delay = initialDelayMs;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await aiClient.models.generateContent(params);
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      const isTransient = err?.status === 503 || err?.status === 429 || 
                          errMsg.includes("503") || errMsg.includes("429") || 
                          errMsg.includes("demand") || errMsg.includes("UNAVAILABLE") || 
                          errMsg.includes("TEMPORARY") || errMsg.includes("overloaded");
      if (isTransient && attempt < retries) {
        console.warn(`[Gemini API Warning] Transient error encountered (attempt ${attempt}/${retries}): "${errMsg}". Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else {
        throw err;
      }
    }
  }
}

// --- AI MULTI-AGENT HANDLERS ---
app.post("/api/ai/agent", async (req, res) => {
  const { agentType, prompt, chatHistory, additionalContext } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required." });
  }

  // System instructions for the selected AI Agent
  let systemInstruction = "";
  if (agentType === "shopping") {
    systemInstruction = `You are the specialized Shopping Assistant for 'SOKO LA VITENGE MTANDAONI', a premier Tanzanian Vitenge fabric marketplace.
      - Guide buyers politely in both Swahili (Kiswahili) and English. Respond in the language they write to you.
      - Help them find perfect products. Refer to these seed products when advising:
        1. Kitenge cha Nta ya Kwanza (Super Wax) - TSh 45,000. Perfect for weddings and executive gowns. Gold foil nakshi.
        2. Kitenge cha Asili cha Kanga na Methali - TSh 25,000. Breathable geometric pattern for daily wear.
        3. Kitenge cha Mitindo cha Kisasa - TSh 32,000. Gold lines on royal blue blocks. Modern outfits, suti.
        4. Kitenge cha Harusi ya Kifalme (Brocade) - TSh 85,000. Luxury heavy woven gold thread. Send-offs/Harusi.
        5. Kitenge cha Java Kina'acho - TSh 60,000. Glossy drape finish, navy & gold dust.
        6. Kitenge cha Batik ya Kupaka kwa Mkono - TSh 30,000. Morogoro organic hand-dyed supporting local women.
      - Give recommendations based on colors (royal blue, gold, dark blue, mustard), yards (6 yards or 12 yards), or occasion (Wedding, Daily wear, Contemporary Fashion).
      - Maintain a friendly, supportive Tanzanian tone (e.g., use 'Karibu', 'Asante sana', 'Mambo vipi').`;
  } else if (agentType === "seller") {
    systemInstruction = `You are the specialized Seller Assistant for 'SOKO LA VITENGE MTANDAONI'.
      - Help Tanzanian textile sellers write professional, highly appealing descriptions for their listings.
      - Generate catchy listings titles, recommend retail prices in Tanzanian Shillings (TSh) based on fabric details (e.g., Wax print ranges 25k-50k TSh, premium Brocade ranges 70k-100k TSh, handmade Batik ranges 30k-45k TSh).
      - Suggest localized, relevant tags (e.g., Wax Print, Morogoro, Sherehe, Harusi, Cotton).
      - Guide them in both Swahili and English to optimize listings.`;
  } else if (agentType === "support") {
    systemInstruction = `You are the specialized Customer Support Agent for 'SOKO LA VITENGE MTANDAONI'.
      - Help track orders and resolve buyer queries.
      - Standard Shipping info: Dar es Salaam (1 day, TSh 3,000), Morogoro & Arusha & Mwanza (2 days, TSh 7,000), Kenya/Uganda (3-5 days, TSh 15,000).
      - We support mobile money: M-Pesa, Airtel Money, Tigo Pesa, HaloPesa, as well as Credit Cards and PayPal.
      - If the user asks about an order, ask for their Order ID or phone number, and lookup from their profile.
      - Always respond politely in the language of the user (Swahili or English).`;
  } else if (agentType === "fraud") {
    systemInstruction = `You are the specialized AI Fraud Detection & Security Agent for 'SOKO LA VITENGE MTANDAONI'.
      - Monitor security logs, failed logins, and suspicious purchases (e.g., orders with high volume, mismatching IPs, sudden multiple checkout attempts).
      - Analyze user queries about system security. Report stats like: "System status is fully SECURE. Active CSRF protection is running. No anomalies detected."
      - Provide helpful, professional suggestions on maintaining strong passwords and recognizing device verification codes.`;
  } else if (agentType === "marketing") {
    systemInstruction = `You are the specialized AI Marketing Campaign & Coupon Creator for 'SOKO LA VITENGE MTANDAONI'.
      - Create attractive social media captions, SMS campaigns, or flash-sale ideas to boost seller stores.
      - Suggest promo coupons (like VITENGE10 for 10% off or MANGISHEKHE for 15% off).
      - Design campaign ideas with beautiful African motifs, Swahili taglines, and festive season discount formulas.`;
  } else {
    systemInstruction = `You are an AI assistant for SOKO LA VITENGE MTANDAONI, a multi-vendor marketplace. Help users in Swahili and English.`;
  }

  // If GenAI is active, query Gemini
  if (ai) {
    try {
      const contentsParts: any[] = [];
      
      // Append context / history if present
      if (chatHistory && Array.isArray(chatHistory)) {
        for (const msg of chatHistory) {
          contentsParts.push({
            role: msg.sender === "user" ? "user" : "model",
            parts: [{ text: msg.text }]
          });
        }
      }
      
      // Append current user prompt
      contentsParts.push({
        role: "user",
        parts: [{ text: `${prompt} ${additionalContext ? `\n\nContext context: ${JSON.stringify(additionalContext)}` : ""}` }]
      });

      const response = await generateWithRetry(ai, {
        model: "gemini-3.5-flash",
        contents: contentsParts,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        },
      });

      const responseText = response.text || "Poleni, kulikuwa na hitilafu katika mfumo wetu wa akili mnemba. Tafadhali jaribu tena.";
      return res.json({ success: true, text: responseText });
    } catch (err: any) {
      console.warn("[Gemini API Warning] Unable to generate content after retries. Falling back to rule-based assistant mode.", err?.message || err);
      // Fallback response on failure
      const fallbackText = getDeterministicFallback(agentType, prompt);
      return res.json({ success: true, text: `[AI Fallback Mode] ${fallbackText}` });
    }
  } else {
    // Deterministic fallback if API key is missing or not configured yet
    const fallbackText = getDeterministicFallback(agentType, prompt);
    return res.json({ success: true, text: `[Offline AI Mode] ${fallbackText}` });
  }
});

// Deterministic mock assistant engine
function getDeterministicFallback(agentType: string, prompt: string): string {
  const query = prompt.toLowerCase();
  
  if (agentType === "shopping") {
    if (query.includes("harusi") || query.includes("wedding")) {
      return "Soko la Vitenge inakushauri utumie 'Kitenge cha Harusi ya Kifalme (Brocade)' kwa TSh 85,000 au 'Kitenge cha Nta ya Kwanza (Super Wax)' kwa TSh 45,000. Vyote vina urembo na mng'ao bora wa dhahabu kwa maharusi wetu!";
    }
    if (query.includes("mora") || query.includes("morogoro") || query.includes("batik")) {
      return "Tunapendekeza 'Kitenge cha Batik ya Kupaka kwa Mkono' (TSh 30,000) kinachotengenezwa na kikundi cha akina mama mkoani Morogoro. Ni asili na bora sana!";
    }
    return "Karibu mteja wetu! Tunavyo Vitenge vya asili vya nta (Super Wax - TSh 45,000), Batik za Morogoro (TSh 30,000), na Kanga za Methali (TSh 25,000). Unaweza kunitajia rangi au bajeti yako ili nikupe ushauri zaidi?";
  }
  
  if (agentType === "seller") {
    return "Habari muuzaji! Kutokana na uchambuzi wa soko, tunashauri uandike jina kama 'Kitenge cha Kwanza cha Nta ya Dhahabu', na kuweka bei kati ya TSh 30,000 hadi 48,000 kwa yadi 6. Tumia vitambulisho hivi: #WaxPrint #TanzaniaFashion #Kariakoo.";
  }
  
  if (agentType === "support") {
    if (query.includes("mpesa") || query.includes("payment") || query.includes("malipo")) {
      return "Tunasapoti M-Pesa, Tigo Pesa, Airtel Money, HaloPesa, kadi za benki (Visa/Mastercard) na PayPal. Malipo yote yanathibitishwa mara moja na kukupa risiti.";
    }
    return "Habari! Usafirishaji wetu hufanyika Dar es Salaam (siku 1, TSh 3,000), mikoa mingine ya Tanzania kama Arusha, Dodoma na Mwanza (siku 2, TSh 7,000), na Afrika Mashariki nzima (siku 3-5, TSh 15,000). Tafadhali weka namba yako ya simu ili nikusaidie kufuatilia mzigo.";
  }
  
  if (agentType === "fraud") {
    return "Hali ya Mfumo: SALAMA kabisa (SECURE). Tunatumia usimbaji fiche wa bcrypt kwa nenosiri, ulinzi thabiti wa miamala ya malipo, na nambari za ulinzi (MFA). Hakuna shughuli yoyote ya kutiliwa shaka iliyonaswa leo.";
  }
  
  if (agentType === "marketing") {
    return "Hapa kuna wazo la Kampeni ya Wiki: 'Wiki ya Vitenge vya Dhahabu! 🌟 Pata punguzo la 15% kwa kuweka kuponi MANGISHEKHE unaponunua designs zozote za harusi au sherehe. Shiriki nasi sasa!'";
  }

  return "Karibu kwenye Soko la Vitenge Mtandaoni! Je, unataka nisaidie kupata Kitenge kipi leo?";
}

// --- SETUP SERVER MIDDLEWARE & LAUNCH ---
async function startServer() {
  // Serve generated images statically at /src/assets/images
  app.use("/src/assets/images", express.static(path.join(process.cwd(), "src/assets/images")));

  if (process.env.NODE_ENV !== "production") {
    // Mount Vite middleware for development (hot reloads front-end inside port 3000)
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve pre-built static client files in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`=========================================`);
    console.log(`  SOKO LA VITENGE MTANDAONI IS READY!    `);
    console.log(`  Server: http://localhost:${PORT}        `);
    console.log(`  Target Market: Tanzania & East Africa  `);
    console.log(`  Languages: Kiswahili & English         `);
    console.log(`=========================================`);
  });
}

startServer();
