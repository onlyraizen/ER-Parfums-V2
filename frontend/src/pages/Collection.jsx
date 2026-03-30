import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useParams, useNavigate } from 'react-router-dom';

// We pass in addToCart as a prop now for the Quick Add feature
export default function Collection({ addToCart }) {
    const { category } = useParams();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    
    // Get search query from URL if it exists
    const queryParams = new URLSearchParams(window.location.search);
    const searchQuery = queryParams.get('q') || '';

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                let url = 'http://localhost:5000/api/products';
                const params = [];
                if (category) params.push(`category=${category}`);
                if (searchQuery) params.push(`search=${searchQuery}`);
                if (params.length > 0) url += `?${params.join('&')}`;
                
                const res = await axios.get(url);
                setProducts(res.data.data);
            } catch (error) { console.error("Error fetching collection"); }
        };
        fetchProducts();
    }, [category, searchQuery]);

    // Handle Quick Add to Cart (Defaults to 100ml)
    const handleQuickAdd = (e, product) => {
        e.preventDefault(); // Prevents the Link wrap from navigating to the product page
        e.stopPropagation();
        
        if (!addToCart) {
            console.error("addToCart function not passed to Collection component");
            return;
        }

        addToCart({
            id: `${product.id}-100ml`,
            productId: product.id,
            name: `${product.name} (100ml)`,
            price: product.price,
            image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800"
        });
    };

    const displayTitle = searchQuery ? `Search: ${searchQuery}` : (category || 'The Collection');

    return (
        <div className="min-h-screen bg-white pt-40 pb-24 px-10 max-w-[1600px] mx-auto font-sans">
            <header className="mb-16 text-center">
                <h1 className="text-4xl font-normal tracking-[0.15em] uppercase logo-font">{displayTitle}</h1>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-4">{products.length} Fragrances Found</p>
            </header>

            {products.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                    No products currently available.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-16">
                    {products.map(product => (
                        <Link to={`/product/${product.id}`} key={product.id} className="group relative overflow-hidden cursor-pointer block">
                            
                            {/* --- PHASE 3: LUXURY IMAGE CONTAINER --- */}
                            <div className="relative aspect-[4/5] overflow-hidden bg-stone-100">
                                <img 
                                    src="https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800" 
                                    alt={product.name} 
                                    className="object-cover w-full h-full grayscale transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105 group-hover:opacity-90 group-hover:grayscale-0" 
                                />
                                
                                {/* QUICK ADD BUTTON (Reveals on hover) */}
                                <button 
                                    onClick={(e) => handleQuickAdd(e, product)}
                                    className="absolute top-4 right-4 bg-white/90 text-black p-2 rounded-full opacity-0 translate-y-2 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:opacity-100 group-hover:translate-y-0 hover:bg-black hover:text-white shadow-sm"
                                    title="Quick Add 100ml"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                    </svg>
                                </button>

                                {/* SCENT NOTES OVERLAY (Slides up on hover) */}
                                <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 translate-y-4 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:opacity-100 group-hover:translate-y-0">
                                    <div className="flex gap-2 text-xs text-white uppercase tracking-widest">
                                        <span className="backdrop-blur-sm bg-white/20 px-2 py-1">{product.category}</span>
                                    </div>
                                </div>
                            </div>

                            {/* --- PHASE 3: TEXT DETAILS --- */}
                            <div className="mt-4 flex flex-col items-center text-center">
                                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1">
                                    {product.category === 'Women' ? 'Pour Femme' : product.category === 'Men' ? 'Pour Homme' : 'Unisex'}
                                </p>
                                <h3 className="text-lg font-serif tracking-wide text-gray-900">{product.name}</h3>
                                
                                <div className="flex items-center justify-between w-full mt-2 px-2 text-sm">
                                    <p className="text-black font-medium tracking-widest">₱{product.price.toLocaleString()}</p>
                                    
                                    {/* Dynamic Sizes Label */}
                                    <p className="text-[10px] uppercase tracking-widest text-gray-400">
                                        100ml {product.price30ml ? '· 30ml' : ''} {product.price3ml ? '· 3ml' : ''}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}