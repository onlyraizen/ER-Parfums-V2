import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const CloseIcon = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);

export default function SearchOverlay({ isOpen, onClose }) {
    const [query, setQuery] = useState('');
    const navigate = useNavigate();
    const inputRef = useRef(null);

    // Auto-focus input when overlay opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        navigate(`/collection?q=${encodeURIComponent(query.trim())}`);
        onClose(); 
        setQuery('');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex flex-col">
                    {/* Dark Background Overlay */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 bg-black/50" onClick={onClose}></motion.div>
                    
                    {/* Pure White Search Strip (Luxury Style) */}
                    <motion.div initial={{ y: '-100%' }} animate={{ y: 0 }} exit={{ y: '-100%' }} transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }} className="relative bg-white w-full shadow-2xl p-6 md:p-10 border-b border-gray-100 z-10">
                        <div className="max-w-[1400px] mx-auto flex items-center gap-6">
                            <form onSubmit={handleSearch} className="flex-1 relative">
                                <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="SEARCH FOR A FRAGRANCE, COLLECTION, OR NOTE..." className="w-full border border-gray-200 p-5 text-sm md:text-base outline-none focus:border-black transition font-sans uppercase tracking-widest placeholder:text-gray-300 placeholder:normal-case shadow-inner" />
                                <button type="submit" className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-black">
                                    Submit
                                </button>
                            </form>
                            <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors cursor-pointer"><CloseIcon /></button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}