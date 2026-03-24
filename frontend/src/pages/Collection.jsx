import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useParams, useNavigate } from 'react-router-dom';

export default function Collection() {
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
                        <Link to={`/product/${product.id}`} key={product.id} className="group cursor-pointer">
                            <div className="bg-gray-50 aspect-[3/4] mb-6 overflow-hidden relative">
                                <img src="https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800" alt={product.name} className="w-full h-full object-cover grayscale transition-transform duration-700 group-hover:scale-105" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-black mb-2">{product.name}</h3>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">{product.category}</p>
                                <p className="text-sm font-bold">₱{product.price.toLocaleString()}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}