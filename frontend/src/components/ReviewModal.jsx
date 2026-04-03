import { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const CloseIcon = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);
const StarIcon = ({ filled }) => (
    <svg fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-black cursor-pointer">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
);

export default function ReviewModal({ productId, productName, onClose, onSuccess }) {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const token = localStorage.getItem('token');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!token) return alert("Log in to review.");
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/products/${productId}/reviews`, 
                { rating, comment }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("Review submitted successfully!");
            onSuccess(); // Close modal and refresh parent data
        } catch (error) {
            alert(error.response?.data?.message || "Submit failed. Have you reviewed this already?");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                {/* Background Dim */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="absolute inset-0 bg-black/70" onClick={onClose}></motion.div>
                
                {/* Modal Content */}
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }} className="bg-white w-full max-w-lg relative z-10 shadow-2xl p-10 md:p-14 rounded-sm">
                    <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-black cursor-pointer"><CloseIcon /></button>
                    
                    <h2 className="text-xl font-bold uppercase tracking-widest mb-2 mt-2">Submit Review</h2>
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-normal mb-10">Rate your purchase of <span className="font-bold text-black">{productName}</span></p>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Star Rating Select */}
                        <div>
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-3 text-center">Your Rating</label>
                            <div className="flex gap-3 justify-center text-black">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button key={star} type="button" onClick={() => setRating(star)}>
                                        <StarIcon filled={star <= rating} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Comment Textarea */}
                        <div>
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-3">Share your experience</label>
                            <textarea required value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Tell others what you think about this fragrance..." rows="5" className="w-full border border-gray-200 p-5 text-sm outline-none focus:border-black transition resize-none placeholder:text-gray-300"></textarea>
                        </div>

                        <button type="submit" disabled={isSubmitting} className="w-full bg-black text-white py-4 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition disabled:bg-gray-300">
                            {isSubmitting ? 'Submitting...' : 'Post Verified Review'}
                        </button>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}