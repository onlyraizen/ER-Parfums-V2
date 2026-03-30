import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Icons
const UserIcon = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>);
const ClipboardIcon = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 15.75h3.75M18 19.5a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18H8.857c-1.036 0-1.897-.838-1.976-1.87A49.124 49.124 0 016 14.25v-8.5C6 4.615 6.861 3.777 7.897 3.682a48.6 48.6 0 011.123-.08m7.5 0v-.6a2.25 2.25 0 00-2.25-2.25h-4.5a2.25 2.25 0 00-2.25 2.25v.6m7.5 0a2.25 2.25 0 012.25 2.25v.6m-7.5-.6a2.25 2.25 0 00-2.25 2.25v.6m7.5 0H9" /></svg>);
const PencilIcon = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>);
const CloseIcon = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);
const PlusIcon = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 inline-block mr-1 -mt-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>);

export default function Profile() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    
    const [activeTab, setActiveTab] = useState('Profile');
    const [activeOrderTab, setActiveOrderTab] = useState('ALL');
    
    const [formData, setFormData] = useState({ username: '', fullname: '', newPassword: '' });
    const fileInputRef = useRef(null);

    // --- SAVED DATA (PHASE 3) ---
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [savedPayments, setSavedPayments] = useState([]);
    const [isAddressModalOpen, setAddressModalOpen] = useState(false);
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [addressForm, setAddressForm] = useState({ street: '', barangay: '', city: '', region: '', province: '', zip: '', isDefault: false });
    const [paymentForm, setPaymentForm] = useState({ type: '', isDefault: false });

    // Fetch User Profile
    useEffect(() => {
        if (!token) { navigate('/'); return; }
        const fetchProfileData = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const userRes = await axios.get('http://localhost:5000/api/users/me', config);
                setUser(userRes.data.data);
                setFormData({ username: userRes.data.data.username || '', fullname: userRes.data.data.fullname, newPassword: '' });
                const orderRes = await axios.get('http://localhost:5000/api/orders/my-orders', config);
                setOrders(orderRes.data.data);
            } catch (error) { navigate('/'); }
        };
        fetchProfileData();
    }, [token, navigate]);

    // Handle standard profile updates
    const handleProfileUpdate = async (e) => { 
        e.preventDefault(); 
        try { 
            const res = await axios.put('http://localhost:5000/api/users/profile', formData, { headers: { Authorization: `Bearer ${token}` } }); 
            setUser(res.data.user); 
            setFormData(prev => ({ ...prev, newPassword: '' })); 
            alert("Profile updated successfully!"); 
        } catch (error) { alert(error.response?.data?.message || "Update failed."); } 
    };

    const handleAvatarUpload = async (e) => { 
        const file = e.target.files[0]; 
        if (!file || file.size > 1024 * 1024) return alert("Upload Failed: File exceeds 1MB limit."); 
        const fd = new FormData(); fd.append('avatar', file); 
        try { 
            const res = await axios.post('http://localhost:5000/api/users/avatar', fd, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }); 
            setUser(prev => ({ ...prev, avatar: res.data.avatarUrl })); 
        } catch (error) { alert("Upload failed: " + error.response?.data?.message); } 
    };

    // --- PHASE 3: ADDRESS LOGIC ---
    const handleAddAddress = async (e) => { 
        e.preventDefault(); 
        const newAddress = { ...addressForm, id: Date.now() }; 
        if (newAddress.isDefault) { setSavedAddresses(prev => prev.map(addr => ({ ...addr, isDefault: false }))); } 
        setSavedAddresses(prev => [...prev, newAddress]); 
        alert("Address added to your profile!"); 
        setAddressModalOpen(false); 
        setAddressForm({ street: '', barangay: '', city: '', region: '', province: '', zip: '', isDefault: false }); 
    };

    // --- PHASE 3: PAYMENT LOGIC ---
    const handleAddPayment = async (e) => { 
        e.preventDefault(); 
        if (paymentForm.type !== 'GCash') { alert("This payment method is currently disabled."); return; } 
        const newPayment = { ...paymentForm, id: Date.now() }; 
        if (newPayment.isDefault) { setSavedPayments(prev => prev.map(pay => ({ ...pay, isDefault: false }))); } 
        setSavedPayments(prev => [...prev, newPayment]); 
        alert("GCash method saved!"); 
        setPaymentModalOpen(false); 
        setPaymentForm({ type: '', isDefault: false }); 
    };

    if (!user) return <div className="min-h-screen flex items-center justify-center text-[10px] uppercase font-bold tracking-widest">Loading...</div>;

    const orderTabs = ['ALL', 'TO PAY', 'TO SHIP', 'TO RECEIVE', 'COMPLETED', 'CANCELLED', 'RETURN/REFUND'];
    const filteredOrders = orders.filter(o => {
        if (activeOrderTab === 'ALL') return true;
        if (activeOrderTab === 'TO PAY') return o.status === 'Pending';
        if (activeOrderTab === 'TO SHIP') return o.status === 'Processing';
        if (activeOrderTab === 'TO RECEIVE') return o.status === 'Shipped';
        return o.status.toUpperCase() === activeOrderTab;
    });

    const fastTransition = { type: 'tween', duration: 0.25, ease: "easeOut" };

    return (
        <div className="min-h-screen bg-gray-50 pt-32 pb-20 font-sans">
            <div className="max-w-[1200px] mx-auto px-10 flex flex-col md:flex-row gap-10">
                
                {/* --- SIDEBAR UI --- */}
                <div className="w-full md:w-64 shrink-0 pr-6 border-r border-gray-200">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-14 h-14 rounded-full bg-[#E5E7EB] flex items-center justify-center text-xl font-bold text-gray-600 overflow-hidden border border-gray-300 shadow-sm">
                            {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover"/> : <span className="font-bold text-gray-600">{user.fullname[0]}</span>}
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-gray-800">{user.username || user.fullname.split(' ')[0]}</h3>
                            <button onClick={()=>setActiveTab('Profile')} className="text-[9px] text-gray-400 uppercase tracking-widest mt-1 flex items-center gap-1 hover:text-black transition">
                                <PencilIcon/> EDIT PROFILE
                            </button>
                        </div>
                    </div>
                    
                    <nav className="space-y-6 text-sm">
                        <div>
                            <div className="flex items-center gap-3 font-bold text-black mb-4"><UserIcon/> My Account</div>
                            <div className="flex flex-col ml-8 space-y-3 text-gray-500">
                                <button onClick={()=>setActiveTab('Profile')} className={`text-left transition ${activeTab==='Profile'?'text-black font-bold':''}`}>Profile</button>
                                <button onClick={()=>setActiveTab('Addresses')} className={`text-left transition ${activeTab==='Addresses'?'text-black font-bold':''}`}>Addresses</button>
                                <button onClick={()=>setActiveTab('Payment')} className={`text-left transition ${activeTab==='Payment'?'text-black font-bold':''}`}>Payment Methods</button>
                            </div>
                        </div>
                        <button onClick={()=>setActiveTab('My Purchase')} className={`flex items-center gap-3 font-bold transition w-full text-left ${activeTab==='My Purchase'?'text-black':'text-gray-500 hover:text-black'}`}>
                            <ClipboardIcon/> My Purchase
                        </button>
                    </nav>
                </div>

                {/* --- MAIN CONTENT --- */}
                <div className="flex-1 bg-white shadow-sm border border-gray-200 p-10 min-h-[600px]">
                    
                    {/* PROFILE TAB */}
                    {activeTab === 'Profile' && (
                        <div className="animate-fade-in space-y-8">
                            <div className="border-b border-gray-100 pb-6 mb-8"><h2 className="text-xl font-bold">My Profile</h2><p className="text-xs text-gray-500 mt-1">Manage and protect your account</p></div>
                            
                            <div className="flex flex-col md:flex-row gap-12">
                                <form onSubmit={handleProfileUpdate} className="flex-1 space-y-8">
                                    <div className="flex items-center">
                                        <label className="w-1/4 text-right pr-6 text-sm text-gray-500">Username</label>
                                        <div className="w-3/4">
                                            <input type="text" value={formData.username} onChange={(e)=>setFormData({...formData, username: e.target.value})} disabled={user.isUsernameSet} className={`w-full border border-gray-300 p-2.5 text-sm outline-none focus:border-black transition ${user.isUsernameSet?'bg-gray-50 text-gray-400':''}`} />
                                            <p className="text-[10px] text-gray-400 mt-2">Username can only be changed once.</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center">
                                        <label className="w-1/4 text-right pr-6 text-sm text-gray-500">Name</label>
                                        <div className="w-3/4">
                                            <input type="text" value={formData.fullname} onChange={(e)=>setFormData({...formData, fullname: e.target.value})} required className="w-full border border-gray-300 p-2.5 text-sm outline-none focus:border-black transition" />
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center">
                                        <label className="w-1/4 text-right pr-6 text-sm text-gray-500">Email</label>
                                        <div className="w-3/4 flex gap-4 items-center">
                                            <span className="text-sm font-bold text-gray-500">{user.email}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center">
                                        <label className="w-1/4 text-right pr-6 text-sm text-gray-500">Phone</label>
                                        <div className="w-3/4 flex gap-4 items-center">
                                            <span className="text-sm text-gray-500">{user.phone || 'Updated during checkout'}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center">
                                        <label className="w-1/4 text-right pr-6 text-sm text-gray-500">New Password</label>
                                        <div className="w-3/4">
                                            <input type="password" value={formData.newPassword} onChange={(e)=>setFormData({...formData, newPassword: e.target.value})} placeholder="Leave blank to keep current password" className="w-full border border-gray-300 p-2.5 text-sm placeholder:text-gray-400 outline-none focus:border-black transition" />
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center">
                                        <div className="w-1/4"></div>
                                        <div className="w-3/4"><button type="submit" className="bg-black text-white px-10 py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition shadow-sm cursor-pointer">SAVE</button></div>
                                    </div>
                                </form>

                                <div className="w-full md:w-1/3 flex flex-col items-center justify-center border-l border-gray-100 pl-12">
                                    <div className="w-28 h-28 rounded-full bg-gray-50 flex items-center justify-center border-2 border-gray-200 mb-6 overflow-hidden">
                                        {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover"/> : <span className="text-5xl text-gray-300 font-bold">{user.fullname[0]}</span>}
                                    </div>
                                    <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/png, image/jpeg" />
                                    <button onClick={() => fileInputRef.current.click()} className="border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition mb-4 rounded-sm cursor-pointer">Select Image</button>
                                    <div className="text-center text-xs text-gray-400 space-y-1"><p>File size: maximum 1 MB</p><p>File extension: .JPEG, .PNG</p></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ADDRESSES TAB */}
                    {activeTab === 'Addresses' && (
                        <div className="animate-fade-in">
                            <div className="flex justify-between items-center border-b border-gray-100 pb-6 mb-8">
                                <h2 className="text-xl font-bold text-black mb-1">My Addresses</h2>
                                <button onClick={() => setAddressModalOpen(true)} className="bg-black text-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition shadow-md cursor-pointer">
                                    <PlusIcon /> Add New Address
                                </button>
                            </div>
                            {savedAddresses.length === 0 ? (
                                <div className="text-center py-20 text-gray-400 uppercase tracking-widest text-[10px]">NO ADDRESSES SAVED.</div>
                            ) : (
                                <div className="space-y-6">
                                    {savedAddresses.map(addr => (
                                        <div key={addr.id} className="border border-gray-200 p-6 flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2"><span className="font-bold text-sm uppercase">{addr.street}</span>{addr.isDefault && <span className="text-[9px] bg-green-50 text-green-600 border border-green-100 px-2 py-0.5 font-bold uppercase tracking-widest rounded-full">Default</span>}</div>
                                                <p className="text-xs text-gray-600 leading-relaxed uppercase">{addr.barangay}, {addr.city}, {addr.province}</p>
                                                <p className="text-xs text-gray-600 leading-relaxed uppercase">{addr.region}, {addr.zip}</p>
                                            </div>
                                            <button className="text-[10px] font-bold text-gray-400 uppercase hover:text-red-600 cursor-pointer">Delete</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* PAYMENT TAB */}
                    {activeTab === 'Payment' && (
                        <div className="animate-fade-in">
                            <div className="flex justify-between items-center border-b border-gray-100 pb-6 mb-8">
                                <h2 className="text-xl font-bold text-black mb-1">Payment Methods</h2>
                                <button onClick={() => setPaymentModalOpen(true)} className="bg-black text-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition shadow-md cursor-pointer">
                                    <PlusIcon /> Add New Method
                                </button>
                            </div>
                            {savedPayments.length === 0 ? (
                                <div className="text-center py-20 text-gray-400 uppercase tracking-widest text-[10px]">NO PAYMENT METHODS SAVED.</div>
                            ) : (
                                <div className="space-y-6">
                                    {savedPayments.map(pay => (
                                        <div key={pay.id} className="border border-gray-200 p-6 flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-10 bg-gray-50 flex items-center justify-center border border-gray-100 uppercase font-bold text-xs tracking-widest">{pay.type}</div>
                                                {pay.isDefault && <span className="text-[9px] bg-green-50 text-green-600 border border-green-100 px-2 py-0.5 font-bold uppercase tracking-widest rounded-full">Default</span>}
                                            </div>
                                            <button className="text-[10px] font-bold text-gray-400 uppercase hover:text-red-600 cursor-pointer">Delete</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* PURCHASES TAB */}
                    {activeTab === 'My Purchase' && (
                        <div className="animate-fade-in">
                            <div className="flex justify-between items-center border-b border-gray-200 mb-6 overflow-x-auto scrollbar-hide w-full px-2">
                                {orderTabs.map(tab => (
                                    <button key={tab} onClick={() => setActiveOrderTab(tab)} className={`py-4 px-4 text-xs tracking-widest whitespace-nowrap transition-colors ${activeOrderTab === tab ? 'text-black border-b-2 border-black font-bold' : 'text-gray-400 hover:text-black font-semibold'}`}>
                                        {tab}
                                    </button>
                                ))}
                            </div>
                            <div className="space-y-6">
                                {filteredOrders.length === 0 ? (
                                    <div className="h-64 bg-gray-50 flex items-center justify-center rounded-sm"><p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No Orders.</p></div>
                                ) : (
                                    filteredOrders.map(order => (
                                        <div key={order.id} className="border border-gray-200 p-6 shadow-sm rounded-sm">
                                            <div className="flex justify-between border-b border-gray-100 pb-3 mb-4">
                                                <p className="text-xs font-bold text-black uppercase">Order <span className="text-gray-500 font-normal ml-1">{order.order_number}</span></p>
                                                <span className="text-xs font-bold text-red-600 uppercase tracking-widest">{order.status}</span>
                                            </div>
                                            {order.items.map((item, i) => (
                                                <div key={i} className="flex justify-between text-sm mb-4">
                                                    <div className="flex gap-4">
                                                        <div className="w-16 h-20 bg-gray-100 rounded-sm"><img src="https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800" className="w-full h-full object-cover grayscale"/></div>
                                                        <div><p className="font-bold uppercase tracking-widest text-[11px]">{item.product.name}</p><p className="text-xs text-gray-500 mt-1">x{item.quantity}</p></div>
                                                    </div>
                                                    <p className="font-bold text-[11px]">₱{(item.price * item.quantity).toLocaleString()}</p>
                                                </div>
                                            ))}
                                            <div className="border-t border-gray-100 mt-4 pt-4 text-right"><p className="text-sm text-gray-500">Order Total: <span className="text-lg font-bold text-black ml-2">₱{order.total_amount.toLocaleString()}</span></p></div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- UPGRADED MODALS (Height fixed & Centered & Lag Free) --- */}
            <AnimatePresence>
                
                {/* NEW ADDRESS MODAL */}
                {isAddressModalOpen && (
                    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="absolute inset-0 bg-black/60" onClick={() => setAddressModalOpen(false)}></motion.div>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={fastTransition} className="bg-white w-full max-w-lg relative z-10 shadow-2xl p-12 flex flex-col rounded-sm h-[600px]">
                            <button onClick={() => setAddressModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-black cursor-pointer"><CloseIcon /></button>
                            <h2 className="text-xl font-bold uppercase tracking-widest mb-2 mt-2">New Address</h2>
                            <p className="text-xs text-gray-500 mb-8 pb-6 border-b border-gray-100">Add shipping details for faster checkout.</p>
                            <form onSubmit={handleAddAddress} className="space-y-6 flex-1 overflow-y-auto pr-2 scrollbar-hide">
                                <div className="grid grid-cols-2 gap-4"><input type="text" placeholder="Region" required value={addressForm.region} onChange={(e)=>setAddressForm({...addressForm, region: e.target.value})} className="w-full border border-gray-300 p-3 text-sm focus:border-black outline-none transition uppercase" /><input type="text" placeholder="Province" required value={addressForm.province} onChange={(e)=>setAddressForm({...addressForm, province: e.target.value})} className="w-full border border-gray-300 p-3 text-sm focus:border-black outline-none transition uppercase" /></div>
                                <div className="grid grid-cols-2 gap-4"><input type="text" placeholder="City" required value={addressForm.city} onChange={(e)=>setAddressForm({...addressForm, city: e.target.value})} className="w-full border border-gray-300 p-3 text-sm focus:border-black outline-none transition uppercase" /><input type="text" placeholder="Barangay" required value={addressForm.barangay} onChange={(e)=>setAddressForm({...addressForm, barangay: e.target.value})} className="w-full border border-gray-300 p-3 text-sm focus:border-black outline-none transition uppercase" /></div>
                                <input type="text" placeholder="Street / Bldg / Unit" required value={addressForm.street} onChange={(e)=>setAddressForm({...addressForm, street: e.target.value})} className="w-full border border-gray-300 p-3 text-sm focus:border-black outline-none transition uppercase" />
                                <input type="text" placeholder="Zip Code" required maxLength="4" value={addressForm.zip} onChange={(e)=>setAddressForm({...addressForm, zip: e.target.value})} className="w-full border border-gray-300 p-3 text-sm focus:border-black outline-none transition" />
                                <label className="flex items-center gap-3 cursor-pointer pt-2 group"><input type="checkbox" checked={addressForm.isDefault} onChange={(e)=>setAddressForm({...addressForm, isDefault: e.target.checked})} className="accent-black w-4 h-4 cursor-pointer" /><span className="text-xs text-gray-600 uppercase tracking-widest group-hover:text-black transition">Set as default shipping address</span></label>
                            </form>
                            <button type="submit" form="addressSubmitForm" className="w-full bg-black text-white py-4 text-[11px] font-bold uppercase tracking-widest hover:bg-gray-800 transition cursor-pointer mt-8">Save Address</button>
                            <form id="addressSubmitForm" onSubmit={handleAddAddress}></form>
                        </motion.div>
                    </div>
                )}

                {/* NEW PAYMENT MODAL */}
                {isPaymentModalOpen && (
                    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="absolute inset-0 bg-black/60" onClick={() => setPaymentModalOpen(false)}></motion.div>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={fastTransition} className="bg-white w-full max-w-lg relative z-10 shadow-2xl p-12 flex flex-col rounded-sm h-[600px]">
                            <button onClick={() => setPaymentModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-black cursor-pointer"><CloseIcon /></button>
                            <h2 className="text-xl font-bold uppercase tracking-widest mb-2 mt-2">Add Payment</h2>
                            <p className="text-xs text-gray-500 mb-8 pb-6 border-b border-gray-100">Select a payment type to save.</p>
                            <form onSubmit={handleAddPayment} className="flex-1 space-y-4">
                                <label className="flex items-center gap-4 border border-gray-200 p-5 cursor-pointer hover:border-black transition">
                                    <input type="radio" name="paymentType" value="GCash" required onChange={(e)=>setPaymentForm({...paymentForm, type: e.target.value})} className="accent-black w-4 h-4" />
                                    <span className="text-sm font-bold uppercase tracking-widest flex-1">GCash</span>
                                    <span className="text-[10px] text-green-600 font-bold uppercase tracking-widest">Active</span>
                                </label>
                                <label className="flex items-center gap-4 border border-gray-100 p-5 opacity-40 cursor-not-allowed">
                                    <input type="radio" name="paymentType" value="Card" disabled className="accent-black w-4 h-4 cursor-not-allowed" />
                                    <span className="text-sm font-bold uppercase tracking-widest flex-1 text-gray-400">Credit / Debit Card</span>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Disabled</span>
                                </label>
                                <label className="flex items-center gap-4 border border-gray-100 p-5 opacity-40 cursor-not-allowed">
                                    <input type="radio" name="paymentType" value="Mastercard" disabled className="accent-black w-4 h-4 cursor-not-allowed" />
                                    <span className="text-sm font-bold uppercase tracking-widest flex-1 text-gray-400">Mastercard</span>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Disabled</span>
                                </label>
                                <div className="pt-6 border-t border-gray-100 mt-6">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input type="checkbox" checked={paymentForm.isDefault} onChange={(e)=>setPaymentForm({...paymentForm, isDefault: e.target.checked})} className="accent-black w-4 h-4 cursor-pointer" />
                                        <span className="text-xs text-gray-600 uppercase tracking-widest group-hover:text-black transition">Set as default payment method</span>
                                    </label>
                                </div>
                            </form>
                            <button type="submit" form="paymentSubmitForm" className="w-full bg-black text-white py-4 text-[11px] font-bold uppercase tracking-widest hover:bg-gray-800 transition cursor-pointer mt-8 shadow-md">Save Payment Method</button>
                            <form id="paymentSubmitForm" onSubmit={handleAddPayment}></form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}