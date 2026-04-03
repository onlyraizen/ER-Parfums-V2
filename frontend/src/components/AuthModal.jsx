import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import ReCAPTCHA from 'react-google-recaptcha';

const CloseIcon = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);
const EyeIcon = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>);
const EyeSlashIcon = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>);

export default function AuthModal({ isOpen, onClose }) {
    const [view, setView] = useState('login'); 
    const [step, setStep] = useState(1); 
    const [formData, setFormData] = useState({ fullname: '', email: '', password: '', confirmPassword: '' });
    const [showPassword, setShowPassword] = useState(false);
    const recaptchaRef = useRef(null);
    const [submitLoading, setSubmitLoading] = useState(false);

    // --- ERRORS & PASSWORD STRENGTH ---
    const [error, setError] = useState(''); 
    const [regError, setRegError] = useState(''); 
    const [passwordChecks, setPasswordChecks] = useState({ length: false, caps: false, lower: false, number: false });
    const [passwordStrength, setPasswordStrength] = useState('Weak');

    // --- OTP LOGIC ---
    const regOtpRefs = useRef([]);
    const forgotOtpRefs = useRef([]);
    const [regOtp, setRegOtp] = useState(['', '', '', '', '', '']);
    const [forgotOtp, setForgotOtp] = useState(['', '', '', '', '', '']);
    const [resendTimer, setResendTimer] = useState(0);

    useEffect(() => {
        let timer;
        if (resendTimer > 0) timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendTimer]);

    useEffect(() => {
        setError(''); setRegError(''); setStep(1); 
        setFormData({ fullname: '', email: '', password: '', confirmPassword: '' }); 
        setShowPassword(false); setRegOtp(Array(6).fill('')); setForgotOtp(Array(6).fill(''));
    }, [view, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (name === 'password') validatePassword(value);
    };

    const validatePassword = (pass) => {
        const checks = { length: pass.length >= 8, caps: /[A-Z]/.test(pass), lower: /[a-z]/.test(pass), number: /[0-9]/.test(pass) };
        setPasswordChecks(checks);
        const score = Object.values(checks).filter(Boolean).length;
        if (score <= 2) setPasswordStrength('Weak');
        else if (score === 3) setPasswordStrength('Medium');
        else if (score === 4) setPasswordStrength('Strong');
    };

    const isPasswordValid = Object.values(passwordChecks).every(Boolean) && formData.password === formData.confirmPassword;
    const resetFormState = () => { recaptchaRef.current?.reset(); setSubmitLoading(false); };

    // --- OTP CONTIGUOUS INPUT HANDLERS ---
    const handleOtpChange = (element, index, stateUpdater, refs) => {
        const value = element.value.replace(/[^0-9]/g, ''); 
        if (!value) return;
        stateUpdater(prev => {
            const newState = [...prev];
            newState[index] = value.substring(value.length - 1); 
            return newState;
        });
        if (value && index < 5) refs.current[index + 1]?.focus();
    };

    const handleOtpBackspace = (element, index, stateUpdater, refs) => {
        if (element.value === '' && index > 0) refs.current[index - 1]?.focus();
        stateUpdater(prev => {
            const newState = [...prev];
            newState[index] = '';
            return newState;
        });
    };

    // --- AUTHENTICATION ENDPOINTS ---
    const handleLogin = async (e) => {
        e.preventDefault();
        setSubmitLoading(true); setError('');
        const token = recaptchaRef.current?.getValue();
        if (!token) { setError("Please complete the reCAPTCHA."); setSubmitLoading(false); return; }
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/login`, { ...formData, recaptchaToken: token });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            window.location.reload();
        } catch (err) { 
            setError(err.response?.data?.message || "Invalid credentials."); 
            // SWEEP INPUTS ON FAILURE
            setFormData({ fullname: '', email: '', password: '', confirmPassword: '' });
            resetFormState(); 
        }
    };

    const handleSendRegisterOtp = async (e) => {
        if (e) e.preventDefault();
        setSubmitLoading(true); setRegError('');
        const token = recaptchaRef.current?.getValue();
        if (!token) { setRegError("reCAPTCHA is required."); setSubmitLoading(false); return; }
        if (!isPasswordValid) { setRegError("Please ensure passwords match and meet requirements."); setSubmitLoading(false); return; }
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/send-register-otp`, { email: formData.email, recaptchaToken: token });
            setStep(2); setResendTimer(60); setSubmitLoading(false);
            setTimeout(() => regOtpRefs.current[0]?.focus(), 100); 
        } catch (err) { setRegError(err.response?.data?.message || "Verification failed."); resetFormState(); }
    };

    const handleResendOtp = async () => {
        if (resendTimer > 0) return;
        const token = recaptchaRef.current?.getValue();
        setSubmitLoading(true); setRegError('');
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/send-register-otp`, { email: formData.email, recaptchaToken: token });
            setResendTimer(60); setSubmitLoading(false);
        } catch (err) {
            setRegError("reCAPTCHA expired. Please go back and verify again.");
            setStep(1); resetFormState();
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        const combinedOtp = regOtp.join('');
        if (combinedOtp.length < 6) { setRegError("Please enter the full 6-digit code."); return; }
        setSubmitLoading(true); setRegError('');
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/register`, { ...formData, otp: combinedOtp });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            window.location.reload();
        } catch (err) { setRegError(err.response?.data?.message || "Registration failed."); setSubmitLoading(false); }
    };

    const handleSendForgotOtp = async (e) => {
        e.preventDefault(); setSubmitLoading(true); setError('');
        const token = recaptchaRef.current?.getValue();
        if(!token) { setError("reCAPTCHA is required."); setSubmitLoading(false); return; }
        try { 
            await axios.post(`${import.meta.env.VITE_API_URL}/api/forgot-password`, { email: formData.email, recaptchaToken: token }); 
            setStep(2); setSubmitLoading(false);
            setTimeout(() => forgotOtpRefs.current[0]?.focus(), 100);
        } catch (err) { setError(err.response?.data?.message || "Reset failed."); resetFormState(); }
    };

    const handleVerifyForgotOtp = (e) => {
        e.preventDefault();
        const combinedOtp = forgotOtp.join('');
        if (combinedOtp.length < 6) { setError("Please enter the full 6-digit code."); return; }
        setError('');
        setStep(3); // Move to the actual password reset step
    }

    const handleResetPassword = async (e) => { 
        e.preventDefault(); 
        const combinedOtp = forgotOtp.join('');
        if(!isPasswordValid) { setError("Please ensure passwords match and meet requirements."); return; } 
        setSubmitLoading(true); setError('');
        try { 
            await axios.post(`${import.meta.env.VITE_API_URL}/api/reset-password`, { email: formData.email, otp: combinedOtp, newPassword: formData.password }); 
            setView('login'); setStep(1); setSubmitLoading(false); 
        } catch (err) { setError(err.response?.data?.message || "Reset failed."); setSubmitLoading(false); } 
    };

    //if (!isOpen) return null;

    // Extracted out to purely render elements instead of defining components inside render
    const renderPasswordRequirements = () => (
        <div className="pt-3 pb-2 space-y-1.5 border-t border-gray-100 mt-4">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2 flex justify-between items-center">
                <span>Password Strength:</span>
                <span className={`${passwordStrength === 'Weak' ? 'text-red-600' : (passwordStrength === 'Medium' ? 'text-yellow-600' : 'text-green-600')}`}>{passwordStrength}</span>
            </p>
            <p className={`text-[10px] uppercase tracking-wider ${passwordChecks.length ? 'text-green-600 font-medium' : 'text-gray-400'}`}>✓ At least 8 characters</p>
            <p className={`text-[10px] uppercase tracking-wider ${passwordChecks.caps ? 'text-green-600 font-medium' : 'text-gray-400'}`}>✓ At least one uppercase letter</p>
            <p className={`text-[10px] uppercase tracking-wider ${passwordChecks.lower ? 'text-green-600 font-medium' : 'text-gray-400'}`}>✓ At least one lowercase letter</p>
            <p className={`text-[10px] uppercase tracking-wider ${passwordChecks.number ? 'text-green-600 font-medium' : 'text-gray-400'}`}>✓ At least one number</p>
            <p className={`text-[10px] uppercase tracking-wider ${formData.confirmPassword && formData.password === formData.confirmPassword ? 'text-green-600 font-medium' : 'text-gray-400'}`}>✓ Passwords match</p>
        </div>
    );

    return (
        <AnimatePresence>
            {isOpen && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></motion.div>
                
                <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
                    className="bg-white w-full max-w-lg p-12 md:p-16 relative z-10 shadow-2xl flex flex-col"
                >
                    <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors"><CloseIcon /></button>
                    
                    <h2 className="text-2xl font-bold uppercase tracking-[0.15em] mb-10 text-center">{view === 'forgot' ? 'Reset Password' : (view === 'register' ? 'Create Account' : 'Login')}</h2>
                    
                    {/* LOGIN FORM */}
                    {view === 'login' && (
                        <form onSubmit={handleLogin} className="space-y-6">
                            {error && <p className="text-xs bg-red-50 text-red-600 border border-red-100 p-3 font-bold uppercase tracking-widest text-center">{error}</p>}
                            <input type="email" name="email" value={formData.email} placeholder="Email" required onChange={handleChange} className="w-full border-b border-gray-300 py-3 text-sm outline-none focus:border-black transition-colors" />
                            <div className="relative">
                                <input type={showPassword ? "text" : "password"} name="password" value={formData.password} placeholder="Password" required onChange={handleChange} className="w-full border-b border-gray-300 py-3 text-sm outline-none focus:border-black transition-colors pr-10" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-3 text-gray-400 hover:text-black"> {showPassword ? <EyeSlashIcon /> : <EyeIcon />}</button>
                            </div>
                            <div className="flex justify-center my-6"><ReCAPTCHA ref={recaptchaRef} sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY} /></div>
                            <button type="submit" disabled={submitLoading} className="w-full bg-black text-white py-4 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition disabled:bg-gray-300">
                                {submitLoading ? 'Authenticating...' : 'Sign In'}
                            </button>
                            <div className="text-center space-y-4 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => { setView('forgot'); setStep(1); }} className="text-[10px] text-gray-500 uppercase tracking-widest hover:text-black transition block w-full">Forgot Password?</button>
                                <button type="button" onClick={() => { setView('register'); setStep(1); }} className="text-[10px] text-gray-500 uppercase tracking-widest hover:text-black transition block w-full">Create an Account</button>
                            </div>
                        </form>
                    )}

                    {/* REGISTER STEP 1 */}
                    {view === 'register' && step === 1 && (
                        <form onSubmit={handleSendRegisterOtp} className="space-y-6">
                            {regError && <p className="text-xs bg-red-50 text-red-600 border border-red-100 p-3 font-bold uppercase tracking-widest text-center">{regError}</p>}
                            <input type="text" name="fullname" value={formData.fullname} placeholder="Full Name" required onChange={handleChange} className="w-full border-b border-gray-300 py-3 text-sm outline-none focus:border-black transition-colors" />
                            <input type="email" name="email" value={formData.email} placeholder="Email" required onChange={handleChange} className="w-full border-b border-gray-300 py-3 text-sm outline-none focus:border-black transition-colors" />
                            <div className="relative">
                                <input type={showPassword ? "text" : "password"} name="password" value={formData.password} placeholder="Password" required onChange={handleChange} className="w-full border-b border-gray-300 py-3 text-sm outline-none focus:border-black transition-colors pr-10" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-3 text-gray-400 hover:text-black"> {showPassword ? <EyeSlashIcon /> : <EyeIcon />} </button>
                            </div>
                            <div className="relative">
                                <input type={showPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} placeholder="Confirm Password" required onChange={handleChange} className="w-full border-b border-gray-300 py-3 text-sm outline-none focus:border-black transition-colors pr-10" />
                                {formData.password && renderPasswordRequirements()}
                            </div>
                            <div className="flex justify-center my-6"><ReCAPTCHA ref={recaptchaRef} sitekey="6Lf1f4MsAAAAAK4jpuGx7cgxXnZeXJK8L6O5h6X-" /></div>
                            <button type="submit" disabled={submitLoading || !isPasswordValid} className="w-full bg-black text-white py-4 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition disabled:bg-gray-300">
                                {submitLoading ? 'Verifying...' : 'Register'}
                            </button>
                            <button type="button" onClick={() => setView('login')} className="text-[10px] text-gray-500 uppercase tracking-widest block w-full text-center mt-4 hover:text-black transition">Back to Login</button>
                        </form>
                    )}

                    {/* REGISTER STEP 2 (RIOT OTP) */}
                    {view === 'register' && step === 2 && (
                        <form onSubmit={handleRegister} className="space-y-6">
                            {regError && <p className="text-xs bg-red-50 text-red-600 border border-red-100 p-3 font-bold uppercase tracking-widest text-center">{regError}</p>}
                            <p className="text-xs text-gray-500 text-center leading-relaxed">Enter the 6-digit code sent to <br/><span className="font-bold text-black">{formData.email}</span></p>
                            
                            <div className="flex gap-2 justify-center mb-8">
                                {regOtp.map((digit, index) => (
                                    <input
                                        key={index} type="text" maxLength="1" value={digit}
                                        ref={el => regOtpRefs.current[index] = el}
                                        onChange={(e) => handleOtpChange(e.target, index, setRegOtp, regOtpRefs)}
                                        onKeyDown={(e) => { if (e.key === 'Backspace') handleOtpBackspace(e.target, index, setRegOtp, regOtpRefs); }}
                                        className="w-12 h-14 border border-gray-300 text-center text-2xl font-bold focus:border-black outline-none transition rounded-sm"
                                    />
                                ))}
                            </div>
                            
                            <button type="submit" disabled={submitLoading} className="w-full bg-black text-white py-4 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition disabled:bg-gray-300">
                                {submitLoading ? 'Registering...' : 'REGISTER'}
                            </button>
                            <div className="text-center pt-2">
                                <button type="button" onClick={handleResendOtp} disabled={resendTimer > 0} className={`text-[10px] uppercase tracking-widest transition ${resendTimer > 0 ? 'text-gray-300' : 'text-gray-500 hover:text-black underline'}`}>
                                    {resendTimer > 0 ? `Resend Code in ${resendTimer}s` : 'Resend Code'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* FORGOT PASSWORD STEP 1: EMAIL */}
                    {view === 'forgot' && step === 1 && (
                        <form onSubmit={handleSendForgotOtp} className="space-y-6">
                            {error && <p className="text-xs bg-red-50 text-red-600 border border-red-100 p-3 font-bold uppercase tracking-widest text-center">{error}</p>}
                            <p className="text-xs text-gray-500 text-center leading-relaxed">Enter your registered email address to receive a <br/>password reset code.</p>
                            <input type="email" name="email" value={formData.email} placeholder="Email" required onChange={handleChange} className="w-full border-b border-gray-300 py-3 text-sm outline-none focus:border-black transition-colors" />
                            <div className="flex justify-center my-6"><ReCAPTCHA ref={recaptchaRef} sitekey="6Lf1f4MsAAAAAK4jpuGx7cgxXnZeXJK8L6O5h6X-" /></div>
                            <button type="submit" disabled={submitLoading} className="w-full bg-black text-white py-4 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition disabled:bg-gray-300">
                                {submitLoading ? 'Sending...' : 'Send Reset Code'}
                            </button>
                            <button type="button" onClick={() => setView('login')} className="text-[10px] text-gray-500 uppercase tracking-widest block w-full text-center mt-4 hover:text-black transition">Cancel</button>
                        </form>
                    )}

                    {/* FORGOT PASSWORD STEP 2: VERIFY OTP CODE */}
                    {view === 'forgot' && step === 2 && (
                        <form onSubmit={handleVerifyForgotOtp} className="space-y-6">
                            {error && <p className="text-xs bg-red-50 text-red-600 border border-red-100 p-3 font-bold uppercase tracking-widest text-center">{error}</p>}
                            <p className="text-xs text-gray-500 text-center leading-relaxed mb-6">Enter the 6-digit code sent to your email.</p>
                            
                            <div className="flex gap-2 justify-center mb-8">
                                {forgotOtp.map((digit, index) => (
                                    <input
                                        key={index} type="text" maxLength="1" value={digit}
                                        ref={el => forgotOtpRefs.current[index] = el}
                                        onChange={(e) => handleOtpChange(e.target, index, setForgotOtp, forgotOtpRefs)}
                                        onKeyDown={(e) => { if (e.key === 'Backspace') handleOtpBackspace(e.target, index, setForgotOtp, forgotOtpRefs); }}
                                        className="w-12 h-14 border border-gray-300 text-center text-2xl font-bold focus:border-black outline-none transition rounded-sm"
                                    />
                                ))}
                            </div>

                            <button type="submit" disabled={forgotOtp.join('').length < 6} className="w-full bg-black text-white py-4 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition disabled:bg-gray-300 mt-6">
                                Verify Code
                            </button>
                        </form>
                    )}

                    {/* FORGOT PASSWORD STEP 3: NEW PASSWORDS */}
                    {view === 'forgot' && step === 3 && (
                        <form onSubmit={handleResetPassword} className="space-y-6">
                            {error && <p className="text-xs bg-red-50 text-red-600 border border-red-100 p-3 font-bold uppercase tracking-widest text-center">{error}</p>}
                            <p className="text-xs text-gray-500 text-center leading-relaxed mb-6">Create a new secure password.</p>
                            
                            <div className="pt-4 space-y-6">
                                <div className="relative">
                                    <input type={showPassword ? "text" : "password"} name="password" value={formData.password} placeholder="New Password" required onChange={handleChange} className="w-full border-b border-gray-300 py-3 text-sm outline-none focus:border-black transition-colors pr-10" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-3 text-gray-400 hover:text-black"> {showPassword ? <EyeSlashIcon /> : <EyeIcon />} </button>
                                </div>
                                <div className="relative">
                                    <input type={showPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} placeholder="Confirm New Password" required onChange={handleChange} className="w-full border-b border-gray-300 py-3 text-sm outline-none focus:border-black transition-colors pr-10" />
                                    {formData.password && renderPasswordRequirements()}
                                </div>
                            </div>

                            <button type="submit" disabled={submitLoading || !isPasswordValid} className="w-full bg-black text-white py-4 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition disabled:bg-gray-300 mt-6">
                                {submitLoading ? 'Resetting...' : 'Save New Password'}
                            </button>
                        </form>
                    )}
                </motion.div>
            </div>
            )}
        </AnimatePresence>
    );
}