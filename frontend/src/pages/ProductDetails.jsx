import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import Helmet from '../components/Helmet';

// --- INLINE ICONS ---
const CloseIcon = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);
const ShieldIcon = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>);
const TruckIcon = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>);
const LockIcon = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>);
const StarIcon = ({ filled, size = "4" }) => (
    <svg fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-${size} h-${size} text-black`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
);

const AVAILABLE_SIZES = ["100ML", "30ML", "3ML"];

export default function ProductDetails({ addToCart }) {
    const { id } = useParams();
    const token = localStorage.getItem('token');
    
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const [activeImage, setActiveImage] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState("100ML"); 

    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
    const [submitLoading, setSubmitLoading] = useState(false);
    const [purchaseError, setPurchaseError] = useState(false);
    const [canReview, setCanReview] = useState(false); 

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/products/${id}`);
                const data = res.data.data;
                setProduct(data);
                
                if (data.cover_image_url) {
                    setActiveImage(data.cover_image_url);
                } else if (data.images && data.images.length > 0) {
                    setActiveImage(data.images[0]);
                } else {
                    setActiveImage("https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800");
                }
                
                if (data.stock100ml <= 0) {
                    if (data.stock30ml > 0) setSelectedSize("30ML");
                    else if (data.stock3ml > 0) setSelectedSize("3ML");
                }

                setLoading(false);
            } catch (error) { setLoading(false); }
        };

        const checkIfBuyer = async () => {
            if (!token) return;
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/orders/check-purchase/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCanReview(res.data.hasPurchased);
            } catch (error) {
                console.error("Error checking purchase status", error);
            }
        };

        fetchProduct();
        checkIfBuyer();
        window.scrollTo(0, 0); 
    }, [id, token]);

    const currentPrice = selectedSize === '100ML' ? product?.price : (selectedSize === '30ML' ? product?.price30ml : product?.price3ml);
    const currentStock = selectedSize === '100ML' ? product?.stock100ml : (selectedSize === '30ML' ? product?.stock30ml : product?.stock3ml);

    const handleAddToCart = () => {
        addToCart({ 
            productId: product.id, 
            name: product.name, 
            price: currentPrice, 
            imageUrl: activeImage, 
            size: selectedSize, 
            quantity 
        });
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!token) return alert("Please log in to submit a review.");
        setPurchaseError(false);
        setSubmitLoading(true);

        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/products/${id}/reviews`, newReview, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Review submitted successfully!");
            window.location.reload(); 
        } catch (error) {
            setSubmitLoading(false);
            if (error.response?.status === 403) setPurchaseError(true);
            else alert(error.response?.data?.message || "Submit failed.");
        }
    };

    const slideIn = { hidden: { x: -20, opacity: 0 }, visible: { x: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } } };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-[10px] uppercase font-bold tracking-widest text-gray-400">Loading...</div>;
    if (!product) return <div className="min-h-screen flex items-center justify-center text-[10px] uppercase font-bold tracking-widest text-gray-400">Fragrance not found.</div>;

    const avgRating = product.reviews?.length > 0 
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length 
        : 0;

    const topNotes = product.topNotes || "Bergamot, Pink Pepper, Grapefruit";
    const heartNotes = product.heartNotes || "Rose, Jasmine, Iris";
    const baseNotes = product.baseNotes || "Vanilla, Amber, White Musk";
    const scentFamily = product.scentFamily || "Floral Oriental";

    const has100ml = product.price !== null && product.price !== undefined;
    const has30ml = product.price30ml !== null && product.price30ml !== undefined;
    const has3ml = product.price3ml !== null && product.price3ml !== undefined;

    return (
        <div className="min-h-screen bg-white pt-28 pb-20 font-sans text-black overflow-x-hidden">
            <Helmet title={`${product.name} | ER Parfums`} />
            
            <div className="max-w-[1600px] mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                
                {/* --- INTERACTIVE IMAGE GALLERY --- */}
                <motion.div initial="hidden" animate="visible" variants={slideIn} className="lg:col-span-7 grid grid-cols-12 gap-4 h-[600px] lg:h-[800px]">
                    <div className="col-span-2 flex flex-col gap-4 overflow-y-auto scrollbar-hide pr-2">
                        {product.images && product.images.length > 0 ? (
                            product.images.map((imgUrl, index) => (
                                <img 
                                    key={index} 
                                    src={imgUrl} 
                                    onClick={() => setActiveImage(imgUrl)} 
                                    className={`w-full aspect-[3/4] object-cover cursor-pointer border transition-all ${activeImage === imgUrl ? 'border-black opacity-100' : 'border-gray-200 opacity-60 hover:opacity-100'}`}
                                    alt={`Thumbnail ${index + 1}`}
                                />
                            ))
                        ) : (
                            <img src={activeImage} className="w-full aspect-[3/4] object-cover border border-black cursor-pointer" alt="Thumbnail" />
                        )}
                    </div>
                    <div className="col-span-10 bg-gray-50 h-full relative">
                        <img src={activeImage} className="w-full h-full object-contain object-top absolute inset-0 mix-blend-multiply" alt={product.name}/>
                    </div>
                </motion.div>

                {/* --- PRODUCT DETAILS --- */}
                <motion.div initial="hidden" animate="visible" variants={slideIn} transition={{ delay: 0.2 }} className="lg:col-span-5 space-y-10 lg:sticky lg:top-32">
                    <div>
                        <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-gray-400 mb-3">{product.category} • {scentFamily}</p>
                        <h1 className="text-3xl md:text-4xl font-normal tracking-[0.15em] uppercase logo-font mb-4 text-black">{product.name}</h1>
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-6">Inspired by the world's most recognized fragrances</p>
                        
                        <div className="flex items-center gap-6 border-b border-gray-100 pb-8 mb-8">
                            <p className="text-3xl font-bold">₱{currentPrice?.toLocaleString() || '---'}</p>
                            <div className="flex items-center gap-1.5 border border-gray-100 bg-gray-50 px-3 py-1.5 rounded-full">
                                {[1,2,3,4,5].map(star => <StarIcon key={star} filled={star <= Math.round(avgRating)} />)}
                                <span className="text-xs font-bold ml-1 text-black">{product.reviews?.length || 0} Reviews</span>
                            </div>
                        </div>
                    </div>

                    <div className="text-sm text-gray-700 leading-loose space-y-6">
                        <p>{product.description}</p>
                        
                        {/* SHOPEE STYLE BULLET POINTS */}
                        {product.details && (
                            <div className="pt-4 mt-4 border-t border-gray-100">
                                <ul className="space-y-2 text-xs">
                                    {product.details.split('\n').map((point, index) => {
                                        if (!point.trim()) return null;
                                        return (
                                            <li key={index} className="flex items-start gap-2">
                                                {!point.trim().startsWith('•') && <span className="text-gray-400 mt-1">•</span>}
                                                <span>{point.trim()}</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-50 border border-gray-100 p-8 space-y-6">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-black border-b border-gray-200 pb-4">Olfactory Notes</h3>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-[9px] uppercase tracking-widest text-gray-400 font-bold mb-2">Top</p>
                                <p className="text-xs font-serif text-gray-900 leading-relaxed">{topNotes}</p>
                            </div>
                            <div>
                                <p className="text-[9px] uppercase tracking-widest text-gray-400 font-bold mb-2">Heart</p>
                                <p className="text-xs font-serif text-gray-900 leading-relaxed">{heartNotes}</p>
                            </div>
                            <div>
                                <p className="text-[9px] uppercase tracking-widest text-gray-400 font-bold mb-2">Base</p>
                                <p className="text-xs font-serif text-gray-900 leading-relaxed">{baseNotes}</p>
                            </div>
                        </div>
                    </div>

                    {/* --- DYNAMIC SIZE SELECTION --- */}
                    <div className="space-y-6 pt-6">
                        <div className="flex justify-between items-center mb-4">
                            <p className="font-semibold uppercase tracking-widest text-black text-[11px]">Select Volume</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                {currentStock > 0 ? `${currentStock} in stock` : 'Out of Stock'}
                            </p>
                        </div>
                        
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setSelectedSize('100ML')} 
                                disabled={!has100ml}
                                className={`flex-1 py-4 border text-[11px] font-bold tracking-widest uppercase transition ${selectedSize === '100ML' ? 'border-black bg-black text-white' : has100ml ? 'border-gray-200 text-gray-500 hover:border-black cursor-pointer' : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed opacity-50'}`}
                            >
                                100 ML {!has100ml && <span className="text-[9px] block mt-1">(N/A)</span>}
                            </button>
                            <button 
                                onClick={() => setSelectedSize('30ML')} 
                                disabled={!has30ml}
                                className={`flex-1 py-4 border text-[11px] font-bold tracking-widest uppercase transition ${selectedSize === '30ML' ? 'border-black bg-black text-white' : has30ml ? 'border-gray-200 text-gray-500 hover:border-black cursor-pointer' : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed opacity-50'}`}
                            >
                                30 ML {!has30ml && <span className="text-[9px] block mt-1">(N/A)</span>}
                            </button>
                            <button 
                                onClick={() => setSelectedSize('3ML')} 
                                disabled={!has3ml}
                                className={`flex-1 py-4 border text-[11px] font-bold tracking-widest uppercase transition ${selectedSize === '3ML' ? 'border-black bg-black text-white' : has3ml ? 'border-gray-200 text-gray-500 hover:border-black cursor-pointer' : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed opacity-50'}`}
                            >
                                3 ML {!has3ml && <span className="text-[9px] block mt-1">(N/A)</span>}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6 pt-10 mt-10 border-t border-gray-100">
                        <div className="flex items-center border border-gray-300 rounded-sm">
                            <button onClick={()=>setQuantity(q=>Math.max(1,q-1))} className="px-6 py-4 text-gray-500 hover:text-black transition">−</button>
                            <span className="px-6 py-4 text-sm font-bold w-16 text-center text-black border-l border-r border-gray-200">{quantity}</span>
                            <button onClick={()=>setQuantity(q=>q+1)} className="px-6 py-4 text-gray-500 hover:text-black transition">+</button>
                        </div>
                        <button onClick={handleAddToCart} disabled={currentStock < 1 || !currentPrice} className="w-full bg-black text-white px-10 py-5 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition shadow-sm cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap">
                            {(currentStock < 1 || !currentPrice) ? 'Unavailable' : `Add to Bag | ${selectedSize} (₱${currentPrice?.toLocaleString()})`}
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100">
                        <div className="flex flex-col items-center text-center gap-3">
                            <ShieldIcon />
                            <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">FDA Approved<br/>Guarantee</span>
                        </div>
                        <div className="flex flex-col items-center text-center gap-3">
                            <TruckIcon />
                            <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Fast Delivery<br/>Nationwide</span>
                        </div>
                        <div className="flex flex-col items-center text-center gap-3">
                            <LockIcon />
                            <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Secure<br/>Checkout</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* --- REVIEWS SECTION --- */}
            <div className="max-w-[1600px] mx-auto px-6 md:px-10 py-32 mt-32 border-t border-gray-100 bg-gray-50 rounded-sm">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-gray-200 pb-10 mb-16">
                    <h2 className="text-2xl md:text-3xl font-normal tracking-[0.15em] uppercase logo-font text-black">Fragrance Reviews</h2>
                    <div className="flex items-center gap-3 border border-gray-100 bg-white px-5 py-3 rounded-full">
                        {[1,2,3,4,5].map(star => <StarIcon key={star} filled={star <= Math.round(avgRating)} />)}
                        <span className="text-sm font-bold text-black">{avgRating.toFixed(1)} out of 5</span>
                    </div>
                </header>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    <div className="lg:col-span-5 space-y-10 lg:sticky lg:top-32 bg-white p-10 border border-gray-100 shadow-sm">
                        
                        {canReview ? (
                            <form onSubmit={handleReviewSubmit} className="space-y-8">
                                <h3 className="text-[11px] font-bold uppercase tracking-widest text-black mb-1">Share Your Experience</h3>
                                
                                <AnimatePresence>
                                    {purchaseError && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex justify-between items-start bg-red-50 border border-red-100 p-4 text-red-700 text-xs leading-relaxed uppercase tracking-widest">
                                            You can only leave a review after your order is marked as COMPLETED. If you've purchased it, please check your purchase history.
                                            <button type="button" onClick={()=>setPurchaseError(false)} className="text-red-400 hover:text-red-700 ml-4"><CloseIcon/></button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                
                                <div>
                                    <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500 block mb-4">Rating</label>
                                    <div className="flex gap-1.5 border border-gray-200 bg-gray-50 p-3 rounded-full justify-center w-48">
                                        {[1,2,3,4,5].map(star => <button key={star} type="button" onClick={()=>setNewReview({...newReview, rating: star})} className="cursor-pointer">
                                            <StarIcon filled={star <= newReview.rating} size="5" />
                                        </button>)}
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500 block mb-3">Comment (Optional)</label>
                                    <textarea required rows="5" value={newReview.comment} onChange={(e)=>setNewReview({...newReview, comment: e.target.value})} className="w-full border border-gray-300 p-4 text-sm focus:border-black transition resize-none outline-none"/>
                                </div>
                                
                                <button type="submit" disabled={submitLoading} className="w-full bg-black text-white px-10 py-4 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition shadow-sm cursor-pointer disabled:bg-gray-400">
                                    {submitLoading ? 'Submitting...' : 'Post Review'}
                                </button>
                            </form>
                        ) : (
                            <div className="p-10 text-center bg-gray-50 border border-gray-200 shadow-sm">
                                <ShieldIcon className="w-8 h-8 mx-auto text-gray-400 mb-4" />
                                <h3 className="text-[11px] font-bold uppercase tracking-widest text-black mb-2">Verified Buyers Only</h3>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    You must purchase and receive this fragrance before leaving a review.
                                </p>
                            </div>
                        )}

                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-12 pt-8 border-t border-gray-100 text-center">Reviews require manual verification.</p>
                    </div>

                    <div className="lg:col-span-7 space-y-12">
                        {(!product.reviews || product.reviews.length === 0) ? (
                             <div className="flex items-center justify-center text-center text-[10px] text-gray-500 uppercase tracking-widest font-bold py-24 bg-gray-50 border border-gray-200 shadow-sm">
                                 No reviews yet. Be the first to share your scent.
                             </div>
                        ) : (
                            product.reviews.map(review => (
                                <div key={review.id} className="border-b border-gray-100 pb-8">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-xs overflow-hidden">
                                                {review.user?.avatar ? <img src={review.user.avatar} className="w-full h-full object-cover" /> : review.user?.fullname?.[0] || 'U'}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-widest">{review.user?.fullname || 'Anonymous'}</p>
                                                <p className="text-[9px] text-green-600 font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
                                                    <ShieldIcon /> Verified Buyer
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex">
                                            {[1,2,3,4,5].map(star => <StarIcon key={star} filled={star <= review.rating} />)}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                                    <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-4">{new Date(review.createdAt).toLocaleDateString()}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}