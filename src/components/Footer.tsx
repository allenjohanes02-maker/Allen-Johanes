/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { MessageSquare, Phone, Globe, Shield, Heart } from "lucide-react";

interface FooterProps {
  isSwahili: boolean;
}

export default function Footer({ isSwahili }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="main-footer" className="bg-slate-950 text-slate-100 border-t-4 border-yellow-500 mt-16 transition-colors duration-300 relative overflow-hidden">
      {/* Delicate background fabric pattern */}
      <div className="absolute inset-0 opacity-5 bg-fabric-pattern pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🇹🇿</span>
              <span className="text-xl font-display-serif font-bold tracking-wide text-yellow-400">
                SOKO LA VITENGE MTANDAONI
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              {isSwahili
                ? "Soko kuu la mtandaoni linalounganisha wanunuzi na wauzaji wa Vitenge halisi na bora vya kiasili nchini Tanzania na Afrika Mashariki."
                : "The leading online multi-vendor marketplace connecting buyers and sellers of authentic and premium Vitenge fabrics in Tanzania and East Africa."}
            </p>
            <div className="flex space-x-4 text-xs text-slate-500 font-mono">
              <span className="flex items-center gap-1">📍 Dar es Salaam</span>
              <span className="flex items-center gap-1">🌐 East Africa</span>
            </div>
          </div>

          {/* Links Column */}
          <div>
            <h3 className="text-md font-display-serif font-semibold text-white mb-4 border-b border-slate-800 pb-2">
              {isSwahili ? "Msaada na Huduma" : "Customer Support"}
            </h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <a href="#about" className="hover:text-yellow-400 transition-colors">
                  {isSwahili ? "Kuhusu Sisi" : "About Us"}
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-yellow-400 transition-colors">
                  {isSwahili ? "Wasiliana Nasi" : "Contact Us"}
                </a>
              </li>
              <li>
                <a href="#terms" className="hover:text-yellow-400 transition-colors">
                  {isSwahili ? "Vigezo na Masharti" : "Terms & Conditions"}
                </a>
              </li>
              <li>
                <a href="#privacy" className="hover:text-yellow-400 transition-colors">
                  {isSwahili ? "Sera ya Faragha" : "Privacy Policy"}
                </a>
              </li>
            </ul>
          </div>

          {/* Categories Column */}
          <div>
            <h3 className="text-md font-display-serif font-semibold text-white mb-4 border-b border-slate-800 pb-2">
              {isSwahili ? "Makundi Maarufu" : "Popular Fabrics"}
            </h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>{isSwahili ? "Vitenge vya Nta (Super Wax)" : "Premium Wax Prints"}</li>
              <li>{isSwahili ? "Vitenge vya Harusi (Brocade)" : "Royal Wedding Fabrics"}</li>
              <li>{isSwahili ? "Batik za Morogoro" : "Morogoro Hand-Dyed Batiks"}</li>
              <li>{isSwahili ? "Kanga za Asili na Methali" : "Traditional Swahili Kangas"}</li>
            </ul>
          </div>

          {/* Permanent Developer Section & Contact Card */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-yellow-500/30 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold tracking-wider text-yellow-400 uppercase flex items-center gap-1">
              <Shield className="w-4 h-4 text-yellow-500" />
              {isSwahili ? "MSANIFU WA MFUMO" : "DEVELOPER CARD"}
            </h3>
            
            <div className="space-y-2">
              <div className="text-base font-bold text-white">Allen Dreamer77</div>
              <p className="text-xs text-slate-400">
                {isSwahili 
                  ? "Msanifu na mhandisi mkuu wa mifumo ya biashara mtandaoni ya kiwango cha juu."
                  : "Lead enterprise fullstack architect & developer specialized in luxury web commerce."}
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-300 font-mono">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-yellow-500" />
                <span>+255 714 202 298</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-yellow-500" />
                <span>Tanzania / East Africa</span>
              </div>
            </div>

            {/* Clickable WhatsApp Button */}
            <a
              id="whatsapp-dev-btn"
              href="https://wa.me/255714202298"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs py-2 px-3 rounded-lg transition-all shadow-md focus:ring-2 focus:ring-emerald-400 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{isSwahili ? "Wasiliana kwa WhatsApp" : "Chat on WhatsApp"}</span>
            </a>
          </div>

        </div>

        {/* Bottom Banner */}
        <div className="mt-12 pt-8 border-t border-slate-900 text-center flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            &copy; {currentYear} Soko la Vitenge Mtandaoni. {isSwahili ? "Haki zote zimehifadhiwa." : "All rights reserved."}
          </p>
          <p className="flex items-center gap-1 justify-center md:justify-end">
            <span>{isSwahili ? "Imetengenezwa na" : "Designed & Developed by"}</span>
            <a 
              href="https://wa.me/255714202298" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-yellow-400 hover:underline font-semibold"
            >
              Allen Dreamer77
            </a>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" />
          </p>
        </div>      </div>
    </footer>
  );
}
