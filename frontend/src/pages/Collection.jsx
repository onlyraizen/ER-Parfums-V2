import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios'; 

export default function Collection({ addToCart }) {
    const { category } = useParams();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true); 
    
    const [sortBy, setSortBy] = useState('Best Seller');
    
    const queryParams = new URLSearchParams(window.location.search);
    const searchQuery = queryParams.get('q') || '';

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/products`, {
                    params: {
                        category: category || 'All',
                        search: searchQuery
                    }
                });
                
                setProducts(res.data.data || []);
            } catch (error) { 
                console.error("Error fetching collection:", error.message); 
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
        window.scrollTo(0, 0); 
    }, [category, searchQuery]);

    const handleQuickAdd = (e, product) => {
        e.preventDefault(); 
        e.stopPropagation();
        
        if (!addToCart) {
            console.error("addToCart function not passed to Collection component");
            return;
        }

        const productImageUrl = product.cover_image_url || (product.images && product.images.length > 0 
            ? product.images[0] 
            : "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800");

        addToCart({
            id: `${product.id}-100ml`,
            productId: product.id,
            name: `${product.name} (100ml)`,
            price: product.price, 
            image: productImageUrl
        });
    };

    const sortedProducts = [...products].sort((a, b) => {
        if (sortBy === 'Price: Low to High') {
            return (a.price || 0) - (b.price || 0);
        } else if (sortBy === 'Price: High to Low') {
            return (b.price || 0) - (a.price || 0);
        }
        return 0; 
    });

    const displayTitle = searchQuery ? `Search: ${searchQuery}` : (category || 'The Collection');

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a] pt-40 pb-24 px-10 font-sans transition-colors duration-300">
            <div className="max-w-[1600px] mx-auto">
                <header className="mb-12 text-center">
                    <h1 className="text-4xl font-normal tracking-[0.15em] uppercase logo-font text-black dark:text-white transition-colors">{displayTitle}</h1>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-4">
                        {loading ? 'Loading...' : `${products.length} Fragrances Found`}
                    </p>
                </header>

                {!loading && products.length > 0 && (
                    <div className="flex justify-end mb-8">
                        <div className="flex items-baseline gap-2 text-[10px] uppercase tracking-widest font-bold text-gray-500 dark:text-gray-400">
                            <label htmlFor="sortOptions">Sort By:</label>
                            <select 
                                id="sortOptions" 
                                value={sortBy} 
                                onChange={(e) => setSortBy(e.target.value)}
                                className="border-none bg-transparent outline-none cursor-pointer focus:ring-0 text-black dark:text-white font-bold uppercase tracking-widest p-0 pl-1 [&>option]:bg-white dark:[&>option]:bg-black"
                            >
                                <option value="Best Seller">Best Seller</option>
                                <option value="Price: Low to High">Price: Low to High</option>
                                <option value="Price: High to Low">Price: High to Low</option>
                            </select>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="h-64 flex items-center justify-center text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                        Fetching latest collection...
                    </div>
                ) : products.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                        No products currently available.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-16">
                        {sortedProducts.map(product => {
                            const displayImage = product.cover_image_url || (product.images && product.images.length > 0 
                                ? product.images[0] 
                                : "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800");

                            return (
                                <Link to={`/product/${product.id}`} key={product.id} className="group relative overflow-hidden cursor-pointer block">
                                    
                                    <div className="relative aspect-[4/5] overflow-hidden bg-stone-100 dark:bg-stone-900 transition-colors duration-300">
                                        <img 
                                            src={displayImage} 
                                            alt={product.name} 
                                            className="object-cover w-full h-full grayscale transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105 group-hover:opacity-90 group-hover:grayscale-0 mix-blend-multiply dark:mix-blend-normal" 
                                        />
                                        
                                        <button 
                                            onClick={(e) => handleQuickAdd(e, product)}
                                            className="absolute top-4 right-4 bg-white/90 dark:bg-black/90 text-black dark:text-white p-2 rounded-full opacity-0 translate-y-2 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:opacity-100 group-hover:translate-y-0 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black shadow-sm"
                                            title="Quick Add 100ml"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                            </svg>
                                        </button>

                                        <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 translate-y-4 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:opacity-100 group-hover:translate-y-0">
                                            <div className="flex gap-2 text-xs text-white uppercase tracking-widest">
                                                <span className="backdrop-blur-sm bg-white/20 px-2 py-1">{product.category}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-col items-center text-center">
                                        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 mb-1 transition-colors">
                                            {product.category.toLowerCase().includes('women') ? 'Pour Femme' : product.category.toLowerCase().includes('men') ? 'Pour Homme' : 'Unisex'}
                                        </p>
                                        <h3 className="text-lg font-serif tracking-wide text-gray-900 dark:text-gray-100 transition-colors">{product.name}</h3>
                                        
                                        <div className="flex items-center justify-between w-full mt-2 px-2 text-sm">
                                            <p className="text-black dark:text-white font-medium tracking-widest transition-colors">₱{(product.price || 0).toLocaleString()}</p>
                                            
                                            <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 transition-colors">
                                                100ml {product.price30ml ? '· 30ml' : ''} {product.price3ml ? '· 3ml' : ''}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}