import { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

export default function ContactUs() {
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/contact`, formData);
            setIsSubmitted(true);
        } catch (error) {
            alert("Failed to send message. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a] pt-40 pb-24 font-sans text-black dark:text-white transition-colors duration-300">
            <div className="max-w-[800px] mx-auto px-6 md:px-10">
                <header className="mb-16 text-center">
                    <h1 className="text-3xl md:text-4xl font-normal tracking-[0.15em] uppercase logo-font">Contact Us</h1>
                    <div className="w-16 h-px bg-black dark:bg-white mx-auto mt-8 transition-colors"></div>
                </header>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    {isSubmitted ? (
                        <div className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 p-12 text-center transition-colors">
                            <h2 className="text-xl font-bold uppercase tracking-widest mb-4">Message Received</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">Thank you for reaching out to ER Parfums. A member of our concierge team will respond to your inquiry at {formData.email} within 24 hours.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-3">Name</label>
                                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border-b border-gray-300 dark:border-gray-700 bg-transparent py-3 text-sm outline-none focus:border-black dark:focus:border-white transition-colors" />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-3">Email Address</label>
                                    <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border-b border-gray-300 dark:border-gray-700 bg-transparent py-3 text-sm outline-none focus:border-black dark:focus:border-white transition-colors" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-3">Subject</label>
                                <select required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full border-b border-gray-300 dark:border-gray-700 py-3 text-sm outline-none focus:border-black dark:focus:border-white transition-colors bg-transparent [&>option]:bg-white dark:[&>option]:bg-black">
                                    <option value="" disabled>Select a topic...</option>
                                    <option value="Order Inquiry">Order Inquiry</option>
                                    <option value="Returns & Refunds">Returns & Refunds</option>
                                    <option value="Product Information">Product Information</option>
                                    <option value="Wholesale/Partnership">Wholesale / Partnership</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-3">Message</label>
                                <textarea required value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} rows="5" className="w-full border border-gray-200 dark:border-gray-800 bg-transparent p-5 text-sm outline-none focus:border-black dark:focus:border-white transition-colors resize-none"></textarea>
                            </div>
                            <button type="submit" disabled={isLoading} className="w-full bg-black dark:bg-white text-white dark:text-black py-5 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm cursor-pointer disabled:bg-gray-400 dark:disabled:bg-gray-600">
                                {isLoading ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>
                    )}
                </motion.div>
            </div>
        </div>
    );
}