/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, X, User } from "lucide-react";
import { Message, User as AppUser } from "../types";

interface LiveChatProps {
  isSwahili: boolean;
  isDarkMode: boolean;
  currentUser: AppUser | null;
  messages: Message[];
  onSendMessage: (receiverId: string, content: string) => void;
}

export default function LiveChat({
  isSwahili,
  isDarkMode,
  currentUser,
  messages,
  onSendMessage
}: LiveChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeChatWith, setActiveChatWith] = useState<string>("s_kamala"); // Defaults to Kamala Vitenge store
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const activeMessages = messages.filter(
    m => (m.senderId === currentUser?.id && m.receiverId === activeChatWith) ||
         (m.senderId === activeChatWith && m.receiverId === currentUser?.id)
  );

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser) return;

    onSendMessage(activeChatWith, inputText);
    setInputText("");

    // Simulate a vendor auto-reply from Kamala Vitenge Store after 3 seconds for dynamic experience
    if (activeChatWith === "s_kamala") {
      setTimeout(() => {
        onSendMessage(
          currentUser.id,
          isSwahili
            ? "Asante kwa ujumbe wako! Kamala Vitenge store imepokea. Tutajibu mara moja."
            : "Thanks for your interest! Kamala Vitenge store manager has received your message. We will reply shortly."
        );
      }, 3000);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      
      {/* Floating Circle Button */}
      {!isOpen && (
        <button
          id="live-chat-toggle"
          onClick={() => setIsOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all flex items-center justify-center animate-bounce cursor-pointer"
          title={isSwahili ? "Meseji na Wauzaji" : "Chat with Sellers"}
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Expanded Chat Box */}
      {isOpen && (
        <div className={`w-[calc(100vw-2rem)] sm:w-80 h-96 rounded-2xl shadow-2xl flex flex-col border border-amber-500/20 overflow-hidden transition-colors duration-300 ${
          isDarkMode ? "bg-slate-900 text-white" : "bg-white text-slate-800"
        }`}>
          
          {/* Header */}
          <div className="bg-amber-500 text-white p-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-base">🏪</span>
              <div>
                <h4 className="text-xs font-bold font-sans">
                  {activeChatWith === "s_kamala" ? (isSwahili ? "Duka la Kamala" : "Kamala Store Manager") : "Mangi Store"}
                </h4>
                <p className="text-[9px] opacity-80">{isSwahili ? "Anapatikana mara moja" : "Online"}</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-amber-600 rounded-lg cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick contact switch bar */}
          <div className={`px-2 py-1.5 border-b text-[9px] font-bold flex gap-2 uppercase tracking-wide ${
            isDarkMode ? "bg-slate-950 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-100 text-slate-500"
          }`}>
            <span>{isSwahili ? "Zungumza na:" : "Chat with:"}</span>
            <button 
              onClick={() => setActiveChatWith("s_kamala")} 
              className={`hover:underline cursor-pointer ${activeChatWith === "s_kamala" ? "text-amber-500 font-bold" : ""}`}
            >
              Kamala Store
            </button>
            <span>|</span>
            <button 
              onClick={() => setActiveChatWith("s_mangi")} 
              className={`hover:underline cursor-pointer ${activeChatWith === "s_mangi" ? "text-amber-500 font-bold" : ""}`}
            >
              Mangi Fabrics
            </button>
          </div>

          {/* Message List */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
            {activeMessages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center text-[10px] text-slate-500 italic p-4">
                {isSwahili 
                  ? "Anzisha mazungumzo na duka hili kuhusu Vitenge vyao vya nta au harusi!" 
                  : "Start a conversation with this shop regarding fabric yards or customized designs!"}
              </div>
            ) : (
              activeMessages.map((m) => {
                const isMe = m.senderId === currentUser.id;
                return (
                  <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <div className={`p-2.5 rounded-xl max-w-[85%] leading-relaxed ${
                      isMe 
                        ? "bg-amber-500 text-white rounded-br-none" 
                        : isDarkMode 
                          ? "bg-slate-800 text-slate-100 rounded-bl-none" 
                          : "bg-slate-100 text-slate-800 rounded-bl-none"
                    }`}>
                      <p>{m.content}</p>
                    </div>
                    <span className="text-[8px] text-slate-500 font-mono mt-0.5">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={scrollRef} />
          </div>

          {/* Form Input */}
          <form onSubmit={handleSend} className={`p-2 border-t flex gap-1.5 ${
            isDarkMode ? "border-slate-800 bg-slate-950/40" : "border-slate-100 bg-slate-50"
          }`}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isSwahili ? "Andika ujumbe..." : "Type message..."}
              className={`flex-1 text-[11px] px-3 py-2 rounded-lg border focus:outline-hidden ${
                isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-800"
              }`}
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white p-2 rounded-lg flex items-center justify-center cursor-pointer shadow-md shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>
      )}

    </div>
  );
}
