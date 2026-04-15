import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);

    const handleSubscribe = (e) => {
        e.preventDefault();
        setSubscribed(true);
        setEmail('');
        setTimeout(() => setSubscribed(false), 5000);
    };

    return (
        <footer className="bg-black text-white pt-20 pb-10 border-t border-gray-900 font-sans mt-auto">
            <div className="max-w-[1400px] mx-auto px-10">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
                    {/* Links Section */}
                    <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
                        <div>
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6">Shop</h3>
                            <ul className="space-y-4">
                                <li><Link to="/collection" className="text-[10px] text-gray-400 uppercase tracking-[0.1em] hover:text-white transition">All Fragrances</Link></li>
                                <li><Link to="/collection/Women" className="text-[10px] text-gray-400 uppercase tracking-[0.1em] hover:text-white transition">Women</Link></li>
                                <li><Link to="/collection/Men" className="text-[10px] text-gray-400 uppercase tracking-[0.1em] hover:text-white transition">Men</Link></li>
                                <li><Link to="/collection/Highlights" className="text-[10px] text-gray-400 uppercase tracking-[0.1em] hover:text-white transition">Highlights</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6">Customer Service</h3>
                            <ul className="space-y-4">
                                <li><Link to="/contact" className="text-[10px] text-gray-400 uppercase tracking-[0.1em] hover:text-white transition">Contact Us</Link></li>
                                <li><Link to="/profile?tab=My+Purchase" className="text-[10px] text-gray-400 uppercase tracking-[0.1em] hover:text-white transition">Shipping & Returns</Link></li>
                                <li><Link to="/profile?tab=My+Purchase" className="text-[10px] text-gray-400 uppercase tracking-[0.1em] hover:text-white transition">Order Status</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6">Legal</h3>
                            <ul className="space-y-4">
                                <li><Link to="/privacy-policy" className="text-[10px] text-gray-400 uppercase tracking-[0.1em] hover:text-white transition">Privacy Policy</Link></li>
                                <li><Link to="/terms-of-use" className="text-[10px] text-gray-400 uppercase tracking-[0.1em] hover:text-white transition">Terms of Use</Link></li>
                                <li><Link to="/refund-policy" className="text-[10px] text-gray-400 uppercase tracking-[0.1em] hover:text-white transition">Refund Policy</Link></li>
                            </ul>
                        </div>
                    </div>
                    
                    {/* Sign Up Section */}
                    <div className="lg:col-span-5 lg:pl-10">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6">Sign Up</h3>
                        <form className="space-y-4" onSubmit={handleSubscribe}>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email*" required className="w-full bg-white text-black px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gray-400 transition placeholder:text-gray-400 placeholder:text-xs" />
                            <label className="flex items-start gap-3 cursor-pointer group mt-4">
                                <input type="checkbox" required className="mt-1 accent-black w-4 h-4 shrink-0 cursor-pointer" />
                                <span className="text-[9px] text-gray-400 leading-relaxed group-hover:text-gray-300 transition">By submitting this form, I expressly agree to receive exclusive promotional & marketing messages from ER Parfums. I understand that consent is not a condition of purchase. Read our <Link to="/privacy-policy" className="underline text-white hover:text-gray-300">Privacy Policy</Link> and <Link to="/terms-of-use" className="underline text-white hover:text-gray-300">Terms of Service</Link>.</span>
                            </label>
                            <button type="submit" className="bg-white text-black px-8 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gray-200 transition mt-4 shadow-sm cursor-pointer w-32">
                                {subscribed ? "Subscribed ✓" : "Submit"}
                            </button>
                        </form>
                        <div className="mt-12">
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Get In Touch</h3>
                            <p className="text-[10px] text-gray-400 uppercase tracking-[0.1em] mb-1">Call us at 1-800-ER-PARFUMS</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-[0.1em]">Weekdays 10AM-7PM PHT</p>
                        </div>
                    </div>
                </div>
                <div className="border-t border-gray-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-[9px] text-gray-500 uppercase tracking-[0.1em]">© 2026 ER Parfums. All rights reserved.</p>
                    <div className="flex gap-6">
                        <a href="https://www.facebook.com/ERparfums/#" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition cursor-pointer">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        </a>
                        <a href="https://www.instagram.com/erparfums/" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition cursor-pointer">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.46 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"/></svg>
                        </a>
                        <a href="https://www.tiktok.com/@erparfums" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition cursor-pointer">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v7.2c0 1.96-.5 3.96-1.6 5.6-1.04 1.54-2.58 2.74-4.32 3.3-1.83.58-3.92.58-5.74-.03-2.02-.68-3.7-2.14-4.66-3.97-.9-1.74-1.1-3.83-.54-5.68.51-1.65 1.6-3.08 3.02-3.98 1.34-.84 3.01-1.17 4.54-1.04v4.06c-1.05-.09-2.2.14-3.06.77-.73.54-1.2 1.4-1.31 2.3-.1 1.01.2 2.1.86 2.87.62.72 1.6 1.16 2.58 1.25 1.04.1 2.15-.08 2.97-.73.74-.58 1.2-1.5 1.3-2.43V0h-2.1z"/></svg>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}