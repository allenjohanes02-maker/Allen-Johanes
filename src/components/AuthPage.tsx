import React, { useState, useEffect } from "react";
import { 
  Lock, 
  Mail, 
  User as UserIcon, 
  Phone, 
  MapPin, 
  Building, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  HelpCircle, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle,
  Store,
  MessageSquare
} from "lucide-react";
import { User } from "../types";

interface AuthPageProps {
  isSwahili: boolean;
  isDarkMode: boolean;
  onLoginSuccess: (user: User) => void;
}

export default function AuthPage({ isSwahili, isDarkMode, onLoginSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Login States
  const [loginUsernameOrEmail, setLoginUsernameOrEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaChallenge, setCaptchaChallenge] = useState({ id: "", question: "" });
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginSuccessMsg, setLoginSuccessMsg] = useState("");

  // Forgot Password States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStep, setForgotStep] = useState(1); // 1 = enter email, 2 = security question, 3 = reset success
  const [forgotSecurityQuestion, setForgotSecurityQuestion] = useState("");
  const [forgotSecurityAnswer, setForgotSecurityAnswer] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotError, setForgotError] = useState("");

  // Registration Multi-Step Wizard States
  const [regStep, setRegStep] = useState(1); // 1: Role, 2: Personal, 3: Location, 4: Credentials, 5: Seller Info, 6: Security Question & Terms
  const [selectedRole, setSelectedRole] = useState<"buyer" | "seller">("buyer");
  
  // Registration Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("mwanamke"); // Default mwanamke / Female
  
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("Tanzania");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [physicalAddress, setPhysicalAddress] = useState("");
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Seller Fields
  const [businessName, setBusinessName] = useState("");
  const [businessCategory, setBusinessCategory] = useState("Traditional Vitenge");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [nationalId, setNationalId] = useState(""); // 20 digit NIDA
  const [businessLicense, setBusinessLicense] = useState("");
  const [storeLogo, setStoreLogo] = useState("🏬");

  const [securityQuestion, setSecurityQuestion] = useState("What is your favorite color? / Rangi yako ya asili uipendayo ni gani?");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");

  // Password Strength Check
  const [passwordStrength, setPasswordStrength] = useState<"Weak" | "Medium" | "Strong">("Weak");
  const [strengthScore, setStrengthScore] = useState(0);

  // Hidden admin quick-login disclosure
  const [showAdminAccess, setShowAdminAccess] = useState(false);

  // Load CAPTCHA
  const fetchCaptcha = async () => {
    setCaptchaLoading(true);
    try {
      const r = await fetch("/api/auth/captcha");
      const d = await r.json();
      setCaptchaChallenge(d);
    } catch (err) {
      console.error("Failed to load CAPTCHA", err);
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
    // Remember me check
    const saved = localStorage.getItem("soko_remembered_user");
    if (saved) {
      setLoginUsernameOrEmail(saved);
      setRememberMe(true);
    }
  }, []);

  // Recalculate password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength("Weak");
      setStrengthScore(0);
      return;
    }
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[@$!%*?&]/.test(password)) score++;

    setStrengthScore(score);
    if (score <= 2) setPasswordStrength("Weak");
    else if (score <= 4) setPasswordStrength("Medium");
    else setPasswordStrength("Strong");
  }, [password]);

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginSuccessMsg("");

    if (!loginUsernameOrEmail || !loginPassword) {
      setLoginError(isSwahili ? "Tafadhali jaza jina la mtumiaji na nenosiri." : "Please enter username/email and password.");
      return;
    }

    if (!captchaAnswer) {
      setLoginError(isSwahili ? "Tafadhali jaza CAPTCHA." : "Please answer the CAPTCHA check.");
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usernameOrEmail: loginUsernameOrEmail,
          password: loginPassword,
          captchaId: captchaChallenge.id,
          captchaValue: captchaAnswer,
          device: navigator.userAgent
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setLoginSuccessMsg(isSwahili ? "Umeingia kwa mafanikio! Inapakia..." : "Logged in successfully! Loading...");
        if (rememberMe) {
          localStorage.setItem("soko_remembered_user", loginUsernameOrEmail);
        } else {
          localStorage.removeItem("soko_remembered_user");
        }
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 800);
      } else {
        setLoginError(data.message || (isSwahili ? "Majaribio ya kuingia yamefeli." : "Login failed."));
        fetchCaptcha();
        setCaptchaAnswer("");
      }
    } catch (err) {
      setLoginError(isSwahili ? "Hitilafu imetokea kwenye seva." : "Server connection failure. Please retry.");
      fetchCaptcha();
    }
  };

  // Handle Registration Step validation
  const validateRegStep = () => {
    setRegError("");
    if (regStep === 1) {
      return true;
    }
    if (regStep === 2) {
      if (!firstName || !lastName || !dob || !gender) {
        setRegError(isSwahili ? "Tafadhali jaza taarifa zote za kibinafsi." : "Please fill in all personal information fields.");
        return false;
      }
      return true;
    }
    if (regStep === 3) {
      if (!email || !phone || !region || !city || !physicalAddress) {
        setRegError(isSwahili ? "Tafadhali jaza anwani na mawasiliano yote." : "Please fill in all contact and location fields.");
        return false;
      }
      // Simple Email Check
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setRegError(isSwahili ? "Barua pepe si sahihi." : "Please enter a valid email address.");
        return false;
      }
      return true;
    }
    if (regStep === 4) {
      if (!username || !password || !confirmPassword) {
        setRegError(isSwahili ? "Tafadhali jaza nenosiri na jina la mtumiaji." : "Please complete all account fields.");
        return false;
      }
      if (password !== confirmPassword) {
        setRegError(isSwahili ? "Nenosiri halitofautiani / halilingani." : "Passwords do not match.");
        return false;
      }
      if (passwordStrength !== "Strong") {
        setRegError(isSwahili ? "Nenosiri ni dhaifu. Lazima liwe na herufi kubwa, ndogo, namba, na alama maalum." : "Password too weak. Please meet all safety criteria.");
        return false;
      }
      return true;
    }
    if (regStep === 5 && selectedRole === "seller") {
      if (!businessName || !businessAddress || !businessPhone || !businessDescription || !nationalId) {
        setRegError(isSwahili ? "Tafadhali jaza maelezo yote ya biashara na namba ya NIDA (Alama 20)." : "Please enter all store details, including 20-digit National ID (NIDA).");
        return false;
      }
      if (nationalId.length < 20) {
        setRegError(isSwahili ? "Namba ya kitambulisho cha taifa (NIDA) lazima iwe na tarakimu 20." : "National ID (NIDA) must contain exactly 20 digits.");
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateRegStep()) {
      if (regStep === 4 && selectedRole === "buyer") {
        setRegStep(6); // Skip seller step for buyer
      } else {
        setRegStep(regStep + 1);
      }
    }
  };

  const handlePrevStep = () => {
    setRegError("");
    if (regStep === 6 && selectedRole === "buyer") {
      setRegStep(4);
    } else {
      setRegStep(regStep - 1);
    }
  };

  // Handle Registration Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");

    if (!agreeTerms) {
      setRegError(isSwahili ? "Lazima ukubali Vigezo na Masharti ili uendelee." : "You must accept the Terms and Conditions.");
      return;
    }

    if (!securityAnswer) {
      setRegError(isSwahili ? "Tafadhali jaza jibu la swali la usalama." : "Please provide a security answer.");
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
          role: selectedRole,
          businessName,
          businessCategory,
          businessAddress,
          businessPhone,
          businessDescription,
          storeLogo,
          nationalId,
          businessLicense
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRegSuccess(isSwahili ? "Akaunti yako imesajiliwa kikamilifu! Sasa unaweza kuingia." : "Account created successfully! Switching to login...");
        setTimeout(() => {
          setIsLogin(true);
          // Prepopulate email
          setLoginUsernameOrEmail(email);
          setRegStep(1);
          // Clear registration form
          setFirstName("");
          setLastName("");
          setDob("");
          setUsername("");
          setPassword("");
          setConfirmPassword("");
          setSecurityAnswer("");
          setBusinessName("");
          setNationalId("");
          setAgreeTerms(false);
        }, 1500);
      } else {
        setRegError(data.message || (isSwahili ? "Usajili umefeli." : "Registration failed."));
      }
    } catch (err) {
      setRegError(isSwahili ? "Mawasiliano na seva yamefeli." : "Failed to connect to server.");
    }
  };

  // Handle Forgot Password security question check
  const handleForgotSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    if (!forgotEmail) {
      setForgotError(isSwahili ? "Weka barua pepe au jina." : "Please enter email or username.");
      return;
    }

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernameOrEmail: forgotEmail })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setForgotSecurityQuestion(data.securityQuestion);
        setForgotStep(2);
      } else {
        setForgotError(data.message || (isSwahili ? "Mtumiaji hakupatikana." : "User account not found."));
      }
    } catch (err) {
      setForgotError("Error reaching server.");
    }
  };

  // Handle Password Reset submission
  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");

    if (!forgotSecurityAnswer || !forgotNewPassword) {
      setForgotError(isSwahili ? "Jaza uga zote." : "Please fill in all fields.");
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail,
          securityAnswer: forgotSecurityAnswer,
          newPassword: forgotNewPassword
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setForgotStep(3);
      } else {
        setForgotError(data.message || (isSwahili ? "Mchakato umeshindikana." : "Incorrect security answer or safety requirements not met."));
      }
    } catch (err) {
      setForgotError("Reset error.");
    }
  };

  return (
    <div className={`min-h-[90vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-all ${
      isDarkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"
    }`}>
      
      <div className={`w-full max-w-xl p-8 rounded-3xl border shadow-2xl transition-all ${
        isDarkMode ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-100"
      }`}>
        
        {/* Brand Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-24 h-24 mb-4 rounded-full overflow-hidden border-2 border-amber-500 shadow-xl relative group">
            <img 
              src="/src/assets/images/login_vitenge_logo_1782737817895.jpg" 
              alt="Authentic Vitenge Fabrics Logo" 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-2xl font-bold font-sans tracking-wider text-amber-500 uppercase">
            SOKO LA VITENGE
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">
            {isSwahili ? "Mavazi Halisi na Usalama Thabiti" : "Authentic Fabrics & Maximum Security"}
          </p>
        </div>

        {/* Tab Toggle buttons */}
        <div className="flex border-b border-slate-700/20 mb-8 p-1 bg-slate-950/20 rounded-2xl">
          <button
            onClick={() => { setIsLogin(true); setRegError(""); }}
            className={`w-1/2 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              isLogin 
                ? "bg-amber-500 text-slate-950 shadow-md font-extrabold" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            🔑 {isSwahili ? "Ingia (Login)" : "Login"}
          </button>
          <button
            onClick={() => { setIsLogin(false); setLoginError(""); }}
            className={`w-1/2 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              !isLogin 
                ? "bg-amber-500 text-slate-950 shadow-md font-extrabold" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            📝 {isSwahili ? "Jisajili (Register)" : "Register"}
          </button>
        </div>

        {/* --- LOGIN SCREEN --- */}
        {isLogin ? (
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            {loginError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs p-3.5 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}
            
            {loginSuccessMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs p-3.5 rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{loginSuccessMsg}</span>
              </div>
            )}

            {/* Input fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{isSwahili ? "Barua Pepe au Jina la Mtumiaji" : "Username or Email address"}</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={loginUsernameOrEmail}
                    onChange={(e) => setLoginUsernameOrEmail(e.target.value)}
                    placeholder={isSwahili ? "Mfano: fatuma@example.tz au fatuma" : "e.g. fatuma@example.tz or fatuma"}
                    className={`w-full text-xs pl-10 pr-4 py-3 rounded-xl border transition-all outline-none ${
                      isDarkMode 
                        ? "bg-slate-950 border-slate-800 text-white focus:border-amber-500" 
                        : "bg-slate-50 border-slate-200 text-slate-950 focus:border-amber-500"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{isSwahili ? "Nenosiri" : "Password"}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full text-xs pl-10 pr-10 py-3 rounded-xl border transition-all outline-none ${
                      isDarkMode 
                        ? "bg-slate-950 border-slate-800 text-white focus:border-amber-500" 
                        : "bg-slate-50 border-slate-200 text-slate-950 focus:border-amber-500"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Math CAPTCHA Security Gate */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
                isDarkMode ? "bg-slate-950/50 border-slate-800" : "bg-slate-50 border-slate-100"
              }`}>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-500 animate-pulse" />
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isSwahili ? "Lango la Usalama (CAPTCHA)" : "Security Verification Gate"}</span>
                    <span className="text-xs font-mono font-bold text-amber-500 tracking-widest">{captchaChallenge.question || "Loading..."}</span>
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    placeholder="?"
                    className={`w-20 text-center font-mono font-bold text-xs py-2 rounded-lg border transition-all outline-none ${
                      isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={fetchCaptcha}
                    disabled={captchaLoading}
                    className="p-2 bg-slate-800 text-white hover:bg-slate-700 rounded-lg shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${captchaLoading ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Remember & Forgot Row */}
            <div className="flex justify-between items-center text-[11px] font-medium">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                />
                <span>{isSwahili ? "Nikumbuke kwenye kifaa hiki" : "Remember me"}</span>
              </label>

              <button
                type="button"
                onClick={() => { setShowForgotModal(true); setForgotStep(1); setForgotError(""); }}
                className="text-amber-500 hover:underline font-bold"
              >
                {isSwahili ? "Umesahau nenosiri?" : "Forgot password?"}
              </button>
            </div>

            {/* Login button */}
            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-3 rounded-xl transition-all shadow-md uppercase tracking-wider cursor-pointer"
            >
              🚀 {isSwahili ? "Ingia Sasa" : "Sign In Now"}
            </button>

            {/* Hidden admin accessibility disclosure */}
            <div className="pt-2 border-t border-slate-700/20 text-center">
              <button
                type="button"
                onClick={() => setShowAdminAccess(!showAdminAccess)}
                className="text-[10px] font-mono text-slate-500 hover:text-amber-500 uppercase tracking-widest cursor-pointer"
              >
                🛠️ {isSwahili ? "Kuingia kwa Msimamizi (Administrator Access)" : "Administrator Access"}
              </button>

              {showAdminAccess && (
                <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left text-[10px] font-mono text-amber-500 leading-relaxed space-y-1">
                  <div><strong>Super Admin:</strong> Allen77#</div>
                  <div><strong>Password:</strong> A1l2l3e4n577#</div>
                  <div className="text-slate-400">{isSwahili ? "Nenosiri la Msimamizi limehifadhiwa kwa hashing ya SHA-256." : "Admin credentials secured using SHA-256 hashing."}</div>
                </div>
              )}
            </div>

            {/* Support administrator block */}
            <div className={`p-4 rounded-2xl border flex flex-col items-center text-center gap-2 transition-all ${
              isDarkMode ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-100"
            }`}>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <HelpCircle className="w-4 h-4 text-amber-500" />
                <span>{isSwahili ? "Je, unahitaji msaada?" : "Need Help?"}</span>
              </div>
              <p className="text-[10px] text-slate-400">
                {isSwahili 
                  ? "Mwasiliane na Msimamizi Mkuu:" 
                  : "Contact Support Administrator:"}{" "}
                <strong className="text-amber-500">ALLEN DREAMER77</strong>
              </p>
              
              {/* Clickable WhatsApp support */}
              <a
                href="https://wa.me/255714202298?text=Hello%20ALLEN%20DREAMER77,%20I%20need%20help%20with%20Soko%20la%20Vitenge%20Mtandaoni."
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold py-1.5 px-3.5 rounded-lg transition-all shadow-md cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp: +255 714 202 298</span>
              </a>
            </div>

          </form>
        ) : (
          
          /* --- REGISTRATION SYSTEM WIZARD --- */
          <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-5">
            
            {/* Step indicators */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isSwahili ? `Hatua ya ${regStep} kati ya 5` : `Step ${regStep} of 5`}
              </span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 6].map((stepIdx, i) => {
                  const displayIdx = i + 1;
                  const isActive = (displayIdx === 5 && regStep === 6) || (displayIdx === regStep) || (selectedRole === "seller" && displayIdx === 5 && regStep === 5);
                  const isDone = (selectedRole === "buyer" && displayIdx < 5 && regStep > displayIdx) || (selectedRole === "seller" && displayIdx < 5 && regStep > displayIdx);
                  return (
                    <div 
                      key={stepIdx} 
                      className={`h-1.5 rounded-full transition-all ${
                        isActive 
                          ? "w-6 bg-amber-500" 
                          : isDone 
                            ? "w-2 bg-emerald-500" 
                            : "w-2 bg-slate-700/30"
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {regError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs p-3 px-4 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            {regSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs p-3 px-4 rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{regSuccess}</span>
              </div>
            )}

            {/* STEP 1: ACCOUNT ROLE TYPE */}
            {regStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-center uppercase tracking-wider text-slate-300">
                  {isSwahili ? "Chagua Aina ya Akaunti yako" : "Select Your Account Type"}
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Buyer */}
                  <div
                    onClick={() => setSelectedRole("buyer")}
                    className={`p-5 rounded-2xl border text-center cursor-pointer transition-all ${
                      selectedRole === "buyer"
                        ? "border-amber-500 bg-amber-500/5 shadow-lg"
                        : "border-slate-800 hover:bg-slate-800/20"
                    }`}
                  >
                    <span className="text-4xl block mb-2">👩🏾‍💼</span>
                    <h4 className="font-bold text-xs uppercase text-amber-500">{isSwahili ? "Mnunuzi (Buyer)" : "Buyer"}</h4>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {isSwahili ? "Gundua vitenge, dhibiti vikapu vyako vya manunuzi, na utoe oda kwa usalama." : "Explore fabrics, build wishlists, and purchase securely."}
                    </p>
                  </div>

                  {/* Seller */}
                  <div
                    onClick={() => setSelectedRole("seller")}
                    className={`p-5 rounded-2xl border text-center cursor-pointer transition-all ${
                      selectedRole === "seller"
                        ? "border-amber-500 bg-amber-500/5 shadow-lg"
                        : "border-slate-800 hover:bg-slate-800/20"
                    }`}
                  >
                    <span className="text-4xl block mb-2">🏬</span>
                    <h4 className="font-bold text-xs uppercase text-amber-500">{isSwahili ? "Muuzaji (Seller)" : "Seller"}</h4>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {isSwahili ? "Fungua duka lako, weka katalogi ya Vitenge, na uongeze mauzo nchi nzima." : "Open your store, list your fabrics, and track sales across the country."}
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2 px-5 rounded-xl flex items-center gap-1 cursor-pointer shadow-md"
                  >
                    <span>{isSwahili ? "Endelea" : "Continue"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: PERSONAL INFORMATION */}
            {regStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                  👤 {isSwahili ? "Taarifa Binafsi" : "Personal Information"}
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{isSwahili ? "Jina la Kwanza *" : "First Name *"}</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder={isSwahili ? "Mfano: Fatuma" : "e.g. Fatuma"}
                      className={`w-full text-xs px-3 py-2.5 rounded-lg border outline-none ${
                        isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{isSwahili ? "Jina la Mwisho *" : "Last Name *"}</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder={isSwahili ? "Mfano: Omari" : "e.g. Omari"}
                      className={`w-full text-xs px-3 py-2.5 rounded-lg border outline-none ${
                        isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{isSwahili ? "Tarehe ya Kuzaliwa *" : "Date of Birth *"}</label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className={`w-full text-xs px-3 py-2.5 rounded-lg border outline-none ${
                        isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{isSwahili ? "Jinsia *" : "Gender *"}</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className={`w-full text-xs px-3 py-2.5 rounded-lg border outline-none ${
                        isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    >
                      <option value="mwanamke">{isSwahili ? "Mwanamke (Female)" : "Female"}</option>
                      <option value="mwanaume">{isSwahili ? "Mwanaume (Male)" : "Male"}</option>
                      <option value="nyingine">{isSwahili ? "Nyingine (Other)" : "Other"}</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="border border-slate-700 hover:bg-slate-800/30 text-slate-300 font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{isSwahili ? "Rudi" : "Back"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2 px-5 rounded-xl flex items-center gap-1 cursor-pointer shadow-md"
                  >
                    <span>{isSwahili ? "Endelea" : "Continue"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: CONTACT & LOCATION */}
            {regStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                  📍 {isSwahili ? "Mawasiliano na Mahali unapoishi" : "Contact & Location details"}
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{isSwahili ? "Barua Pepe *" : "Email Address *"}</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="fatuma@example.tz"
                      className={`w-full text-xs px-3 py-2.5 rounded-lg border outline-none ${
                        isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{isSwahili ? "Namba ya Simu *" : "Phone Number *"}</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+255 712 111 222"
                      className={`w-full text-xs px-3 py-2.5 rounded-lg border outline-none ${
                        isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{isSwahili ? "Nchi *" : "Country *"}</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className={`w-full text-xs px-3 py-2.5 rounded-lg border outline-none ${
                        isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{isSwahili ? "Mkoa *" : "Region/State *"}</label>
                    <input
                      type="text"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder="e.g. Dar es Salaam"
                      className={`w-full text-xs px-3 py-2.5 rounded-lg border outline-none ${
                        isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{isSwahili ? "Wilaya/Mji *" : "City *"}</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Kariakoo"
                      className={`w-full text-xs px-3 py-2.5 rounded-lg border outline-none ${
                        isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{isSwahili ? "Anwani Halisi ya Makazi *" : "Physical Address *"}</label>
                  <input
                    type="text"
                    value={physicalAddress}
                    onChange={(e) => setPhysicalAddress(e.target.value)}
                    placeholder={isSwahili ? "Mtaa na namba ya nyumba" : "Street name & House number"}
                    className={`w-full text-xs px-3 py-2.5 rounded-lg border outline-none ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  />
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="border border-slate-700 hover:bg-slate-800/30 text-slate-300 font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{isSwahili ? "Rudi" : "Back"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2 px-5 rounded-xl flex items-center gap-1 cursor-pointer shadow-md"
                  >
                    <span>{isSwahili ? "Endelea" : "Continue"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: ACCOUNT CREDENTIALS & PASSWORD STRENGTH */}
            {regStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                  🔒 {isSwahili ? "Taarifa za Akaunti" : "Account Credentials"}
                </h3>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{isSwahili ? "Jina la Mtumiaji (Username) *" : "Username *"}</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. fatuma_omari"
                    className={`w-full text-xs px-3 py-2.5 rounded-lg border outline-none ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{isSwahili ? "Nenosiri *" : "Password *"}</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full text-xs px-3 py-2.5 rounded-lg border outline-none ${
                        isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{isSwahili ? "Thibitisha Nenosiri *" : "Confirm Password *"}</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full text-xs px-3 py-2.5 rounded-lg border outline-none ${
                        isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    />
                  </div>
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <div className="space-y-1.5 p-3.5 rounded-xl border border-slate-700/20 bg-slate-950/20">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 font-bold uppercase">{isSwahili ? "Uimara wa Nenosiri:" : "Password Strength:"}</span>
                      <span className={`font-mono font-bold ${
                        passwordStrength === "Strong" 
                          ? "text-emerald-500" 
                          : passwordStrength === "Medium" 
                            ? "text-amber-500" 
                            : "text-rose-500"
                      }`}>
                        {passwordStrength === "Strong" ? "Strong / Imara kabisa" : passwordStrength === "Medium" ? "Medium / Wastani" : "Weak / Dhaifu mno"}
                      </span>
                    </div>
                    {/* Visual strength meter */}
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex gap-0.5">
                      <div className={`h-full transition-all ${
                        strengthScore >= 1 ? (strengthScore <= 2 ? "bg-rose-500" : strengthScore <= 4 ? "bg-amber-500" : "bg-emerald-500") : "bg-transparent"
                      }`} style={{ width: `${Math.min(strengthScore * 20, 100)}%` }} />
                    </div>
                    {/* Instructions list */}
                    <p className="text-[9px] text-slate-400 leading-relaxed">
                      {isSwahili 
                        ? "Lazima iwe na angalau herufi 8, kikiwemo herufi kubwa (A), herufi ndogo (a), namba (1), na alama maalum (@$!%*?&)."
                        : "Must contain at least 8 characters, including 1 uppercase, 1 lowercase, 1 number, and 1 special character."}
                    </p>
                  </div>
                )}

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="border border-slate-700 hover:bg-slate-800/30 text-slate-300 font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{isSwahili ? "Rudi" : "Back"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2 px-5 rounded-xl flex items-center gap-1 cursor-pointer shadow-md"
                  >
                    <span>{isSwahili ? "Endelea" : "Continue"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: SELLER ADDITIONAL INFO */}
            {regStep === 5 && selectedRole === "seller" && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                  💼 {isSwahili ? "Maelezo ya Ziada ya Biashara" : "Seller Additional Information"}
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{isSwahili ? "Jina la Biashara / Duka *" : "Business Name *"}</label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Kamala Vitenge Store"
                      className={`w-full text-xs px-3 py-2.5 rounded-lg border outline-none ${
                        isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{isSwahili ? "Kundi la Biashara *" : "Business Category *"}</label>
                    <select
                      value={businessCategory}
                      onChange={(e) => setBusinessCategory(e.target.value)}
                      className={`w-full text-xs px-3 py-2.5 rounded-lg border outline-none ${
                        isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    >
                      <option value="Traditional Vitenge">Traditional Vitenge</option>
                      <option value="Premium Vitenge">Premium Vitenge</option>
                      <option value="Fashion Vitenge">Fashion Vitenge</option>
                      <option value="Imported Vitenge">Imported Vitenge</option>
                      <option value="Local Designs">Local Designs / Batik</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{isSwahili ? "Simu ya Biashara *" : "Business Phone *"}</label>
                    <input
                      type="text"
                      value={businessPhone}
                      onChange={(e) => setBusinessPhone(e.target.value)}
                      placeholder="+255 655 400 300"
                      className={`w-full text-xs px-3 py-2.5 rounded-lg border outline-none ${
                        isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{isSwahili ? "Namba ya Kitambulisho NIDA (Tarakimu 20) *" : "NIDA ID Number (20-digits) *"}</label>
                    <input
                      type="text"
                      maxLength={20}
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ""))}
                      placeholder="1995xxxxxxxxxxxxxxxx"
                      className={`w-full text-xs px-3 py-2.5 rounded-lg border outline-none ${
                        isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{isSwahili ? "Anwani ya Biashara *" : "Business Address *"}</label>
                  <input
                    type="text"
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    placeholder="Kariakoo Market Block C, Dar es Salaam"
                    className={`w-full text-xs px-3 py-2.5 rounded-lg border outline-none ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{isSwahili ? "Maelezo ya Biashara / Duka *" : "Store Description *"}</label>
                  <textarea
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                    placeholder="Weka maelezo mafupi kuhusu duka lako..."
                    className={`w-full text-xs px-3 py-2 rounded-lg border outline-none h-16 resize-none ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{isSwahili ? "Leseni ya Biashara (Si Lazima)" : "Business License Code (optional)"}</label>
                    <input
                      type="text"
                      value={businessLicense}
                      onChange={(e) => setBusinessLicense(e.target.value)}
                      placeholder="LIC-77202-TZ"
                      className={`w-full text-xs px-3 py-2.5 rounded-lg border outline-none ${
                        isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{isSwahili ? "Chagua Logo ya Duka" : "Choose Store Logo"}</label>
                    <select
                      value={storeLogo}
                      onChange={(e) => setStoreLogo(e.target.value)}
                      className={`w-full text-xs px-3 py-2.5 rounded-lg border outline-none ${
                        isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    >
                      <option value="🏬">🏬 Traditional Store</option>
                      <option value="🏢">🏢 Business Center</option>
                      <option value="👗">👗 Fashion Design</option>
                      <option value="🧵">🧵 Tailoring/Fabric</option>
                      <option value="🧣">🧣 Silk & Brocade</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="border border-slate-700 hover:bg-slate-800/30 text-slate-300 font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{isSwahili ? "Rudi" : "Back"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2 px-5 rounded-xl flex items-center gap-1 cursor-pointer shadow-md"
                  >
                    <span>{isSwahili ? "Endelea" : "Continue"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 6 (FINAL): SECURITY QUESTION & TERMS */}
            {regStep === 6 && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                  🛡️ {isSwahili ? "Ulinzi na Masharti ya Matumizi" : "Security Verification & Terms"}
                </h3>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{isSwahili ? "Swali la Usalama *" : "Security Question *"}</label>
                  <select
                    value={securityQuestion}
                    onChange={(e) => setSecurityQuestion(e.target.value)}
                    className={`w-full text-xs px-3 py-2.5 rounded-lg border outline-none ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  >
                    <option value="What is your favorite color? / Rangi yako ya asili uipendayo ni gani?">What is your favorite color? / Rangi yako ya asili uipendayo ni gani?</option>
                    <option value="What is your mother's maiden name? / Jina la ukoo la mama yako ni nani?">What is your mother's maiden name? / Jina la ukoo la mama yako ni nani?</option>
                    <option value="What was your first pet's name? / Jina la mnyama wako wa kwanza wa kufugwa?">What was your first pet's name? / Jina la mnyama wako wa kwanza wa kufugwa?</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{isSwahili ? "Jibu la Usalama (Case-Insensitive) *" : "Security Answer *"}</label>
                  <input
                    type="text"
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    placeholder={isSwahili ? "Jibu lako hapa..." : "Your answer here..."}
                    className={`w-full text-xs px-3 py-2.5 rounded-lg border outline-none ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  />
                </div>

                {/* Terms and conditions */}
                <label className="flex items-start gap-2.5 cursor-pointer text-slate-400 text-xs py-2">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 mt-0.5 shrink-0"
                  />
                  <span className="leading-relaxed">
                    {isSwahili 
                      ? "Ninakubali Vigezo, Masharti, na Sera ya Faragha ya Soko la Vitenge. Ninathibitisha kuwa taarifa zote nilizoweka ni sahihi."
                      : "I accept Soko la Vitenge Terms, Conditions, and Privacy Policy. I certify all my details are authentic."}
                  </span>
                </label>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="border border-slate-700 hover:bg-slate-800/30 text-slate-300 font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{isSwahili ? "Rudi" : "Back"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRegisterSubmit}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-6 rounded-xl flex items-center gap-1 cursor-pointer shadow-md"
                  >
                    <span>{isSwahili ? "Kamilisha Usajili" : "Complete Registration"}</span>
                    <CheckCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </form>
        )}

      </div>

      {/* --- FORGOT PASSWORD SECURITY DIALOG --- */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[999]">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl ${
            isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-900"
          }`}>
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-xs uppercase text-amber-500">
                🔑 {isSwahili ? "Rudisha Nenosiri" : "Reset Password"}
              </h3>
              <button 
                onClick={() => setShowForgotModal(false)} 
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {forgotError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[11px] p-2.5 rounded-lg mb-4">
                {forgotError}
              </div>
            )}

            {/* STEP 1: FIND ACCOUNT */}
            {forgotStep === 1 && (
              <form onSubmit={handleForgotSearch} className="space-y-4">
                <p className="text-xs text-slate-400">
                  {isSwahili 
                    ? "Tafadhali weka jina la mtumiaji au anwani yako ya barua pepe ili kupata akaunti yako."
                    : "Please enter your username or registered email address to find your account."}
                </p>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{isSwahili ? "Barua pepe au Jina" : "Email or Username"}</label>
                  <input
                    type="text"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. fatuma@example.tz"
                    className={`w-full text-xs px-3 py-2 rounded-lg border outline-none ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200"
                    }`}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-amber-500 text-slate-950 font-bold text-xs py-2 rounded-lg uppercase tracking-wider shadow-md hover:bg-amber-400 cursor-pointer"
                >
                  {isSwahili ? "Tafuta Akaunti" : "Search Account"}
                </button>
              </form>
            )}

            {/* STEP 2: VERIFY SECURITY QUESTION AND SET NEW PASSWORD */}
            {forgotStep === 2 && (
              <form onSubmit={handleForgotReset} className="space-y-4">
                <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-xs text-amber-500">
                  <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">{isSwahili ? "Swali la Usalama la Akaunti:" : "Account Security Question:"}</span>
                  <strong>{forgotSecurityQuestion}</strong>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{isSwahili ? "Jibu Lako la Usalama *" : "Your Security Answer *"}</label>
                  <input
                    type="text"
                    value={forgotSecurityAnswer}
                    onChange={(e) => setForgotSecurityAnswer(e.target.value)}
                    className={`w-full text-xs px-3 py-2 rounded-lg border outline-none ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{isSwahili ? "Nenosiri Jipya *" : "New Password *"}</label>
                  <input
                    type="password"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full text-xs px-3 py-2 rounded-lg border outline-none ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200"
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 rounded-lg uppercase tracking-wider shadow-md cursor-pointer"
                >
                  {isSwahili ? "Badilisha Nenosiri" : "Reset Password"}
                </button>
              </form>
            )}

            {/* STEP 3: SUCCESS */}
            {forgotStep === 3 && (
              <div className="text-center py-6 space-y-4">
                <div className="text-4xl text-emerald-500 animate-bounce">🎉</div>
                <h4 className="font-bold text-sm text-emerald-500">
                  {isSwahili ? "Nenosiri Limebadilishwa!" : "Password Reset Successfully!"}
                </h4>
                <p className="text-xs text-slate-400">
                  {isSwahili 
                    ? "Unaweza sasa kutumia nenosiri lako jipya kuingia kwenye akaunti yako."
                    : "You may now use your new password to sign into your account."}
                </p>
                <button
                  onClick={() => { setShowForgotModal(false); setForgotStep(1); }}
                  className="bg-amber-500 text-slate-950 font-bold text-xs py-2 px-6 rounded-lg shadow-md hover:bg-amber-400 cursor-pointer"
                >
                  {isSwahili ? "Sawa, Kuelewa" : "Okay, Got It"}
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
