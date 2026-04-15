import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const CloseIcon = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);

export default function SearchOverlay({ isOpen, onClose }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    
    const navigate = useNavigate();
    const inputRef = useRef(null);

    // Auto-focus input when overlay opens and clean up state when it closes
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        } else {
            document.body.style.overflow = '';
            setQuery('');
            setResults([]);
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Predictive Search Logic (Debounced)
    useEffect(() => {
        const fetchPredictiveResults = async () => {
            if (!query.trim()) {
                setResults([]);
                return;
            }
            
            setIsSearching(true);
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/products`, {
                    params: { search: query.trim() }
                });
                // Only show the top 4 results in the quick dropdown
                setResults(res.data.data.slice(0, 4) || []);
            } catch (error) {
                console.error("Predictive search error:", error);
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        };

        // Wait 300ms after the user stops typing to fire the API call
        const debounceTimer = setTimeout(fetchPredictiveResults, 300);
        return () => clearTimeout(debounceTimer);
    }, [query]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        navigate(`/collection?q=${encodeURIComponent(query.trim())}`);
        onClose(); 
        setQuery('');
        setResults([]);
    };

    const handleResultClick = (productId) => {
        navigate(`/product/${productId}`);
        onClose();
        setQuery('');
        setResults([]);
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
                                <input 
                                    ref={inputRef} 
                                    type="text" 
                                    value={query} 
                                    onChange={(e) => setQuery(e.target.value)} 
                                    placeholder="SEARCH FOR A FRAGRANCE, COLLECTION, OR NOTE..." 
                                    className="w-full border border-gray-200 p-5 text-sm md:text-base outline-none focus:border-black transition font-sans uppercase tracking-widest placeholder:text-gray-300 placeholder:normal-case shadow-inner relative z-20 bg-white" 
                                />
                                <button type="submit" className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-black z-20 cursor-pointer">
                                    Submit
                                </button>

                                {/* --- PREDICTIVE SEARCH DROPDOWN --- */}
                                {query.trim() && (
                                    <div className="absolute top-full left-0 w-full bg-white border border-t-0 border-gray-200 shadow-xl z-10">
                                        {isSearching ? (
                                            <div className="p-8 text-center text-[10px] uppercase tracking-widest font-bold text-gray-400">
                                                Searching...
                                            </div>
                                        ) : results.length > 0 ? (
                                            <div className="flex flex-col">
                                                {results.map(product => {
                                                    const displayImage = product.cover_image_url || (product.images && product.images.length > 0 ? product.images[0] : "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800");
                                                    return (
                                                        <div 
                                                            key={product.id} 
                                                            onClick={() => handleResultClick(product.id)}
                                                            className="flex items-center gap-6 p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                                                        >
                                                            <div className="w-12 h-16 bg-gray-100 shrink-0">
                                                                <img src={displayImage} alt={product.name} className="w-full h-full object-cover mix-blend-multiply" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-sm font-serif tracking-wide text-black">{product.name}</p>
                                                                <p className="text-[9px] uppercase tracking-widest text-gray-400 mt-1">{product.category}</p>
                                                            </div>
                                                            <div className="text-sm font-bold text-black tracking-widest pr-4">
                                                                ₱{(product.price || 0).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                                <button 
                                                    type="button" 
                                                    onClick={handleSearch} 
                                                    className="w-full p-4 bg-gray-50 text-[10px] uppercase font-bold tracking-[0.2em] text-gray-500 hover:text-black hover:bg-gray-100 transition-colors text-center cursor-pointer"
                                                >
                                                    View All Results For "{query}"
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center text-[10px] uppercase tracking-widest font-bold text-gray-400">
                                                No fragrances found for "{query}"
                                            </div>
                                        )}
                                    </div>
                                )}
                            </form>

                            <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors cursor-pointer"><CloseIcon /></button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}