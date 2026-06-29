/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  MapPin, 
  Lock, 
  Bell, 
  Calendar, 
  Globe, 
  CheckCircle, 
  AlertCircle, 
  Edit3, 
  Activity, 
  ShieldCheck, 
  Eye, 
  EyeOff 
} from "lucide-react";
import { User } from "../types";

interface MyAccountProps {
  isSwahili: boolean;
  isDarkMode: boolean;
  currentUser: User | null;
  onUpdateUser: (updatedUser: User) => void;
  onRefreshLogs?: () => void;
}

const AVATAR_OPTIONS = ["👩🏾‍💼", "🏬", "🏢", "👑", "👩🏾", "👨🏾", "👗", "🧶", "🌟", "🦁", "🎨", "💻"];

export default function MyAccount({
  isSwahili,
  isDarkMode,
  currentUser,
  onUpdateUser,
  onRefreshLogs
}: MyAccountProps) {
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4 animate-bounce" />
        <h3 className="text-xl font-bold">
          {isSwahili ? "Tafadhali ingia ili uone wasifu wako" : "Please log in to view your profile"}
        </h3>
      </div>
    );
  }

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser.name || "",
    email: currentUser.email || "",
    phone: currentUser.phone || "",
    physicalAddress: currentUser.physicalAddress || "",
    avatar: currentUser.avatar || "👩🏾‍💼",
    gender: currentUser.gender || "mwanaume",
    dob: currentUser.dob || "1995-01-01",
    country: currentUser.country || "Tanzania",
    region: currentUser.region || "Dar es Salaam",
    city: currentUser.city || "Dar es Salaam",
    username: currentUser.username || "",
    bio: currentUser.bio || "",
    password: "",
    confirmPassword: "",
    notificationsEnabled: currentUser.notificationsEnabled !== false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const selectAvatar = (avatar: string) => {
    setFormData(prev => ({ ...prev, avatar }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (formData.password) {
      if (formData.password.length < 8) {
        setMessage({
          type: "error",
          text: isSwahili 
            ? "Nenosiri lazima liwe na herufi zisizopungua 8!" 
            : "Password must be at least 8 characters long!"
        });
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setMessage({
          type: "error",
          text: isSwahili 
            ? "Nenosiri jipya hailingani na uthibitisho wake!" 
            : "New passwords do not match confirmation!"
        });
        return;
      }
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          ...formData
        })
      });

      const data = await response.json();
      if (data.success) {
        onUpdateUser(data.user);
        setIsEditing(false);
        setMessage({
          type: "success",
          text: isSwahili 
            ? "Wasifu wako umesasishwa kikamilifu!" 
            : "Your profile has been updated successfully!"
        });
        if (onRefreshLogs) onRefreshLogs();
      } else {
        setMessage({
          type: "error",
          text: data.message || (isSwahili ? "Mchakato umeshindwa!" : "Failed to save profile!")
        });
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      setMessage({
        type: "error",
        text: isSwahili ? "Itifaki ya mawasiliano imefeli!" : "Network request failed!"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* HEADER BANNER */}
      <div className={`relative overflow-hidden rounded-2xl mb-8 p-6 sm:p-8 border bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-slate-950/20 ${
        isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-800"
      }`}>
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-0 bottom-0 -translate-x-12 translate-y-12 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
          {/* Avatar Profile */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-5xl shadow-2xl border-4 border-slate-950/20">
              {isEditing ? formData.avatar : currentUser.avatar || "👩🏾‍💼"}
            </div>
            {isEditing && (
              <span className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-md animate-pulse">
                ✏️
              </span>
            )}
          </div>

          <div className="text-center sm:text-left flex-1">
            <div className="flex items-center flex-wrap justify-center sm:justify-start gap-2.5">
              <h2 className="text-2xl font-black tracking-tight">{currentUser.name}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                currentUser.role === "admin" 
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" 
                  : currentUser.role === "seller"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
              }`}>
                {currentUser.role === "admin" ? (isSwahili ? "Msimamizi" : "Admin") : currentUser.role === "seller" ? (isSwahili ? "Muuzaji" : "Seller") : (isSwahili ? "Mnunuzi" : "Buyer")}
              </span>
              {currentUser.verifiedSeller && (
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{isSwahili ? "KIKAMILIFU" : "VERIFIED"}</span>
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-1 font-mono">@{currentUser.username || "username"}</p>
            <p className="text-xs text-slate-500 mt-1">
              {isSwahili ? "Mwanachama tangu:" : "Member Since:"} {currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : "2026-06-25"}
            </p>
          </div>

          <button
            onClick={() => {
              setIsEditing(!isEditing);
              setMessage(null);
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-yellow-500/20 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? (isSwahili ? "Ghairi" : "Cancel") : (isSwahili ? "Hariri Wasifu" : "Edit Profile")}</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK MESSAGE */}
      {message && (
        <div className={`p-4 rounded-xl mb-6 flex items-center gap-2.5 border text-sm font-semibold animate-fade-in ${
          message.type === "success" 
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
        }`}>
          {message.type === "success" ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* DETAILED VIEW OR EDIT PROFILE */}
      {!isEditing ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* PROFILE SUMMARY SIDEBAR */}
          <div className={`p-6 rounded-2xl border space-y-6 ${
            isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-100"
          }`}>
            <div>
              <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-3">
                {isSwahili ? "Maelezo ya Kazi" : "Account Standing"}
              </h3>
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between border-b border-slate-800/10 pb-1.5">
                  <span className="text-slate-500">{isSwahili ? "Hali ya Akaunti" : "Account Status"}</span>
                  <span className="text-emerald-500 font-bold uppercase">{isSwahili ? "Inatumika" : "Active"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/10 pb-1.5">
                  <span className="text-slate-500">{isSwahili ? "Aina ya Akaunti" : "Account Type"}</span>
                  <span className="text-slate-300 font-bold uppercase">{currentUser.role}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/10 pb-1.5">
                  <span className="text-slate-500">{isSwahili ? "Kuingia Mwisho" : "Last Login"}</span>
                  <span className="text-slate-300">2026-06-29</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-2">
                {isSwahili ? "Kuhusu Mimi" : "Bio"}
              </h3>
              <p className="text-xs leading-relaxed text-slate-400 italic">
                {currentUser.bio || (isSwahili ? "Hakuna wasifu bado. Hariri wasifu wako ili uongeze maelezo mafupi kukuhusu." : "No biography added yet. Update your profile to describe yourself.")}
              </p>
            </div>

            <div className="pt-2">
              <div className="p-3.5 rounded-xl bg-yellow-500/5 border border-yellow-500/10 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-yellow-500">
                  <ShieldCheck className="w-4 h-4 text-yellow-500" />
                  <span>{isSwahili ? "Ulinzi na Usalama" : "Security & Privacy"}</span>
                </div>
                <p className="text-[10px] leading-relaxed text-slate-400">
                  {isSwahili 
                    ? "Akaunti yako inalindwa kwa hashing ya SHA-256 na vihifadhi salama vya Netlify." 
                    : "Your account credentials are fully encrypted and securely persistent on Cloud servers."}
                </p>
              </div>
            </div>
          </div>

          {/* MAIN PROFILE CARD */}
          <div className={`col-span-2 p-6 sm:p-8 rounded-2xl border ${
            isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100"
          }`}>
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-yellow-500" />
              <span>{isSwahili ? "Taarifa Binafsi za Akaunti" : "Detailed Profile Information"}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-500 font-mono uppercase tracking-wider block">{isSwahili ? "Jina Kamili" : "Full Name"}</span>
                <p className="text-sm font-medium text-slate-200">{currentUser.name}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-slate-500 font-mono uppercase tracking-wider block">{isSwahili ? "Jina la Mtumiaji" : "Username"}</span>
                <p className="text-sm font-medium text-slate-200">@{currentUser.username || "username"}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-slate-500 font-mono uppercase tracking-wider block flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-500" />
                  <span>{isSwahili ? "Barua Pepe" : "Email Address"}</span>
                </span>
                <p className="text-sm font-medium text-slate-200">{currentUser.email}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-slate-500 font-mono uppercase tracking-wider block flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-500" />
                  <span>{isSwahili ? "Nambari ya Simu" : "Phone Number"}</span>
                </span>
                <p className="text-sm font-medium text-slate-200">{currentUser.phone || "N/A"}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-slate-500 font-mono uppercase tracking-wider block flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  <span>{isSwahili ? "Tarehe ya Kuzaliwa" : "Date of Birth"}</span>
                </span>
                <p className="text-sm font-medium text-slate-200">{currentUser.dob || "N/A"}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-slate-500 font-mono uppercase tracking-wider block">
                  {isSwahili ? "Jinsia" : "Gender"}
                </span>
                <p className="text-sm font-medium text-slate-200 capitalize">{currentUser.gender || "N/A"}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-slate-500 font-mono uppercase tracking-wider block flex items-center gap-1">
                  <Globe className="w-3 h-3 text-slate-500" />
                  <span>{isSwahili ? "Nchi na Mkoa" : "Country & Region"}</span>
                </span>
                <p className="text-sm font-medium text-slate-200">
                  {currentUser.country || "Tanzania"} / {currentUser.region || "Dar es Salaam"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-slate-500 font-mono uppercase tracking-wider block flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  <span>{isSwahili ? "Mji na Anwani ya Kimwili" : "City & Physical Address"}</span>
                </span>
                <p className="text-sm font-medium text-slate-200">
                  {currentUser.city || "Dar es Salaam"}, {currentUser.physicalAddress || "Kariakoo"}
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800/10 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-slate-400">
                  {isSwahili ? "Arifa zimesanidiwa:" : "Profile activity log online."}
                </span>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isSwahili ? "Anza Kuhariri" : "Edit Profile Info"}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* EDIT PROFILE MODE FORM */
        <form onSubmit={handleSaveProfile} className={`p-6 sm:p-8 rounded-2xl border space-y-6 ${
          isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100"
        }`}>
          <div className="flex items-center gap-2 border-b border-slate-800/10 pb-4">
            <Edit3 className="w-5 h-5 text-yellow-500" />
            <h3 className="text-base font-bold uppercase tracking-wider">
              {isSwahili ? "Hariri Maelezo ya Wasifu Wako" : "Edit Your Account Profile"}
            </h3>
          </div>

          {/* AVATAR SELECTOR */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
              {isSwahili ? "Chagua Picha ya Wasifu (Avatar):" : "Select Profile Avatar / Icon:"}
            </label>
            <div className="flex flex-wrap gap-2.5 p-3 rounded-xl bg-slate-950/40 border border-slate-800/20">
              {AVATAR_OPTIONS.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => selectAvatar(av)}
                  className={`w-11 h-11 rounded-xl text-xl flex items-center justify-center transition-all ${
                    formData.avatar === av 
                      ? "bg-amber-500 text-slate-950 scale-110 shadow-lg border border-yellow-300" 
                      : "bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300"
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* BASIC INFO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase block tracking-wide">{isSwahili ? "Jina la Mtumiaji" : "Username"}</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full text-xs p-3 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase block tracking-wide">{isSwahili ? "Jina Kamili" : "Full Name"}</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full text-xs p-3 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase block tracking-wide">{isSwahili ? "Barua Pepe" : "Email Address"}</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full text-xs p-3 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase block tracking-wide">{isSwahili ? "Nambari ya Simu" : "Phone Number"}</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full text-xs p-3 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase block tracking-wide">{isSwahili ? "Tarehe ya Kuzaliwa" : "Date of Birth"}</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleInputChange}
                className="w-full text-xs p-3 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase block tracking-wide">{isSwahili ? "Jinsia" : "Gender"}</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full text-xs p-3 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="mwanaume">{isSwahili ? "Mwanaume" : "Male"}</option>
                <option value="mwanamke">{isSwahili ? "Mwanamke" : "Female"}</option>
                <option value="ingine">{isSwahili ? "Nyingine" : "Other"}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase block tracking-wide">{isSwahili ? "Nchi" : "Country"}</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className="w-full text-xs p-3 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase block tracking-wide">{isSwahili ? "Mkoa" : "Region"}</label>
              <input
                type="text"
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                className="w-full text-xs p-3 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase block tracking-wide">{isSwahili ? "Mji" : "City"}</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full text-xs p-3 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase block tracking-wide">{isSwahili ? "Anwani ya Kimwili" : "Physical Address"}</label>
              <input
                type="text"
                name="physicalAddress"
                value={formData.physicalAddress}
                onChange={handleInputChange}
                className="w-full text-xs p-3 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase block tracking-wide">{isSwahili ? "Wasifu Kuhusu Mimi" : "Bio Description"}</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={3}
              placeholder={isSwahili ? "Andika maelezo mafupi kukuhusu..." : "Write a short bio about yourself..."}
              className="w-full text-xs p-3 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* PASSWORD CHANGE */}
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/30 space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-yellow-500 uppercase tracking-wider">
              <Lock className="w-4 h-4 text-yellow-500" />
              <span>{isSwahili ? "Badilisha Nenosiri la Usalama" : "Change Security Password"}</span>
            </div>
            <p className="text-[10px] text-slate-500">
              {isSwahili 
                ? "Weka nenosiri jipya hapa chini ikiwa tu unataka kubadilisha nenosiri lililopo la ulinzi." 
                : "Leave empty if you don't want to change your current login password."}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 relative">
                <label className="text-xs font-bold text-slate-400 uppercase block tracking-wide">{isSwahili ? "Nenosiri Jipya" : "New Password"}</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full text-xs p-3 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-amber-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase block tracking-wide">{isSwahili ? "Thibitisha Nenosiri" : "Confirm New Password"}</label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full text-xs p-3 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* NOTIFICATION PREFERENCE */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950/20 border border-slate-800/10">
            <input
              type="checkbox"
              id="notificationsEnabled"
              name="notificationsEnabled"
              checked={formData.notificationsEnabled}
              onChange={handleCheckboxChange}
              className="w-4.5 h-4.5 text-amber-500 bg-slate-950 border-slate-800 rounded focus:ring-amber-500"
            />
            <div>
              <label htmlFor="notificationsEnabled" className="text-xs font-bold text-slate-300 cursor-pointer flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-slate-400" />
                <span>{isSwahili ? "Ruhusu Arifa Kwenye Programu" : "Enable App Alerts & Notifications"}</span>
              </label>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {isSwahili 
                  ? "Pokea arifa za wakati halisi wakati wasifu unaposasishwa, agizo linapopokelewa, au bidhaa inapoidhinishwa." 
                  : "Receive live push banners when your updates complete, products approve, or customer requests arrive."}
              </p>
            </div>
          </div>

          {/* SUBMIT BUTTONS */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/15">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setMessage(null);
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {isSwahili ? "Ghairi" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1 cursor-pointer"
            >
              <span>{isSaving ? (isSwahili ? "Inasave..." : "Saving...") : (isSwahili ? "Hifadhi Taarifa" : "Save Settings")}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
