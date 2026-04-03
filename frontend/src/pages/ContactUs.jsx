import { useState } from 'react';
import { motion } from 'framer-motion';

export default function ContactUs() {
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Simulate an API call
        setTimeout(() => setIsSubmitted(true), 800);
    };

    return (
        <div className="min-h-screen bg-white pt-40 pb-24 font-sans text-black">
            <div className="max-w-[800px] mx-auto px-6 md:px-10">
                <header className="mb-16 text-center">
                    <h1 className="text-3xl md:text-4xl font-normal tracking-[0.15em] uppercase logo-font">Contact Us</h1>
                    <div className="w-16 h-px bg-black mx-auto mt-8"></div>
                </header>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    {isSubmitted ? (
                        <div className="bg-gray-50 border border-gray-200 p-12 text-center">
                            <h2 className="text-xl font-bold uppercase tracking-widest mb-4">Message Received</h2>
                            <p className="text-sm text-gray-500 leading-relaxed">Thank you for reaching out to ER Parfums. A member of our concierge team will respond to your inquiry at {formData.email} within 24 hours.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-3">Name</label>
                                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border-b border-gray-300 py-3 text-sm outline-none focus:border-black transition" />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-3">Email Address</label>
                                    <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border-b border-gray-300 py-3 text-sm outline-none focus:border-black transition" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-3">Subject</label>
                                <select required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full border-b border-gray-300 py-3 text-sm outline-none focus:border-black transition bg-transparent">
                                    <option value="" disabled>Select a topic...</option>
                                    <option value="Order Inquiry">Order Inquiry</option>
                                    <option value="Returns & Refunds">Returns & Refunds</option>
                                    <option value="Product Information">Product Information</option>
                                    <option value="Wholesale/Partnership">Wholesale / Partnership</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-3">Message</label>
                                <textarea required value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} rows="5" className="w-full border border-gray-200 p-5 text-sm outline-none focus:border-black transition resize-none"></textarea>
                            </div>
                            <button type="submit" className="w-full bg-black text-white py-5 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition shadow-sm cursor-pointer">
                                Send Message
                            </button>
                        </form>
                    )}
                </motion.div>
            </div>
        </div>
    );
}