import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { motion } from 'framer-motion';

export default function Cart({ cart, setCart }) {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    
    const [user, setUser] = useState(null);
    const [standardForm, setStandardForm] = useState({ fullname: '', email: '', phone: '' });
    const [submitLoading, setSubmitLoading] = useState(false);
    
    const [isSuccess, setIsSuccess] = useState(false); 
    const [orderNumber, setOrderNumber] = useState('');

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
                const userRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/me`, config);
                setUser(userRes.data.data);
                
                setStandardForm({ 
                    fullname: userRes.data.data.fullname, 
                    email: userRes.data.data.email,
                    phone: userRes.data.data.phone || ''
                });
            } catch (error) { console.error("Checkout fetch failed"); }
        };
        fetchUserDataAndData();
    }, [token]);

    const handleCheckout = async (e) => {
        e.preventDefault();
        if (!token) return alert("You must be logged in.");
        
        const recaptchaToken = recaptchaRef.current?.getValue();
        if (!recaptchaToken) return alert("Please complete the reCAPTCHA");
        
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
                const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/checkout/paymongo`, orderPayload, config);
                if (res.data && res.data.checkoutUrl) {
                    window.location.href = res.data.checkoutUrl; 
                } else {
                    alert("Failed to generate payment link. Please try again.");
                    setSubmitLoading(false);
                }
            } else {
                const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/orders`, orderPayload, config);
                
                setOrderNumber(res.data.data.order_number);
                setCart([]);
                localStorage.removeItem('er_cart'); 
                setIsSuccess(true);
            }
        } catch (error) { 
            alert(error.response?.data?.message || "Checkout failed. Please try again."); 
            setSubmitLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen pt-40 pb-24 flex flex-col items-center justify-center font-sans bg-gray-50 text-center px-10">
                <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center text-white mb-8 shadow-xl">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                </div>
                <h1 className="text-4xl font-normal tracking-[0.15em] uppercase logo-font mb-4">Order Confirmed</h1>
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Thank you for your purchase, {standardForm.fullname}.</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-10">Your Order Number is <span className="font-bold text-black">{orderNumber}</span></p>
                <Link to="/profile" className="bg-black text-white px-10 py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition cursor-pointer shadow-md">
                    View Order Status
                </Link>
            </motion.div>
        );
    }

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
                                    <input type="tel" placeholder="Mobile Number (e.g. 09123456789)" required value={standardForm.phone} onChange={(e)=>setStandardForm({...standardForm, phone: e.target.value})} className="w-full border border-gray-300 p-3 text-sm focus:border-black outline-none transition tracking-widest" />
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-10 mt-10">
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-6">Shipping Details</h3>
                                <div className="space-y-6 animate-fade-in">
                                    <div className="grid grid-cols-2 gap-4">
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
                            </div>

                            <div className="border-t border-gray-100 pt-10 mt-10">
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-6">Payment Method</h3>
                                <div className="space-y-4">
                                    <label className={`flex items-start gap-4 border p-5 cursor-pointer transition ${selectedPaymentMethod === 'COD' ? 'border-black bg-gray-50' : 'border-gray-200'}`}>
                                        <input type="radio" name="paymentType" value="COD" checked={selectedPaymentMethod === 'COD'} onChange={(e) => setSelectedPaymentMethod(e.target.value)} className="accent-black w-4 h-4 mt-1" />
                                        <span className="text-sm font-bold uppercase tracking-widest flex-1">Cash on Delivery</span>
                                    </label>
                                    
                                    {/* RENAMED FROM GCASH TO E-WALLETS/CARDS */}
                                    <label className={`flex items-start gap-4 border p-5 cursor-pointer transition ${selectedPaymentMethod === 'GCash' ? 'border-black bg-gray-50' : 'border-gray-200'}`}>
                                        <input type="radio" name="paymentType" value="GCash" checked={selectedPaymentMethod === 'GCash'} onChange={(e) => setSelectedPaymentMethod(e.target.value)} className="accent-black w-4 h-4 mt-1" />
                                        <span className="text-sm font-bold uppercase tracking-widest flex-1">E-Wallets & Cards (via PayMongo)</span>
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