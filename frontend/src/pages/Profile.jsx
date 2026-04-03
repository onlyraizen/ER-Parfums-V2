import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReviewModal from '../components/ReviewModal';

// Icons
const UserIcon = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>);
const ClipboardIcon = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 15.75h3.75M18 19.5a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18H8.857c-1.036 0-1.897-.838-1.976-1.87A49.124 49.124 0 016 14.25v-8.5C6 4.615 6.861 3.777 7.897 3.682a48.6 48.6 0 011.123-.08m7.5 0v-.6a2.25 2.25 0 00-2.25-2.25h-4.5a2.25 2.25 0 00-2.25 2.25v.6m7.5 0a2.25 2.25 0 012.25 2.25v.6m-7.5-.6a2.25 2.25 0 00-2.25 2.25v.6m7.5 0H9" /></svg>);
const PencilIcon = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>);
const CloseIcon = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);
const PlusIcon = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 inline-block mr-1 -mt-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>);

export default function Profile() {
    const navigate = useNavigate();
    const location = useLocation();
    const token = localStorage.getItem('token');
    
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    
    const [activeTab, setActiveTab] = useState('Profile');
    const [activeOrderTab, setActiveOrderTab] = useState('ALL');
    
    const [formData, setFormData] = useState({ username: '', fullname: '', newPassword: '' });
    const fileInputRef = useRef(null);

    const [savedAddresses, setSavedAddresses] = useState([]);
    const [isAddressModalOpen, setAddressModalOpen] = useState(false);
    const [addressForm, setAddressForm] = useState({ street: '', barangay: '', city: '', region: '', province: '', zip: '', isDefault: false });
    
    const [reviewingProduct, setReviewingProduct] = useState(null); 

    // --- NEW: RETURN REQUEST STATE ---
    const [returnModal, setReturnModal] = useState({ isOpen: false, orderNumber: '' });
    const [returnForm, setReturnForm] = useState({ reason: '', details: '' });

    useEffect(() => {
        if (!token) { navigate('/'); return; }
        fetchProfileData();
        fetchAddresses();

        const searchParams = new URLSearchParams(location.search);
        const urlTab = searchParams.get('tab');
        if (urlTab) {
            setActiveTab(urlTab);
        }
    }, [token, navigate, location]);

    const fetchProfileData = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const userRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/me`, config);
            setUser(userRes.data.data);
            setFormData({ username: userRes.data.data.username || '', fullname: userRes.data.data.fullname, newPassword: '' });
            const orderRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/orders/my-orders`, config);
            setOrders(orderRes.data.data);
        } catch (error) { navigate('/'); }
    };

    const fetchAddresses = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/addresses`, config);
            setSavedAddresses(res.data.data);
        } catch (error) { console.error("Could not fetch addresses."); }
    };

    const handleProfileUpdate = async (e) => { 
        e.preventDefault(); 
        try { 
            const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/users/profile`, formData, { headers: { Authorization: `Bearer ${token}` } }); 
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
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/avatar`, fd, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }); 
            setUser(prev => ({ ...prev, avatar: res.data.avatarUrl })); 
        } catch (error) { alert("Upload failed: " + error.response?.data?.message); } 
    };

    const handleAddAddress = async (e) => { 
        e.preventDefault(); 
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/users/addresses`, addressForm, { headers: { Authorization: `Bearer ${token}` } });
            alert("Address securely saved."); 
            setAddressModalOpen(false); 
            setAddressForm({ street: '', barangay: '', city: '', region: '', province: '', zip: '', isDefault: false }); 
            fetchAddresses(); 
        } catch (error) { alert("Failed to save address."); }
    };

    const handleDeleteAddress = async (id) => {
        if(!window.confirm("Are you sure you want to remove this address?")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/users/addresses/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            fetchAddresses();
        } catch (error) { alert("Failed to delete address."); }
    };

    const handleReviewSuccess = () => {
        setReviewingProduct(null); 
        fetchProfileData(); 
    };

    // --- NEW: RETURN REQUEST LOGIC ---
    const handleRequestReturn = (orderNumber) => {
        setReturnModal({ isOpen: true, orderNumber });
    };

    const handleSubmitReturn = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/orders/${returnModal.orderNumber}/return`, returnForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(`Return request for Order ${returnModal.orderNumber} submitted successfully. Please check your email for the next steps regarding the unboxing video.`);
            setReturnModal({ isOpen: false, orderNumber: '' });
            setReturnForm({ reason: '', details: '' });
            fetchProfileData(); // Instantly update the UI to show the order moved to Return/Refund tab
        } catch (error) {
            alert(error.response?.data?.message || "Failed to submit return request.");
        }
    };

    if (!user) return <div className="min-h-screen flex items-center justify-center text-[10px] uppercase font-bold tracking-widest">Loading...</div>;

    const orderTabs = ['ALL', 'PENDING', 'TO SHIP', 'TO RECEIVE', 'COMPLETED', 'CANCELLED', 'RETURN/REFUND'];
    const filteredOrders = orders.filter(o => {
        if (activeOrderTab === 'ALL') return true;
        if (activeOrderTab === 'TO SHIP') return o.status === 'Processing';
        if (activeOrderTab === 'TO RECEIVE') return o.status === 'Shipped';
        return o.status.toUpperCase() === activeOrderTab;
    });

    const fastTransition = { type: 'tween', duration: 0.25, ease: "easeOut" };

    return (
        <div className="min-h-screen bg-gray-50 pt-32 pb-20 font-sans relative">
            
            {reviewingProduct && (
                <ReviewModal 
                    productId={reviewingProduct.id} 
                    productName={reviewingProduct.name} 
                    onClose={() => setReviewingProduct(null)} 
                    onSuccess={handleReviewSuccess}
                />
            )}

            <div className="max-w-[1200px] mx-auto px-10 flex flex-col md:flex-row gap-10 relative">
                
                {/* --- SIDEBAR UI --- */}
                <div className="w-full md:w-64 shrink-0 pr-6 md:border-r md:border-gray-200">
                    <div className="flex items-center gap-4 mb-10 p-4 border border-gray-100 bg-white md:border-none md:bg-transparent md:p-0">
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
                    
                    <nav className="flex flex-row md:flex-col gap-4 md:gap-0 md:space-y-6 overflow-x-auto pb-4 md:pb-0 md:overflow-visible scrollbar-hide text-sm">
                        <div className="flex-none md:flex-initial">
                            <div className="flex items-center gap-3 font-bold text-black mb-4 hidden md:flex"><UserIcon/> My Account</div>
                            <div className="flex flex-row md:flex-col md:ml-8 gap-4 md:gap-0 md:space-y-3 text-gray-500 whitespace-nowrap">
                                <button onClick={()=>setActiveTab('Profile')} className={`text-left transition ${activeTab==='Profile'?'text-black font-bold':''}`}>Profile</button>
                                <button onClick={()=>setActiveTab('Addresses')} className={`text-left transition ${activeTab==='Addresses'?'text-black font-bold':''}`}>Addresses</button>
                            </div>
                        </div>
                        <button onClick={()=>setActiveTab('My Purchase')} className={`flex flex-none md:flex-initial items-center gap-3 font-bold transition w-auto md:w-full text-left whitespace-nowrap ${activeTab==='My Purchase'?'text-black':'text-gray-500 hover:text-black'}`}>
                            <ClipboardIcon/> My Purchase
                        </button>
                    </nav>
                </div>

                {/* --- MAIN CONTENT --- */}
                <div className="flex-1 bg-white shadow-sm border border-gray-200 p-8 md:p-10 min-h-[600px]">
                    
                    {/* PROFILE TAB */}
                    {activeTab === 'Profile' && (
                        <div className="animate-fade-in space-y-8">
                            <div className="border-b border-gray-100 pb-6 mb-8"><h2 className="text-xl font-bold">My Profile</h2><p className="text-xs text-gray-500 mt-1">Manage and protect your account</p></div>
                            
                            <div className="flex flex-col lg:flex-row gap-12">
                                <form onSubmit={handleProfileUpdate} className="flex-1 space-y-8">
                                    <div className="flex flex-col md:flex-row md:items-center">
                                        <label className="md:w-1/4 text-left md:text-right pr-6 text-sm text-gray-500 mb-2 md:mb-0">Username</label>
                                        <div className="md:w-3/4">
                                            <input type="text" value={formData.username} onChange={(e)=>setFormData({...formData, username: e.target.value})} disabled={user.isUsernameSet} className={`w-full border border-gray-300 p-2.5 text-sm outline-none focus:border-black transition ${user.isUsernameSet?'bg-gray-50 text-gray-400':''}`} />
                                            <p className="text-[10px] text-gray-400 mt-2">Username can only be changed once.</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col md:flex-row md:items-center">
                                        <label className="md:w-1/4 text-left md:text-right pr-6 text-sm text-gray-500 mb-2 md:mb-0">Name</label>
                                        <div className="md:w-3/4">
                                            <input type="text" value={formData.fullname} onChange={(e)=>setFormData({...formData, fullname: e.target.value})} required className="w-full border border-gray-300 p-2.5 text-sm outline-none focus:border-black transition" />
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col md:flex-row md:items-center">
                                        <label className="md:w-1/4 text-left md:text-right pr-6 text-sm text-gray-500 mb-1 md:mb-0">Email</label>
                                        <div className="md:w-3/4 text-sm font-bold text-gray-500">{user.email}</div>
                                    </div>
                                    
                                    <div className="flex flex-col md:flex-row md:items-center">
                                        <label className="md:w-1/4 text-left md:text-right pr-6 text-sm text-gray-500 mb-1 md:mb-0">Phone</label>
                                        <div className="md:w-3/4 text-sm text-gray-500">{user.phone || 'Updated during checkout'}</div>
                                    </div>
                                    
                                    <div className="flex flex-col md:flex-row md:items-center">
                                        <label className="md:w-1/4 text-left md:text-right pr-6 text-sm text-gray-500 mb-2 md:mb-0">New Password</label>
                                        <div className="md:w-3/4">
                                            <input type="password" value={formData.newPassword} onChange={(e)=>setFormData({...formData, newPassword: e.target.value})} placeholder="Leave blank to keep current password" className="w-full border border-gray-300 p-2.5 text-sm placeholder:text-gray-400 outline-none focus:border-black transition" />
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col md:flex-row md:items-center">
                                        <div className="md:w-1/4"></div>
                                        <div className="md:w-3/4"><button type="submit" className="bg-black text-white px-10 py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition shadow-sm cursor-pointer w-full md:w-auto">SAVE</button></div>
                                    </div>
                                </form>

                                <div className="w-full lg:w-1/3 flex flex-col items-center justify-center lg:border-l lg:border-gray-100 lg:pl-12 py-10 border-t border-gray-100 lg:border-t-0 mt-8 lg:mt-0">
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
                            <div className="flex justify-between items-center border-b border-gray-100 pb-6 mb-8 gap-4">
                                <h2 className="text-xl font-bold text-black mb-1">My Addresses</h2>
                                <button onClick={() => setAddressModalOpen(true)} className="bg-black text-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition shadow-md cursor-pointer whitespace-nowrap">
                                    <PlusIcon /> Add New
                                </button>
                            </div>
                            {savedAddresses.length === 0 ? (
                                <div className="text-center py-20 text-gray-400 uppercase tracking-widest text-[10px]">NO ADDRESSES SAVED.</div>
                            ) : (
                                <div className="space-y-6">
                                    {savedAddresses.map(addr => (
                                        <div key={addr.id} className="border border-gray-200 p-6 flex justify-between items-start gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2 flex-wrap"><span className="font-bold text-sm uppercase">{addr.street}</span>{addr.isDefault && <span className="text-[9px] bg-green-50 text-green-600 border border-green-100 px-2 py-0.5 font-bold uppercase tracking-widest rounded-full">Default</span>}</div>
                                                <p className="text-xs text-gray-600 leading-relaxed uppercase">{addr.barangay}, {addr.city}, {addr.province}</p>
                                                <p className="text-xs text-gray-600 leading-relaxed uppercase">{addr.region}, {addr.zip}</p>
                                            </div>
                                            <button onClick={() => handleDeleteAddress(addr.id)} className="text-[10px] font-bold text-gray-400 uppercase hover:text-red-600 cursor-pointer">Delete</button>
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
                                            <div className="flex justify-between border-b border-gray-100 pb-3 mb-4 gap-4">
                                                <p className="text-xs font-bold text-black uppercase">Order <span className="text-gray-500 font-normal ml-1">{order.order_number}</span></p>
                                                <span className="text-xs font-bold text-red-600 uppercase tracking-widest">{order.status}</span>
                                            </div>
                                            <div className="space-y-4">
                                                {order.items.map((item, i) => (
                                                    <div key={i} className="flex flex-col sm:flex-row justify-between text-sm mb-4 border-b border-gray-50 pb-4 sm:border-none sm:pb-0 gap-4">
                                                        <div className="flex gap-4 items-start">
                                                            <div className="w-16 h-20 bg-gray-100 rounded-sm shrink-0"><img src="https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800" className="w-full h-full object-cover grayscale"/></div>
                                                            <div><p className="font-bold uppercase tracking-widest text-[11px] leading-relaxed">{item.product.name}</p><p className="text-xs text-gray-500 mt-1">x{item.quantity}</p></div>
                                                        </div>
                                                        
                                                        <div className="flex flex-col items-start sm:items-end gap-2 shrink-0 sm:pt-0 pt-2 sm:border-t-0 border-t border-gray-50">
                                                            <p className="font-bold text-[11px] mb-1 sm:mb-2">₱{(item.price * item.quantity).toLocaleString()}</p>
                                                            
                                                            {order.status === 'Completed' && (
                                                                <button 
                                                                    onClick={() => setReviewingProduct({id: item.productId, name: item.product.name})}
                                                                    className="text-[9px] font-bold uppercase tracking-widest text-black border border-black px-4 py-1.5 hover:bg-black hover:text-white transition rounded-sm cursor-pointer whitespace-nowrap"
                                                                >
                                                                    Submit Review
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="border-t border-gray-100 mt-4 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                                                <div>
                                                    {order.status === 'Completed' && (
                                                        <button 
                                                            onClick={() => handleRequestReturn(order.order_number)}
                                                            className="text-[9px] font-bold uppercase tracking-widest text-red-600 hover:text-red-800 transition cursor-pointer"
                                                        >
                                                            Request Return/Refund
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500">Order Total: <span className="text-lg font-bold text-black ml-2">₱{order.total_amount.toLocaleString()}</span></p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                
                {/* ADDRESS MODAL */}
                {isAddressModalOpen && (
                    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="absolute inset-0 bg-black/60" onClick={() => setAddressModalOpen(false)}></motion.div>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={fastTransition} className="bg-white w-full max-w-lg relative z-10 shadow-2xl p-8 md:p-12 flex flex-col rounded-sm h-[600px] overflow-hidden">
                            <button onClick={() => setAddressModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-black cursor-pointer"><CloseIcon /></button>
                            <h2 className="text-xl font-bold uppercase tracking-widest mb-2 mt-2">New Address</h2>
                            <p className="text-xs text-gray-500 mb-8 pb-6 border-b border-gray-100">Add shipping details.</p>
                            <form onSubmit={handleAddAddress} id="addressSubmitForm" className="space-y-6 flex-1 overflow-y-auto pr-2 scrollbar-hide">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><input type="text" placeholder="Region" required value={addressForm.region} onChange={(e)=>setAddressForm({...addressForm, region: e.target.value})} className="w-full border border-gray-300 p-3 text-sm focus:border-black outline-none transition uppercase" /><input type="text" placeholder="Province" required value={addressForm.province} onChange={(e)=>setAddressForm({...addressForm, province: e.target.value})} className="w-full border border-gray-300 p-3 text-sm focus:border-black outline-none transition uppercase" /></div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><input type="text" placeholder="City" required value={addressForm.city} onChange={(e)=>setAddressForm({...addressForm, city: e.target.value})} className="w-full border border-gray-300 p-3 text-sm focus:border-black outline-none transition uppercase" /><input type="text" placeholder="Barangay" required value={addressForm.barangay} onChange={(e)=>setAddressForm({...addressForm, barangay: e.target.value})} className="w-full border border-gray-300 p-3 text-sm focus:border-black outline-none transition uppercase" /></div>
                                <input type="text" placeholder="Street / Bldg / Unit" required value={addressForm.street} onChange={(e)=>setAddressForm({...addressForm, street: e.target.value})} className="w-full border border-gray-300 p-3 text-sm focus:border-black outline-none transition uppercase" />
                                <input type="text" placeholder="Zip Code" required maxLength="4" value={addressForm.zip} onChange={(e)=>setAddressForm({...addressForm, zip: e.target.value})} className="w-full border border-gray-300 p-3 text-sm focus:border-black outline-none transition" />
                                <label className="flex items-center gap-3 cursor-pointer pt-2 group"><input type="checkbox" checked={addressForm.isDefault} onChange={(e)=>setAddressForm({...addressForm, isDefault: e.target.checked})} className="accent-black w-4 h-4 cursor-pointer" /><span className="text-xs text-gray-600 uppercase tracking-widest group-hover:text-black transition">Set as default address</span></label>
                            </form>
                            <button type="submit" form="addressSubmitForm" className="w-full bg-black text-white py-4 text-[11px] font-bold uppercase tracking-widest hover:bg-gray-800 transition cursor-pointer mt-8 shrink-0">Save Address</button>
                        </motion.div>
                    </div>
                )}

                {/* --- NEW: RETURN REQUEST MODAL --- */}
                {returnModal.isOpen && (
                    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="absolute inset-0 bg-black/60" onClick={() => setReturnModal({isOpen: false, orderNumber: ''})}></motion.div>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={fastTransition} className="bg-white w-full max-w-lg relative z-10 shadow-2xl p-8 md:p-12 flex flex-col rounded-sm overflow-hidden">
                            <button onClick={() => setReturnModal({isOpen: false, orderNumber: ''})} className="absolute top-6 right-6 text-gray-400 hover:text-black cursor-pointer"><CloseIcon /></button>
                            <h2 className="text-xl font-bold uppercase tracking-widest mb-2 mt-2">Request Return</h2>
                            <p className="text-xs text-gray-500 mb-8 pb-6 border-b border-gray-100">Order {returnModal.orderNumber}</p>
                            
                            <form onSubmit={handleSubmitReturn} className="space-y-8">
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-3">Reason for Return</label>
                                    <select required value={returnForm.reason} onChange={e => setReturnForm({...returnForm, reason: e.target.value})} className="w-full border-b border-gray-300 py-3 text-sm outline-none focus:border-black transition bg-transparent">
                                        <option value="" disabled>Select a reason...</option>
                                        <option value="Damaged/Leaking Bottle">Damaged or Leaking Bottle</option>
                                        <option value="Wrong Item Received">Wrong Item Received</option>
                                        <option value="Defective Sprayer">Defective Sprayer Mechanism</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-3">Additional Details</label>
                                    <textarea required value={returnForm.details} onChange={e => setReturnForm({...returnForm, details: e.target.value})} rows="4" placeholder="Please describe the issue. Note: An unboxing video will be required via email." className="w-full border border-gray-200 p-4 text-sm outline-none focus:border-black transition resize-none"></textarea>
                                </div>
                                <button type="submit" className="w-full bg-red-600 text-white py-4 text-[11px] font-bold uppercase tracking-widest hover:bg-red-800 transition cursor-pointer mt-4 shadow-sm">Submit Request</button>
                            </form>
                        </motion.div>
                    </div>
                )}

            </AnimatePresence>
        </div>
    );
}