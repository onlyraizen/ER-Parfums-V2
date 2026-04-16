import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const CloseIcon = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);

export default function CartDrawer({ isOpen, onClose, cart, updateQuantity, requireAuth }) {
    const navigate = useNavigate();
    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const handleCheckout = () => {
        onClose();
        requireAuth(() => navigate('/cart'));
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[999] flex justify-end">
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-black/60" 
                        onClick={onClose} 
                    />
                    <motion.div 
                        initial={{ x: '100%' }} 
                        animate={{ x: 0 }} 
                        exit={{ x: '100%' }} 
                        transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }} 
                        className="w-full max-w-md bg-white h-full relative z-10 shadow-2xl flex flex-col"
                    >
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold uppercase tracking-widest">My Bag ({cart.length})</h2>
                            <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors cursor-pointer"><CloseIcon /></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            {cart.length === 0 ? (
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest text-center mt-10 font-bold">Your bag is empty.</p>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="flex gap-6">
                                        {/* FIXED: Added support for both item.image and item.imageUrl */}
                                        <div className="w-24 h-32 bg-gray-50 shrink-0">
                                            <img src={item.image || item.imageUrl} className="w-full h-full object-cover grayscale" alt={item.name} />
                                        </div>
                                        <div className="flex flex-col justify-between py-1 flex-1">
                                            <div>
                                                <h3 className="text-xs font-bold uppercase tracking-widest">{item.name}</h3>
                                                <p className="text-[11px] font-bold mt-2">₱{item.price.toLocaleString()}</p>
                                            </div>
                                            <div className="flex items-center border border-gray-200 w-24">
                                                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-3 py-1 text-gray-500 hover:text-black transition cursor-pointer">-</button>
                                                <span className="flex-1 text-center text-xs font-bold">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-3 py-1 text-gray-500 hover:text-black transition cursor-pointer">+</button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {cart.length > 0 && (
                            <div className="p-8 border-t border-gray-100 bg-gray-50">
                                <div className="flex justify-between mb-6 text-sm font-bold uppercase tracking-widest"><span>Subtotal</span><span>₱{cartTotal.toLocaleString()}</span></div>
                                <button onClick={handleCheckout} className="w-full bg-black text-white py-4 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition shadow-sm cursor-pointer">Proceed to Checkout</button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}