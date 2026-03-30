import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const StarIcon = ({ filled }) => (
    <svg fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-black">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
);

export default function ProductDetails({ addToCart, requireAuth }) {
    const { id } = useParams();
    const token = localStorage.getItem('token');
    
    const [product, setProduct] = useState(null);
    const [selectedSize, setSelectedSize] = useState('100ml');
    
    // Review States
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchProduct = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/products/${id}`);
            setProduct(res.data.data);
        } catch (error) { console.error("Error fetching product"); }
    };

    useEffect(() => { fetchProduct(); }, [id]);

    if (!product) return <div className="min-h-screen pt-40 text-center text-[10px] uppercase font-bold tracking-widest">Loading...</div>;

    const currentPrice = selectedSize === '100ml' ? product.price : (selectedSize === '30ml' ? product.price30ml : product.price3ml);
    
    // Calculate Average Rating
    const avgRating = product.reviews?.length > 0 
        ? (product.reviews.reduce((sum, rev) => sum + rev.rating, 0) / product.reviews.length).toFixed(1) 
        : null;

    const handleAddToCart = () => {
        addToCart({
            id: `${product.id}-${selectedSize}`,
            productId: product.id,
            name: `${product.name} (${selectedSize})`,
            price: currentPrice,
            image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800"
        });
    };

    const submitReview = async (e) => {
        e.preventDefault();
        if (!token) return alert("Please log in to leave a review.");
        setIsSubmitting(true);
        try {
            await axios.post(`http://localhost:5000/api/products/${id}/reviews`, 
                { rating, comment }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("Review submitted successfully!");
            setComment('');
            setRating(5);
            fetchProduct(); // Refresh reviews
        } catch (error) {
            alert(error.response?.data?.message || "Failed to submit review.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-white pt-32 pb-24 font-sans">
            <div className="max-w-[1400px] mx-auto px-10 flex flex-col md:flex-row gap-16 border-b border-gray-100 pb-24">
                <div className="w-full md:w-1/2 bg-gray-50 h-[800px]">
                    <img src="https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=1200" alt={product.name} className="w-full h-full object-cover grayscale" />
                </div>
                
                <div className="w-full md:w-1/2 flex flex-col justify-center py-10 pr-10">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-4">{product.category}</p>
                    <h1 className="text-4xl font-normal tracking-[0.15em] uppercase logo-font mb-4">{product.name}</h1>
                    
                    {/* Stars Summary */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="flex">
                            {[1,2,3,4,5].map(star => <StarIcon key={star} filled={star <= Math.round(avgRating || 5)} />)}
                        </div>
                        <span className="text-xs text-gray-500 uppercase tracking-widest">{product.reviews?.length || 0} Reviews</span>
                    </div>

                    <p className="text-2xl font-bold tracking-widest mb-10">₱{currentPrice?.toLocaleString()}</p>
                    <p className="text-sm text-gray-600 leading-relaxed mb-12">{product.description}</p>
                    
                    <div className="mb-12">
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-4">Select Volume</p>
                        <div className="flex gap-4">
                            <button onClick={() => setSelectedSize('100ml')} className={`flex-1 py-4 border text-[11px] font-bold tracking-widest uppercase transition ${selectedSize === '100ml' ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-500 hover:border-black'}`}>100 ML</button>
                            {product.price30ml && <button onClick={() => setSelectedSize('30ml')} className={`flex-1 py-4 border text-[11px] font-bold tracking-widest uppercase transition ${selectedSize === '30ml' ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-500 hover:border-black'}`}>30 ML</button>}
                            {product.price3ml && <button onClick={() => setSelectedSize('3ml')} className={`flex-1 py-4 border text-[11px] font-bold tracking-widest uppercase transition ${selectedSize === '3ml' ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-500 hover:border-black'}`}>3 ML </button>}
                        </div>
                    </div>

                    <button onClick={handleAddToCart} disabled={product.stock < 1} className="w-full bg-black text-white py-5 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition disabled:bg-gray-300 disabled:cursor-not-allowed mb-6">
                        {product.stock < 1 ? 'Out of Stock' : 'Add to Bag'}
                    </button>

                    {/* Trust Badges */}
                    <div className="flex justify-between items-center pt-6 border-t border-gray-100 text-[9px] uppercase tracking-widest text-gray-500 font-bold">
                        <span className="flex items-center gap-2">✓ Verified Authentic</span>
                        <span className="flex items-center gap-2">✓ Free Returns</span>
                        <span className="flex items-center gap-2">✓ Secure Checkout</span>
                    </div>
                </div>
            </div>

            {/* --- REVIEWS SECTION --- */}
            <div className="max-w-[1000px] mx-auto px-10 pt-24">
                <div className="flex justify-between items-end mb-16 border-b border-gray-100 pb-6">
                    <div>
                        <h2 className="text-2xl font-normal tracking-[0.15em] uppercase logo-font text-black mb-2">Client Reviews</h2>
                        <p className="text-xs text-gray-500 uppercase tracking-widest">Verified Purchases Only</p>
                    </div>
                    {avgRating && <div className="text-4xl font-bold">{avgRating}<span className="text-lg text-gray-400 ml-1">/ 5</span></div>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                    {/* WRITE A REVIEW FORM */}
                    <div className="md:col-span-1">
                        {token ? (
                            <form onSubmit={submitReview} className="bg-gray-50 p-8 border border-gray-200">
                                <h3 className="text-xs font-bold uppercase tracking-widest mb-6">Write a Review</h3>
                                <div className="flex gap-2 mb-6">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button key={star} type="button" onClick={() => setRating(star)} className="focus:outline-none">
                                            <StarIcon filled={star <= rating} />
                                        </button>
                                    ))}
                                </div>
                                <textarea required value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your thoughts on this fragrance..." rows="4" className="w-full border border-gray-300 p-4 text-sm outline-none focus:border-black transition resize-none mb-6 placeholder:text-gray-400"></textarea>
                                <button type="submit" disabled={isSubmitting} className="w-full bg-black text-white py-3.5 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition disabled:bg-gray-300">
                                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                                </button>
                            </form>
                        ) : (
                            <div className="bg-gray-50 p-8 border border-gray-200 text-center">
                                <p className="text-xs text-gray-500 uppercase tracking-widest mb-4 leading-relaxed">You must be logged in to review a fragrance.</p>
                                <button onClick={() => requireAuth(() => {})} className="border border-black px-6 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition">Log In</button>
                            </div>
                        )}
                    </div>

                    {/* REVIEWS LIST */}
                    <div className="md:col-span-2 space-y-8">
                        {(!product.reviews || product.reviews.length === 0) ? (
                            <p className="text-sm text-gray-400">No reviews yet. Be the first to share your thoughts.</p>
                        ) : (
                            product.reviews.map(review => (
                                <div key={review.id} className="border-b border-gray-100 pb-8">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-xs overflow-hidden">
                                                {review.user.avatar ? <img src={review.user.avatar} className="w-full h-full object-cover" /> : review.user.fullname[0]}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-widest">{review.user.fullname}</p>
                                                <p className="text-[9px] text-green-600 font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    Verified Buyer
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