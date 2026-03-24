import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { motion } from 'framer-motion';

const PlusIcon = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 inline-block mr-1 -mt-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>);

export default function Cart({ cart, setCart }) {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    
    const [user, setUser] = useState(null);
    const [standardForm, setStandardForm] = useState({ fullname: '', email: '' });
    const [submitLoading, setSubmitLoading] = useState(false);

    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(''); 
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('COD'); 
    
    const [manualAddress, setManualAddress] = useState({ street: '', barangay: '', city: '', province: '', region: '', zip: '' });

    const recaptchaRef = useRef(null);
    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    useEffect(() => {
        if (!token) return;
        const fetchUserDataAndData = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const userRes = await axios.get('http://localhost:5000/api/users/me', config);
                setUser(userRes.data.data);
                setStandardForm({ fullname: userRes.data.data.fullname, email: userRes.data.data.email });

                const defaultAddr = savedAddresses.find(a => a.isDefault);
                if (defaultAddr) setSelectedAddressId(defaultAddr.id);
            } catch (error) { console.error("Checkout fetch failed"); }
        };
        fetchUserDataAndData();
    }, [token]);

    const handleCheckout = async (e) => {
        e.preventDefault();
        if (!token) return alert("You must be logged in.");
        
        const recaptchaToken = recaptchaRef.current?.getValue();
        if (!recaptchaToken) return alert("Please complete the reCAPTCHA");

        // REMOVED: The strict shipping validation logic is gone!
        
        setSubmitLoading(true);

        const orderPayload = {
            user: standardForm,
            shippingAddressId: selectedAddressId,
            manualAddress: selectedAddressId === '' ? manualAddress : null,
            paymentMethod: selectedPaymentMethod,
            items: cart,
            total_amount: cartTotal,
            recaptchaToken
        };

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };

            if (selectedPaymentMethod === 'GCash') {
                const res = await axios.post('http://localhost:5000/api/checkout/paymongo', orderPayload, config);
                
                if (res.data && res.data.checkoutUrl) {
                    window.location.href = res.data.checkoutUrl; 
                } else {
                    alert("Failed to generate GCash payment link. Please try again.");
                    setSubmitLoading(false);
                }
            } else {
                await axios.post('http://localhost:5000/api/orders', orderPayload, config);
                setCart([]);
                localStorage.removeItem('er_cart'); 
                navigate('/profile');
            }
        } catch (error) { 
            console.error(error);
            alert(error.response?.data?.message || "Checkout failed. Please try again."); 
            setSubmitLoading(false);
        }
    };

    if (cart.length === 0) return <div className="min-h-screen pt-40 text-center text-[10px] uppercase font-bold tracking-widest">Your bag is empty.</div>;

    const tweenTransition = { type: 'tween', duration: 0.3, ease: 'easeOut' };

    return (
        <div className="min-h-screen bg-gray-50 pt-32 pb-24 font-sans">
            <div className="max-w-[1200px] mx-auto px-10 flex flex-col md:flex-row gap-10">
                
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={tweenTransition} className="w-full md:w-2/3 space-y-8">
                    <div className="bg-white p-12 shadow-sm border border-gray-200">
                        <h2 className="text-xl font-bold uppercase tracking-widest mb-10 border-b border-gray-100 pb-6">Secure Checkout</h2>
                        <form onSubmit={handleCheckout} id="checkoutSubmitForm" className="space-y-10">
                            
                            <div>
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-6">Standard Details</h3>
                                <div className="space-y-6">
                                    <input type="text" placeholder="Full Name" required value={standardForm.fullname} onChange={(e)=>setStandardForm({...standardForm, fullname: e.target.value})} className="w-full border border-gray-300 p-3 text-sm focus:border-black outline-none transition uppercase" />
                                    <input type="email" placeholder="Email Address" required value={standardForm.email} onChange={(e)=>setStandardForm({...standardForm, email: e.target.value})} className="w-full border border-gray-300 p-3 text-sm focus:border-black outline-none transition" />
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-10 mt-10">
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-6 flex justify-between items-center">
                                    <span>Shipping Details (Optional)</span>
                                    {savedAddresses.length > 0 && <span className="text-[9px] text-black font-bold uppercase tracking-widest">Saved Addresses Found ({savedAddresses.length})</span>}
                                </h3>

                                {savedAddresses.length > 0 && (
                                    <div className="space-y-4 mb-8">
                                        {savedAddresses.map(addr => (
                                            <label key={addr.id} className={`flex items-start gap-4 border p-5 cursor-pointer transition ${selectedAddressId === addr.id ? 'border-black bg-gray-50' : 'border-gray-200'}`}>
                                                <input type="radio" name="shippingAddress" value={addr.id} checked={selectedAddressId === addr.id} onChange={(e) => setSelectedAddressId(Number(e.target.value))} className="accent-black w-4 h-4 mt-1" />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1"><span className="font-bold text-sm uppercase">{addr.street}</span>{addr.isDefault && <span className="text-[9px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Default</span>}</div>
                                                    <p className="text-xs text-gray-600 uppercase">{addr.barangay}, {addr.city}, {addr.province}</p>
                                                </div>
                                            </label>
                                        ))}
                                        <label className={`flex items-start gap-4 border p-5 cursor-pointer transition ${selectedAddressId === '' ? 'border-black bg-gray-50' : 'border-gray-200'}`}>
                                            <input type="radio" name="shippingAddress" value="" checked={selectedAddressId === ''} onChange={(e) => setSelectedAddressId('')} className="accent-black w-4 h-4 mt-1" />
                                            <span className="text-sm font-bold uppercase tracking-widest">Use a different manual address</span>
                                        </label>
                                    </div>
                                )}

                                {selectedAddressId === '' && (
                                    <div className="space-y-6 animate-fade-in">
                                        <div className="grid grid-cols-2 gap-4">
                                            {/* REMOVED ALL REQUIRED ATTRIBUTES BELOW */}
                                            <input type="text" placeholder="Region" value={manualAddress.region} onChange={(e)=>setManualAddress({...manualAddress, region: e.target.value})} className="w-full border border-gray-300 p-3 text-sm focus:border-black outline-none transition uppercase" />
                                            <input type="text" placeholder="Province" value={manualAddress.province} onChange={(e)=>setManualAddress({...manualAddress, province: e.target.value})} className="w-full border border-gray-300 p-3 text-sm focus:border-black outline-none transition uppercase" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <input type="text" placeholder="City" value={manualAddress.city} onChange={(e)=>setManualAddress({...manualAddress, city: e.target.value})} className="w-full border border-gray-300 p-3 text-sm focus:border-black outline-none transition uppercase" />
                                            <input type="text" placeholder="Barangay" value={manualAddress.barangay} onChange={(e)=>setManualAddress({...manualAddress, barangay: e.target.value})} className="w-full border border-gray-300 p-3 text-sm focus:border-black outline-none transition uppercase" />
                                        </div>
                                        <input type="text" placeholder="Street / Bldg / Unit" value={manualAddress.street} onChange={(e)=>setManualAddress({...manualAddress, street: e.target.value})} className="w-full border border-gray-300 p-3 text-sm focus:border-black outline-none transition uppercase" />
                                        <input type="text" placeholder="Zip Code" maxLength="4" value={manualAddress.zip} onChange={(e)=>setManualAddress({...manualAddress, zip: e.target.value})} className="w-full border border-gray-300 p-3 text-sm focus:border-black outline-none transition" />
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-gray-100 pt-10 mt-10">
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-6">Payment Method</h3>
                                <div className="space-y-4">
                                    <label className={`flex items-start gap-4 border p-5 cursor-pointer transition ${selectedPaymentMethod === 'COD' ? 'border-black bg-gray-50' : 'border-gray-200'}`}>
                                        <input type="radio" name="paymentType" value="COD" checked={selectedPaymentMethod === 'COD'} onChange={(e) => setSelectedPaymentMethod(e.target.value)} className="accent-black w-4 h-4 mt-1" />
                                        <span className="text-sm font-bold uppercase tracking-widest flex-1">Cash on Delivery</span>
                                    </label>
                                    <label className={`flex items-start gap-4 border p-5 cursor-pointer transition ${selectedPaymentMethod === 'GCash' ? 'border-black bg-gray-50' : 'border-gray-200'}`}>
                                        <input type="radio" name="paymentType" value="GCash" checked={selectedPaymentMethod === 'GCash'} onChange={(e) => setSelectedPaymentMethod(e.target.value)} className="accent-black w-4 h-4 mt-1" />
                                        <span className="text-sm font-bold uppercase tracking-widest flex-1">GCash (via PayMongo)</span>
                                    </label>
                                </div>
                            </div>
                        </form>
                    </div>
                </motion.div>
                
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1, ...tweenTransition }} className="w-full md:w-1/3">
                    <div className="bg-white p-8 shadow-sm border border-gray-200 top-32 sticky">
                        <h2 className="text-sm font-bold uppercase tracking-widest mb-6 border-b border-gray-100 pb-4">Order Summary</h2>
                        <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2 scrollbar-hide">
                            {cart.map((item, i) => (
                                <div key={i} className="flex gap-3 justify-between text-xs">
                                    <span className="uppercase tracking-widest text-gray-500 flex-1 truncate">{item.name} x{item.quantity}</span>
                                    <span className="font-bold text-black shrink-0">₱{(item.price * item.quantity).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-gray-100 pt-4 flex justify-between items-center text-sm font-bold uppercase tracking-widest">
                            <span>Total</span>
                            <span className="text-lg">₱{cartTotal.toLocaleString()}</span>
                        </div>
                        <div className="border-t border-gray-100 pt-4 mt-6 flex flex-col items-center">
                            <div className="my-6 scale-90 origin-center"><ReCAPTCHA ref={recaptchaRef} sitekey="6Lf1f4MsAAAAAK4jpuGx7cgxXnZeXJK8L6O5h6X-" /></div>
                            <button type="submit" disabled={submitLoading} form="checkoutSubmitForm" className="w-full bg-black text-white py-5 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition shadow-sm cursor-pointer disabled:bg-gray-400">
                                {submitLoading ? 'Processing...' : 'Place Order'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}