/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { 
  Sparkles, 
  ShoppingBag, 
  Store, 
  HelpCircle, 
  ShieldCheck, 
  TrendingUp, 
  Send, 
  X,
  MessageCircle
} from "lucide-react";
import { AIConversationMessage } from "../types";

interface AiAssistantHubProps {
  isSwahili: boolean;
  isDarkMode: boolean;
  onClose: () => void;
  initialAgentType?: "shopping" | "seller" | "support" | "fraud" | "marketing";
}

interface Agent {
  type: "shopping" | "seller" | "support" | "fraud" | "marketing";
  name: string;
  nameSw: string;
  icon: React.ReactNode;
  color: string;
  greeting: string;
  greetingSw: string;
  quickPrompts: string[];
  quickPromptsSw: string[];
}

export default function AiAssistantHub({
  isSwahili,
  isDarkMode,
  onClose,
  initialAgentType = "shopping"
}: AiAssistantHubProps) {
  const [selectedAgent, setSelectedAgent] = useState<"shopping" | "seller" | "support" | "fraud" | "marketing">(initialAgentType);
  const [conversations, setConversations] = useState<Record<string, AIConversationMessage[]>>({
    shopping: [],
    seller: [],
    support: [],
    fraud: [],
    marketing: []
  });
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // List of 5 AI Agents
  const agents: Agent[] = [
    {
      type: "shopping",
      name: "Shopping Assistant",
      nameSw: "Mshauri wa Ununuzi",
      icon: <ShoppingBag className="w-4 h-4" />,
      color: "bg-blue-500",
      greeting: "Hello! I can recommend the perfect Vitenge for your occasion, budget, or preferred color. Ask me anything!",
      greetingSw: "Habari! Naweza kukupendekezea Vitenge bora kulingana na sherehe yako, bajeti, au rangi unayoipenda. Niulize lolote!",
      quickPrompts: ["Recommend a wedding kitenge", "What is the best daily wear kitenge?", "Show premium gold foil fabrics"],
      quickPromptsSw: ["Nipendekezee Kitenge cha harusi", "Kitenge kipi kizuri cha kuvaa kila siku?", "Nionyeshe Vitenge vyenye nakshi ya dhahabu"]
    },
    {
      type: "seller",
      name: "Seller Assistant",
      nameSw: "Msaidizi wa Wauzaji",
      icon: <Store className="w-4 h-4" />,
      color: "bg-purple-500",
      greeting: "Welcome seller! Tell me your fabric's specifications, and I'll generate a professional title, description, price, and tags for you.",
      greetingSw: "Karibu muuzaji! Nieleze sifa za kitambaa chako, nami nitakutengenezea jina la kuvutia, maelezo mazuri, bei, na vitambulisho (tags).",
      quickPrompts: ["Generate description for local batik", "Price advice for premium silk wax", "Suggest hashtags for African fabrics"],
      quickPromptsSw: ["Nandikie maelezo ya batik ya Morogoro", "Ushauri wa bei ya Super Wax", "Vitambulisho gani vinafaa kwa Kitenge"]
    },
    {
      type: "support",
      name: "Customer Support Agent",
      nameSw: "Huduma kwa Wateja",
      icon: <HelpCircle className="w-4 h-4" />,
      color: "bg-emerald-500",
      greeting: "Hi there! I am here to assist with delivery rates, tracking, and mobile money payments (M-Pesa, Tigo Pesa).",
      greetingSw: "Habari mteja! Niko hapa kukusaidia kuhusu gharama za usafirishaji, jinsi ya kulipia kwa M-Pesa, na kufuatilia mzigo wako.",
      quickPrompts: ["What are shipping rates to Arusha?", "Can I pay using M-Pesa?", "How do I track my order?"],
      quickPromptsSw: ["Gharama za kutuma mzigo Arusha ni ngapi?", "Je, naweza kulipia kwa M-Pesa?", "Nitafuatiliaje agizo langu?"]
    },
    {
      type: "fraud",
      name: "Fraud & Security monitor",
      nameSw: "Ulinzi na Usalama",
      icon: <ShieldCheck className="w-4 h-4" />,
      color: "bg-red-500",
      greeting: "Security Monitoring active. I scan logs, failed logins, and help users confirm if their connection is secure.",
      greetingSw: "Ufuatiliaji wa Usalama upo hai. Nakagua kumbukumbu za mfumo na kukusaidia kujua usalama wa akaunti na kuzuia ulaghai.",
      quickPrompts: ["Is my payment transaction secure?", "Check system security status", "How to set up password lock"],
      quickPromptsSw: ["Je, malipo yangu yapo salama?", "Kagua hali ya usalama ya mfumo", "Jinsi ya kulinda akaunti yangu"]
    },
    {
      type: "marketing",
      name: "Marketing Agent",
      nameSw: "Mtaalamu wa Masoko",
      icon: <TrendingUp className="w-4 h-4" />,
      color: "bg-amber-500",
      greeting: "Let's boost your sales! I can write social media posts, promotional captions, or suggest discount coupon rules.",
      greetingSw: "Wacha tuongeze mauzo! Naweza kukuandikia makala ya mitandao ya kijamii, ujumbe wa ofa, au kukupendekezea kuponi za punguzo.",
      quickPrompts: ["Create a Facebook caption for discount", "Campaign idea for wedding season", "Suggest a Swahili marketing slogan"],
      quickPromptsSw: ["Andika tangazo la Facebook la punguzo la bei", "Kampeni ya msimu wa harusi", "Nipe msemo wa kiswahili wa biashara"]
    }
  ];

  const activeAgent = agents.find(a => a.type === selectedAgent)!;

  // Auto scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, selectedAgent, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    // Save user message
    const userMsg: AIConversationMessage = { sender: "user", text: textToSend };
    const currentHistory = conversations[selectedAgent];
    
    setConversations(prev => ({
      ...prev,
      [selectedAgent]: [...prev[selectedAgent], userMsg]
    }));
    setInputVal("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentType: selectedAgent,
          prompt: textToSend,
          chatHistory: currentHistory
        })
      });
      const data = await response.json();
      
      const aiMsg: AIConversationMessage = {
        sender: "ai",
        text: data.text || (isSwahili ? "Samahani, mtandao una hitilafu kidogo." : "Apologies, there was an issue retrieving a response.")
      };

      setConversations(prev => ({
        ...prev,
        [selectedAgent]: [...prev[selectedAgent], aiMsg]
      }));
    } catch (e) {
      console.error(e);
      setConversations(prev => ({
        ...prev,
        [selectedAgent]: [...prev[selectedAgent], {
          sender: "ai",
          text: isSwahili ? "Hitilafu imetokea. Tafadhali jaribu tena." : "An error occurred. Please try again."
        }]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="ai-assistant-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className={`w-full max-w-4xl h-[85vh] rounded-2xl flex flex-col md:flex-row overflow-hidden shadow-2xl transition-colors duration-300 border border-amber-500/20 ${
        isDarkMode ? "bg-slate-900 text-white" : "bg-white text-slate-800"
      }`}>
        
        {/* Left Sidebar - Agent Selector */}
        <div className={`w-full md:w-80 border-r flex flex-col p-4 ${
          isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-100"
        }`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold font-sans text-base text-amber-500 flex items-center gap-2">
              <Sparkles className="w-5 h-5 animate-spin" />
              <span>{isSwahili ? "Mawakala wa AI" : "AI Multi-Agent Hub"}</span>
            </h3>
            <button onClick={onClose} className="md:hidden p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto pr-1">
            {agents.map((agent) => (
              <button
                key={agent.type}
                onClick={() => setSelectedAgent(agent.type)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                  selectedAgent === agent.type
                    ? "bg-amber-500 text-white shadow-md font-bold"
                    : isDarkMode 
                      ? "hover:bg-slate-800 text-slate-300" 
                      : "hover:bg-slate-200 text-slate-700"
                }`}
              >
                <div className={`p-1.5 rounded-lg text-white ${agent.color}`}>
                  {agent.icon}
                </div>
                <div>
                  <div>{isSwahili ? agent.nameSw : agent.name}</div>
                  <span className="text-[9px] opacity-80 block font-normal font-mono">
                    {agent.type === "fraud" ? "Enterprise Shield" : "Soko AI Agent"}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Developer Quick Brand Tag */}
          <div className="mt-4 pt-4 border-t border-slate-700/20 text-[10px] text-slate-500 text-center font-mono">
            Powered by Gemini 3.5 Flash
          </div>
        </div>

        {/* Right Chat Canvas */}
        <div className="flex-1 flex flex-col h-full bg-transparent">
          
          {/* Active Agent Header */}
          <div className={`flex justify-between items-center p-4 border-b ${
            isDarkMode ? "border-slate-800" : "border-slate-100"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl text-white ${activeAgent.color}`}>
                {activeAgent.icon}
              </div>
              <div>
                <h4 className="font-bold text-sm">
                  {isSwahili ? activeAgent.nameSw : activeAgent.name}
                </h4>
                <p className="text-xs text-slate-400">
                  {isSwahili ? "Hai • Majibu ya haraka kwa Kiswahili au Kiingereza" : "Active • Instantly supports Swahili and English"}
                </p>
              </div>
            </div>
            
            {/* Close button for all viewports */}
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            
            {/* Agent Initial greeting */}
            <div className="flex gap-2.5 max-w-[85%]">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0 ${activeAgent.color}`}>
                {activeAgent.icon}
              </div>
              <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                isDarkMode ? "bg-slate-800 text-slate-100" : "bg-slate-100 text-slate-800"
              }`}>
                {isSwahili ? activeAgent.greetingSw : activeAgent.greeting}
              </div>
            </div>

            {/* Conversation list */}
            {conversations[selectedAgent].map((msg, index) => (
              <div 
                key={index} 
                className={`flex gap-2.5 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : ""}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0 ${
                  msg.sender === "user" ? "bg-amber-500" : activeAgent.color
                }`}>
                  {msg.sender === "user" ? <MessageCircle className="w-4 h-4" /> : activeAgent.icon}
                </div>
                <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-amber-500 text-white"
                    : isDarkMode 
                      ? "bg-slate-800 text-slate-100" 
                      : "bg-slate-100 text-slate-800"
                }`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}

            {/* Loading / Thinking Indicator */}
            {isLoading && (
              <div className="flex gap-2.5 items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white animate-spin ${activeAgent.color}`}>
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-xs text-slate-400 font-mono italic animate-pulse">
                  {isSwahili ? "Msaidizi anafikiria..." : "Agent is thinking..."}
                </span>
              </div>
            )}
            
            <div ref={scrollRef} />
          </div>

          {/* Quick Prompts Panel */}
          <div className="px-4 py-2 flex flex-wrap gap-1.5">
            {(isSwahili ? activeAgent.quickPromptsSw : activeAgent.quickPrompts).map((p, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(p)}
                className={`text-[10px] font-semibold py-1 px-2.5 rounded-full border transition-all cursor-pointer ${
                  isDarkMode 
                    ? "bg-slate-800/40 border-slate-700 hover:bg-slate-800 text-amber-500 hover:border-amber-500" 
                    : "bg-amber-500/5 border-amber-500/10 hover:bg-amber-500/15 text-slate-600 hover:border-amber-500"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Message Input Bar */}
          <div className={`p-4 border-t flex gap-2 ${
            isDarkMode ? "border-slate-800 bg-slate-950/40" : "border-slate-100 bg-slate-50"
          }`}>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSendMessage(inputVal);
                }
              }}
              placeholder={isSwahili ? "Andika ujumbe wako hapa..." : "Type your message to the agent here..."}
              className={`flex-1 text-xs px-4 py-3 rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-colors ${
                isDarkMode 
                  ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500" 
                  : "bg-white border-slate-200 text-slate-800 placeholder-slate-400"
              }`}
            />
            <button
              id="send-ai-msg"
              onClick={() => handleSendMessage(inputVal)}
              disabled={!inputVal.trim() || isLoading}
              className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white p-3 rounded-xl transition-all flex items-center justify-center shadow-md hover:scale-105 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
