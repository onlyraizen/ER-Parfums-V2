import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';

export default function Home() {
    const [featured, setFeatured] = useState([]);

    useEffect(() => {
        const fetchFeatured = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/products`);
                setFeatured(res.data.data.slice(0, 4)); 
            } catch (error) {
                console.error("Error fetching featured products");
            }
        };
        fetchFeatured();
    }, []);

    const slideUp = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };

    return (
        <div className="bg-white dark:bg-[#0a0a0a] font-sans transition-colors duration-300">
            
            {/* --- 1. HERO SECTION --- */}
            <div className="relative h-screen flex items-center justify-center overflow-hidden bg-black">
                <div className="absolute inset-0 z-0 scale-110 blur-xl opacity-80">
                    <img src="/images/hero-luxury.jpg" className="w-full h-full object-cover"/>
                </div>
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="relative z-10 text-center text-white px-4 mt-20"
                >
                    <h1 className="text-5xl md:text-7xl font-normal tracking-widest uppercase mb-6 logo-font drop-shadow-xl">
                        ER PARFUMS
                    </h1>
                    <p className="text-sm md:text-lg font-bold tracking-[0.2em] uppercase mb-12 drop-shadow-md">
                        The Best Version of your Branded Perfume
                    </p>
                    <Link 
                        to="/collection" 
                        className="inline-block border border-white px-10 py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-colors duration-300 backdrop-blur-sm cursor-pointer shadow-lg"
                    >
                        Explore Collection
                    </Link>
                </motion.div>
            </div>

            {/* --- 2. THE FINEST INGREDIENTS SECTION --- */}
            <div className="py-32 px-10 border-b border-gray-100 dark:border-gray-800 max-w-[1200px] mx-auto text-center transition-colors duration-300">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={slideUp} className="space-y-16">
                    
                    <div className="flex justify-center gap-12 text-black dark:text-white">
                        <div>
                            <img src="/images/rabbit-icon.jpg" alt="Cruelty-Free" className="w-20 h-20 mb-3 mx-auto rounded-full object-cover shadow-sm dark:brightness-90" />
                            <span className="text-[10px] uppercase font-bold tracking-widest">Cruelty-free<br/>and Vegan</span>
                        </div>
                        <div>
                            <img src="/images/flask-icon.jpg" alt="Safe Formula" className="w-20 h-20 mb-3 mx-auto rounded-full object-cover shadow-sm dark:brightness-90" />
                            <span className="text-[10px] uppercase font-bold tracking-widest">Paraben and<br/>Phthalate-free</span>
                        </div>
                        <div>
                            <img src="/images/leaf-icon.jpg" alt="Grasse Formula" className="w-20 h-20 mb-3 mx-auto rounded-full object-cover shadow-sm dark:brightness-90" />
                            <span className="text-[10px] uppercase font-bold tracking-widest">Hypoallergenic<br/>Formula</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
                        <div>
                            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 tracking-widest uppercase mb-4 transition-colors">The Finest Ingredients</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-loose transition-colors">
                                Hailing from Grasse, the world's perfume capital, we ensure our affordable perfume meets the highest quality standards. We use clean ingredients to craft our quality fragrance, providing an exceptional experience with our refill perfume options.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 tracking-widest uppercase mb-4 transition-colors">Recognizable fragrance, gentle on your skin.</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-loose transition-colors">
                                Crafted with care, our affordable perfume is free from parabens and phthalates, cruelty-free, vegan, and hypoallergenic. It's the essence of safety, ethical fragrance, and quality fragrance for everyone, including options for refill perfume.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* --- 3. VOLUME COMPARISON SECTION --- */}
            <div className="py-24 px-10 bg-gray-50 dark:bg-[#111] border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={slideUp} className="max-w-[1200px] mx-auto text-center">
                    <img 
                        src="/images/volume-comparison.jpg" 
                        alt="Scent made simple. Volume comparison" 
                        className="w-full max-w-4xl mx-auto shadow-xl border border-white dark:border-gray-800 dark:brightness-90 transition-all duration-300"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                </motion.div>
            </div>

            {/* --- 4. FEATURED PRODUCTS SECTION --- */}
            <div className="max-w-[1600px] mx-auto px-10 py-32">
                <div className="flex justify-between items-end border-b border-gray-200 dark:border-gray-800 pb-6 mb-12 transition-colors duration-300">
                    <h2 className="text-2xl font-normal tracking-[0.15em] uppercase logo-font text-black dark:text-white transition-colors">Featured Highlights</h2>
                    <Link to="/collection" className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-black dark:hover:text-white transition-colors">View All</Link>
                </div>

                {featured.length === 0 ? (
                     <div className="text-center text-[10px] text-gray-400 uppercase tracking-widest font-bold py-10">
                         No highlights found.
                     </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
                        {featured.map(product => {
                            const displayImage = product.cover_image_url || (product.images && product.images.length > 0 
                                ? product.images[0] 
                                : "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800");

                            return (
                                <Link to={`/product/${product.id}`} key={product.id} className="group cursor-pointer">
                                    <div className="bg-gray-50 dark:bg-gray-900 aspect-[3/4] mb-6 overflow-hidden relative transition-colors duration-300">
                                        <img 
                                            src={displayImage} 
                                            alt={product.name} 
                                            className="w-full h-full object-cover grayscale transition-transform duration-700 group-hover:scale-105 group-hover:grayscale-0 mix-blend-multiply dark:mix-blend-normal" 
                                        />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-black dark:text-white mb-2 transition-colors">{product.name}</h3>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 transition-colors">{product.category}</p>
                                        <p className="text-sm font-bold text-black dark:text-white transition-colors">₱{(product.price || 0).toLocaleString()}</p>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}