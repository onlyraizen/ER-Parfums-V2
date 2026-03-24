import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';

export default function Home() {
    const [featured, setFeatured] = useState([]);

    useEffect(() => {
        const fetchFeatured = async () => {
            try {
                // Fetch products and grab the first 4 to feature on the homepage
                const res = await axios.get('http://localhost:5000/api/products');
                setFeatured(res.data.data.slice(0, 4)); 
            } catch (error) {
                console.error("Error fetching featured products");
            }
        };
        fetchFeatured();
    }, []);

    return (
        <div className="bg-white font-sans">
            {/* HERO SECTION */}
            <div className="relative h-screen flex items-center justify-center overflow-hidden bg-black">
                <div className="absolute inset-0 z-0">
                    <img 
                        src="https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=2000" 
                        alt="ER Parfums Hero" 
                        className="w-full h-full object-cover object-center opacity-60"
                    />
                </div>
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="relative z-10 text-center text-white px-4 mt-20"
                >
                    <h1 className="text-5xl md:text-7xl font-normal tracking-widest uppercase mb-6 logo-font">
                        The New Essence
                    </h1>
                    <p className="text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase mb-12">
                        The best version of your branded perfume
                    </p>
                    <Link 
                        to="/collection" 
                        className="inline-block border border-white px-10 py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-colors duration-300 backdrop-blur-sm cursor-pointer"
                    >
                        Explore Collection
                    </Link>
                </motion.div>
            </div>

            {/* FEATURED PRODUCTS SECTION */}
            <div className="max-w-[1600px] mx-auto px-10 py-24">
                <div className="flex justify-between items-end border-b border-gray-200 pb-6 mb-12">
                    <h2 className="text-2xl font-normal tracking-[0.15em] uppercase logo-font text-black">Featured Highlights</h2>
                    <Link to="/collection" className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors">View All</Link>
                </div>

                {featured.length === 0 ? (
                     <div className="text-center text-[10px] text-gray-400 uppercase tracking-widest font-bold py-10">
                         Loading featured items...
                     </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
                        {featured.map(product => (
                            <Link to={`/product/${product.id}`} key={product.id} className="group cursor-pointer">
                                <div className="bg-gray-50 aspect-[3/4] mb-6 overflow-hidden relative">
                                    <img src="https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800" alt={product.name} className="w-full h-full object-cover grayscale transition-transform duration-700 group-hover:scale-105" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-black mb-2">{product.name}</h3>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">{product.category}</p>
                                    <p className="text-sm font-bold text-black">₱{product.price.toLocaleString()}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}