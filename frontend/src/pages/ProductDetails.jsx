import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

export default function ProductDetails({ addToCart }) {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [selectedSize, setSelectedSize] = useState('100ml');

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/products/${id}`);
                setProduct(res.data.data);
            } catch (error) { console.error("Error fetching product"); }
        };
        fetchProduct();
    }, [id]);

    if (!product) return <div className="min-h-screen pt-40 text-center text-[10px] uppercase font-bold tracking-widest">Loading...</div>;

    const currentPrice = selectedSize === '100ml' ? product.price : (selectedSize === '30ml' ? product.price30ml : product.price3ml);

    const handleAddToCart = () => {
        addToCart({
            id: `${product.id}-${selectedSize}`,
            productId: product.id,
            name: `${product.name} (${selectedSize})`,
            price: currentPrice,
            image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800"
        });
    };

    return (
        <div className="min-h-screen bg-white pt-32 pb-24 font-sans">
            <div className="max-w-[1400px] mx-auto px-10 flex flex-col md:flex-row gap-16">
                <div className="w-full md:w-1/2 bg-gray-50 h-[800px]">
                    <img src="https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=1200" alt={product.name} className="w-full h-full object-cover grayscale" />
                </div>
                
                <div className="w-full md:w-1/2 flex flex-col justify-center py-10 pr-10">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-4">{product.category}</p>
                    <h1 className="text-4xl font-normal tracking-[0.15em] uppercase logo-font mb-6">{product.name}</h1>
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

                    <button onClick={handleAddToCart} disabled={product.stock < 1} className="w-full bg-black text-white py-5 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition disabled:bg-gray-300 disabled:cursor-not-allowed">
                        {product.stock < 1 ? 'Out of Stock' : 'Add to Bag'}
                    </button>
                </div>
            </div>
        </div>
    );
}