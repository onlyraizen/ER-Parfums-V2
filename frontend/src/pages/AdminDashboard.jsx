import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
// FIXED: Pointing to the actual supabase.js file in your api folder
import { supabase } from '../api/supabase'; 

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const SearchIconSmall = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 inline-block mr-2 -mt-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>);
const TrashIcon = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>);
const EditIcon = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>);

const blankProduct = { 
    name: '', category: '', description: '', details: '', 
    price: '', price30ml: '', price3ml: '', 
    stock100ml: '', stock30ml: '', stock3ml: '', 
    images: '', cover_image_url: '', topNotes: '', heartNotes: '', baseNotes: '', scentFamily: '' 
};

export default function AdminDashboard() {
    const [orders, setOrders] = useState([]);
    const [analytics, setAnalytics] = useState([]);
    const [revenueData, setRevenueData] = useState({});
    const [products, setProducts] = useState([]); 
    const [activeTab, setActiveTab] = useState('inventory'); 
    const navigate = useNavigate();

    const [newProduct, setNewProduct] = useState(blankProduct);
    const [editingProduct, setEditingProduct] = useState(null);
    
    // Supabase Upload States
    const [isUploading, setIsUploading] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [editFile, setEditFile] = useState(null);

    const [inventorySearch, setInventorySearch] = useState('');
    const [returnsSearch, setReturnsSearch] = useState('');
    const [fulfillmentSearch, setFulfillmentSearch] = useState('');

    const token = localStorage.getItem('token');

    const fetchData = async () => {
        if (!token) return navigate('/');
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const orderRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/orders`, config);
            setOrders(orderRes.data.data);
            
            const analyticsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/analytics/predict`, config);
            setAnalytics(analyticsRes.data.data);

            const revRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/analytics/revenue`, config);
            setRevenueData(revRes.data.data);
            
            const productRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/products`);
            setProducts(productRes.data.data);
        } catch (error) {
            console.error('Error fetching admin data:', error); 
            localStorage.removeItem('token'); 
            navigate('/');
        }
    };

    useEffect(() => { fetchData(); }, [navigate]);

    const handleStatusChange = async (orderId, newStatus) => {
        try { 
            await axios.put(`${import.meta.env.VITE_API_URL}/api/orders/${orderId}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } }); 
            fetchData(); 
        } catch (error) { alert('Failed: ' + error.message); }
    };
    
    const handleProductChange = (e) => setNewProduct({ ...newProduct, [e.target.name]: e.target.value });
    const handleEditProductChange = (e) => setEditingProduct({ ...editingProduct, [e.target.name]: e.target.value });
    
    const uploadToSupabase = async (file) => {
        const fileName = `perfume_${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage.from('product-images').upload(fileName, file);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
        return urlData.publicUrl;
    };

    const formatProductPayload = (productData, finalCoverUrl = null) => {
        return {
            ...productData,
            cover_image_url: finalCoverUrl || productData.cover_image_url,
            price: productData.price ? parseFloat(productData.price) : null,
            price30ml: productData.price30ml ? parseFloat(productData.price30ml) : null,
            price3ml: productData.price3ml ? parseFloat(productData.price3ml) : null,
            stock100ml: parseInt(productData.stock100ml || 0, 10),
            stock30ml: parseInt(productData.stock30ml || 0, 10),
            stock3ml: parseInt(productData.stock3ml || 0, 10),
            images: typeof productData.images === 'string' 
                ? productData.images.split(',').map(url => url.trim()).filter(url => url !== '') 
                : productData.images
        };
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        setIsUploading(true);
        try { 
            let finalCoverUrl = newProduct.cover_image_url;
            if (uploadFile) {
                finalCoverUrl = await uploadToSupabase(uploadFile);
            }

            await axios.post(`${import.meta.env.VITE_API_URL}/api/products`, formatProductPayload(newProduct, finalCoverUrl), { headers: { Authorization: `Bearer ${token}` } }); 
            alert(`${newProduct.name} added!`); 
            setNewProduct(blankProduct); 
            setUploadFile(null);
            fetchData(); 
        } catch (error) { 
            alert('Failed to add: ' + (error.response?.data?.message || error.message)); 
        } finally {
            setIsUploading(false);
        }
    };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        setIsUploading(true);
        try {
            let finalCoverUrl = editingProduct.cover_image_url;
            if (editFile) {
                finalCoverUrl = await uploadToSupabase(editFile);
            }

            await axios.put(`${import.meta.env.VITE_API_URL}/api/products/${editingProduct.id}`, formatProductPayload(editingProduct, finalCoverUrl), { headers: { Authorization: `Bearer ${token}` } });
            alert(`${editingProduct.name} updated successfully!`);
            setEditingProduct(null); 
            setEditFile(null);
            fetchData(); 
        } catch (error) { 
            alert('Failed to update: ' + (error.response?.data?.message || error.message)); 
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteProduct = async (productId) => {
        if(!window.confirm("Are you sure you want to remove this product from the catalog?")) return;
        try { 
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/products/${productId}`, { headers: { Authorization: `Bearer ${token}` } }); 
            alert("Product removed successfully."); 
            fetchData(); 
        } catch (error) { alert('Failed to delete: ' + (error.response?.data?.message || error.message)); }
    };
    
    const handleLogout = () => { 
        localStorage.removeItem('token'); 
        localStorage.removeItem('user'); 
        localStorage.removeItem('er_cart'); 
        navigate('/'); 
        window.location.reload(); 
    };

    const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;
    
    const getStatusColor = (status) => { 
        if (status === 'Pending') return '#fdd835'; 
        if (status === 'Processing') return '#2196F3'; 
        if (status === 'Shipped') return '#9C27B0'; 
        if (status === 'Completed' || status === 'Delivered') return '#4CAF50'; 
        if (status === 'Cancelled') return '#f44336'; 
        if (status === 'Return/Refund') return '#ff9800'; 
        return '#fff'; 
    };

    const barChartData = {
        labels: Object.keys(revenueData),
        datasets: [{ label: 'Monthly Revenue (₱)', data: Object.values(revenueData), backgroundColor: '#000000', borderRadius: 4 }]
    };

    const categorySales = { Women: 0, Men: 0, Unisex: 0 };
    orders.forEach(o => o.items.forEach(i => {
        const cat = i.product?.category;
        if (categorySales[cat] !== undefined) categorySales[cat] += (i.quantity * i.price);
    }));

    const doughnutData = {
        labels: ['Women', 'Men', 'Unisex'],
        datasets: [{ data: [categorySales.Women, categorySales.Men, categorySales.Unisex], backgroundColor: ['#000000', '#6B7280', '#D1D5DB'], borderWidth: 0 }]
    };
    
    const filteredInventory = products.filter(p => p.name.toLowerCase().includes(inventorySearch.toLowerCase()));
    const returnsOrders = orders.filter(o => ['Cancelled', 'Return/Refund'].includes(o.status));
    const filteredReturns = returnsOrders.filter(o => (o.order_number || '').toLowerCase().includes(returnsSearch.toLowerCase()) || (o.user?.fullname || '').toLowerCase().includes(returnsSearch.toLowerCase()));
    const filteredFulfillment = orders.filter(o => (o.order_number || '').toLowerCase().includes(fulfillmentSearch.toLowerCase()) || (o.user?.fullname || '').toLowerCase().includes(fulfillmentSearch.toLowerCase()));

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans text-black relative">
            <div className="w-72 bg-black text-white p-10 fixed h-full shadow-2xl z-40">
                <Link to="/" className="flex justify-center mb-16 hover:opacity-80 transition-opacity">
                    <img src="/logo.png" alt="ER Parfums Logo" className="h-16 w-auto invert" />
                </Link>

                <nav className="space-y-8 text-[10px] uppercase tracking-[0.3em] font-bold flex flex-col items-start">
                    <button onClick={() => setActiveTab('inventory')} className={`transition pb-1 text-left ${activeTab === 'inventory' ? 'text-white border-b border-white' : 'text-gray-500 hover:text-white border-b border-transparent'}`}>Inventory Catalog</button>
                    <button onClick={() => setActiveTab('fulfillment')} className={`transition flex justify-between items-center w-full text-left ${activeTab === 'fulfillment' ? 'text-white' : 'text-gray-500 hover:text-white'}`}>
                        <span className={`${activeTab === 'fulfillment' ? 'border-b border-white pb-1' : ''}`}>Order Fulfillment</span>
                        {pendingOrders > 0 && <span className="bg-red-600 text-white px-2 py-0.5 rounded-full text-[8px] ml-2">{pendingOrders}</span>}
                    </button>
                    <button onClick={() => setActiveTab('returns')} className={`transition pb-1 text-left ${activeTab === 'returns' ? 'text-white border-b border-white' : 'text-gray-500 hover:text-white border-b border-transparent'}`}>Returns & Refunds</button>
                    <button onClick={() => setActiveTab('analytics')} className={`transition pb-1 text-left ${activeTab === 'analytics' ? 'text-white border-b border-white' : 'text-gray-500 hover:text-white border-b border-transparent'}`}>Analytics Overview</button>
                    
                    <div className="pt-12 border-t border-gray-800 space-y-6 w-full flex flex-col items-start">
                        <Link to="/" className="text-gray-500 hover:text-white transition">Return to Store</Link>
                        <button onClick={handleLogout} className="text-red-500 hover:text-red-400 transition">System Logout</button>
                    </div>
                </nav>
            </div>

            <main className="flex-1 ml-72 p-16">
                {activeTab === 'analytics' && (
                    <div>
                        <header className="mb-12"><h2 className="text-[10px] uppercase tracking-[0.5em] text-gray-400 font-bold mb-3">Management Information System</h2><h1 className="text-4xl font-bold tracking-tight text-black uppercase italic">Analytics & Forecasting</h1></header>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                            <div className="bg-white p-8 border border-gray-200 shadow-sm flex flex-col justify-center items-center text-center"><p className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2">Total Revenue</p><h2 className="text-4xl font-bold tracking-tighter">₱{totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</h2></div>
                            <div className="bg-white p-8 border border-gray-200 shadow-sm flex flex-col justify-center items-center text-center"><p className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2">Total Orders</p><h2 className="text-4xl font-bold tracking-tighter">{orders.length}</h2></div>
                            <div className="bg-black p-8 border border-black shadow-sm flex flex-col justify-center items-center text-center text-white cursor-pointer hover:bg-gray-900 transition-colors" onClick={() => setActiveTab('fulfillment')}><p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2 z-10">Active Queue</p><h2 className="text-5xl font-bold tracking-tighter z-10">{pendingOrders}</h2></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                            <div className="bg-white border border-gray-200 shadow-sm p-10 md:col-span-2">
                                <h3 className="text-[11px] font-bold uppercase tracking-widest mb-8 border-b border-gray-100 pb-4">Revenue Growth</h3>
                                <div className="h-64 w-full"><Bar data={barChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} /></div>
                            </div>
                            <div className="bg-white border border-gray-200 shadow-sm p-10">
                                <h3 className="text-[11px] font-bold uppercase tracking-widest mb-8 border-b border-gray-100 pb-4">Sales by Category</h3>
                                <div className="h-64 w-full flex justify-center"><Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false }} /></div>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 shadow-sm p-10">
                            <h3 className="text-[11px] font-bold uppercase tracking-widest mb-8 border-b border-gray-100 pb-4">📈 AI Predictive Analytics: Stock Depletion</h3>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-[9px] uppercase tracking-widest text-gray-500">
                                        <th className="p-5 border-b border-gray-200">Product</th><th className="p-5 border-b border-gray-200">Current Stock (100ml)</th><th className="p-5 border-b border-gray-200">Daily Sales Velocity</th><th className="p-5 border-b border-gray-200">Predicted Depletion</th><th className="p-5 text-right border-b border-gray-200">Action Required</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs">
                                    {analytics.map(item => (
                                        <tr key={`analytics-${item.id}`} className="border-b border-gray-100">
                                            <td className="p-5 font-bold uppercase tracking-widest">{item.name}</td>
                                            <td className="p-5">{item.currentStock} Units</td>
                                            <td className="p-5">{item.dailyVelocity} units/day</td>
                                            <td className="p-5 font-bold">{item.predictedDaysLeft}</td>
                                            <td className="p-5 text-right"><span className="px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest" style={{ backgroundColor: item.statusColor + '15', color: item.statusColor }}>{item.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'inventory' && (
                    <div>
                        <header className="mb-12"><h2 className="text-[10px] uppercase tracking-[0.5em] text-gray-400 font-bold mb-3">Supply Chain Control</h2><h1 className="text-4xl font-bold tracking-tight text-black uppercase italic">Inventory Catalog</h1></header>
                        
                        <div className="bg-white border border-gray-200 shadow-sm p-10 mb-12">
                            <h3 className="text-[11px] font-bold uppercase tracking-widest mb-8 border-b border-gray-100 pb-4">Add New Fragrance</h3>
                            <form onSubmit={handleAddProduct} className="space-y-6">
                                <div className="grid grid-cols-2 gap-8">
                                    <div><label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Product Name</label><input type="text" name="name" value={newProduct.name} onChange={handleProductChange} required className="w-full border-b border-gray-300 py-3 outline-none text-sm focus:border-black transition" /></div>
                                    <div><label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Category</label><select name="category" value={newProduct.category} onChange={handleProductChange} required className="w-full border-b border-gray-300 py-3 outline-none text-sm focus:border-black transition bg-transparent"><option value="" disabled>Select Category...</option><option value="Women">Women</option><option value="Men">Men</option><option value="Unisex">Unisex</option></select></div>
                                </div>
                                
                                <div><label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Short Summary (Product Page Hero)</label><textarea name="description" value={newProduct.description} onChange={handleProductChange} required rows="2" className="w-full border-b border-gray-300 py-3 outline-none text-sm focus:border-black transition resize-none"></textarea></div>
                                <div><label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Detailed Formatting (Shopee Style Bullet Points)</label><textarea name="details" value={newProduct.details} onChange={handleProductChange} rows="4" placeholder="Type • or - for bullets, use Enter for new lines..." className="w-full border border-gray-200 p-4 outline-none text-sm focus:border-black transition resize-none"></textarea></div>

                                <div className="grid grid-cols-4 gap-4 border border-gray-100 p-6 bg-gray-50">
                                    <div><label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Price (100ML)</label><input type="number" name="price" value={newProduct.price} onChange={handleProductChange} min="0" step="0.01" className="w-full border-b border-gray-300 py-2 outline-none text-sm bg-transparent focus:border-black transition" /></div>
                                    <div><label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Price (30ML)</label><input type="number" name="price30ml" value={newProduct.price30ml} onChange={handleProductChange} min="0" step="0.01" className="w-full border-b border-gray-300 py-2 outline-none text-sm bg-transparent focus:border-black transition placeholder:text-gray-300" placeholder="Leave blank to disable" /></div>
                                    <div><label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Price (3ML)</label><input type="number" name="price3ml" value={newProduct.price3ml} onChange={handleProductChange} min="0" step="0.01" className="w-full border-b border-gray-300 py-2 outline-none text-sm bg-transparent focus:border-black transition placeholder:text-gray-300" placeholder="Leave blank to disable" /></div>
                                    <div></div>
                                    
                                    <div><label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Stock (100ML)</label><input type="number" name="stock100ml" value={newProduct.stock100ml} onChange={handleProductChange} min="0" className="w-full border-b border-gray-300 py-2 outline-none text-sm bg-transparent focus:border-black transition" /></div>
                                    <div><label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Stock (30ML)</label><input type="number" name="stock30ml" value={newProduct.stock30ml} onChange={handleProductChange} min="0" className="w-full border-b border-gray-300 py-2 outline-none text-sm bg-transparent focus:border-black transition" /></div>
                                    <div><label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Stock (3ML)</label><input type="number" name="stock3ml" value={newProduct.stock3ml} onChange={handleProductChange} min="0" className="w-full border-b border-gray-300 py-2 outline-none text-sm bg-transparent focus:border-black transition" /></div>
                                </div>

                                <div className="grid grid-cols-4 gap-4">
                                    <div><label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Top Notes</label><input type="text" name="topNotes" value={newProduct.topNotes} onChange={handleProductChange} className="w-full border-b border-gray-300 py-2 outline-none text-sm focus:border-black transition" /></div>
                                    <div><label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Heart Notes</label><input type="text" name="heartNotes" value={newProduct.heartNotes} onChange={handleProductChange} className="w-full border-b border-gray-300 py-2 outline-none text-sm focus:border-black transition" /></div>
                                    <div><label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Base Notes</label><input type="text" name="baseNotes" value={newProduct.baseNotes} onChange={handleProductChange} className="w-full border-b border-gray-300 py-2 outline-none text-sm focus:border-black transition" /></div>
                                    <div><label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Scent Family</label><input type="text" name="scentFamily" value={newProduct.scentFamily} onChange={handleProductChange} className="w-full border-b border-gray-300 py-2 outline-none text-sm focus:border-black transition" /></div>
                                </div>
                                
                                {/* NEW IMAGE FIELDS */}
                                <div className="grid grid-cols-2 gap-8 border border-gray-100 p-6 bg-gray-50">
                                    <div>
                                        <label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Upload Cover Image (Primary)</label>
                                        <input type="file" accept="image/png, image/jpeg, image/webp" onChange={(e) => setUploadFile(e.target.files[0])} className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-black file:text-white hover:file:bg-gray-800" />
                                    </div>
                                    <div>
                                        <label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">OR Paste Cover URL (Manual)</label>
                                        <input type="text" name="cover_image_url" value={newProduct.cover_image_url} onChange={handleProductChange} placeholder="https://..." className="w-full border-b border-gray-300 py-2 outline-none text-sm bg-transparent focus:border-black transition" />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Image Gallery URLs (Comma Separated)</label>
                                    <textarea name="images" value={newProduct.images} onChange={handleProductChange} rows="2" placeholder="https://image1.jpg, https://image2.jpg" className="w-full border border-gray-200 p-4 outline-none text-sm focus:border-black transition resize-none"></textarea>
                                </div>

                                <button type="submit" disabled={isUploading} className="bg-black text-white px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition mt-4 shadow-md cursor-pointer disabled:bg-gray-400">
                                    {isUploading ? "Uploading..." : "+ Add to Catalog"}
                                </button>
                            </form>
                        </div>
                        
                        <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                             <div className="p-6 border-b border-gray-100 flex items-center">
                                <SearchIconSmall />
                                <input type="text" placeholder="Search inventory..." value={inventorySearch} onChange={(e) => setInventorySearch(e.target.value)} className="ml-4 flex-1 outline-none text-sm font-bold tracking-widest placeholder:text-gray-300 uppercase" />
                            </div>
                            <table className="w-full text-left border-collapse">
                                <thead><tr className="bg-gray-50 text-[9px] uppercase tracking-widest text-gray-500 border-b border-gray-200"><th className="p-6 font-semibold">Fragrance</th><th className="p-6 font-semibold">Category</th><th className="p-6 font-semibold">Base Price</th><th className="p-6 font-semibold text-right">Actions</th></tr></thead>
                                <tbody className="text-xs">
                                    {filteredInventory.map(product => (
                                        <tr key={`inv-${product.id}`} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="p-6 font-bold uppercase tracking-widest">{product.name}</td>
                                            <td className="p-6 text-gray-500 uppercase tracking-widest text-[9px]">{product.category}</td>
                                            <td className="p-6">₱{product.price?.toLocaleString(undefined, {minimumFractionDigits: 2}) || 'N/A'}</td>
                                            <td className="p-6 flex justify-end gap-6 items-center">
                                                <button onClick={() => setEditingProduct({ ...product, images: product.images?.join(', ') || '' })} className="text-blue-500 hover:text-blue-700 transition flex items-center gap-1 uppercase tracking-widest text-[9px] font-bold cursor-pointer"><EditIcon /> Edit</button>
                                                <button onClick={() => handleDeleteProduct(product.id)} className="text-red-400 hover:text-red-600 transition flex items-center gap-1 uppercase tracking-widest text-[9px] font-bold cursor-pointer"><TrashIcon /> Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'fulfillment' && (
                    <div>
                        <header className="mb-12 flex justify-between items-end"><div><h2 className="text-[10px] uppercase tracking-[0.5em] text-gray-400 font-bold mb-3">Supply Chain Control</h2><h1 className="text-4xl font-bold tracking-tight text-black uppercase italic">Order Fulfillment</h1></div></header>
                        <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex items-center">
                                <SearchIconSmall />
                                <input type="text" placeholder="Search by Order ID or Customer Name..." value={fulfillmentSearch} onChange={(e) => setFulfillmentSearch(e.target.value)} className="ml-4 flex-1 outline-none text-sm font-bold tracking-widest placeholder:text-gray-300 uppercase" />
                            </div>
                            <table className="w-full text-left border-collapse">
                                <thead><tr className="bg-gray-50 text-[9px] uppercase tracking-widest text-gray-500 border-b border-gray-200"><th className="p-6 font-semibold">Order ID</th><th className="p-6 font-semibold">Customer</th><th className="p-6 font-semibold">Total Amount</th><th className="p-6 font-semibold">Payment</th><th className="p-6 font-semibold text-right">Status Action</th></tr></thead>
                                <tbody className="text-xs">{filteredFulfillment.length === 0 ? ( <tr><td colSpan="5" className="p-10 text-center text-gray-400 text-[10px] uppercase tracking-widest font-bold">No orders found.</td></tr> ) : (filteredFulfillment.map(order => (<tr key={`ord-${order.id}`} className="border-b border-gray-100 hover:bg-gray-50 transition-colors"><td className="p-6 font-bold tracking-widest">{order.order_number || `ORD-${order.id}`}</td><td className="p-6"><div className="font-bold text-gray-900 uppercase">{order.user?.fullname || 'Guest'}</div><div className="text-[9px] text-gray-400 uppercase tracking-widest mt-1">{new Date(order.createdAt).toLocaleDateString()}</div></td><td className="p-6 font-bold">₱{order.total_amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td><td className="p-6"><span className="font-bold uppercase tracking-widest text-[9px] px-2 py-1 bg-gray-100 rounded-sm border border-gray-200">{order.payment_method || 'COD'}</span></td><td className="p-6 text-right"><select value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value)} className="px-4 py-2 rounded-sm font-bold uppercase tracking-widest text-[9px] cursor-pointer outline-none border-none shadow-sm" style={{ backgroundColor: getStatusColor(order.status), color: order.status === 'Pending' ? '#000' : '#fff' }}><option value="Pending" className="bg-white text-black">PENDING</option><option value="Processing" className="bg-white text-black">PROCESSING</option><option value="Shipped" className="bg-white text-black">SHIPPED</option><option value="Completed" className="bg-white text-black">COMPLETED</option><option value="Cancelled" className="bg-white text-black">CANCELLED</option><option value="Return/Refund" className="bg-white text-black">RETURN/REFUND</option></select></td></tr>)))}</tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'returns' && (
                    <div>
                        <header className="mb-12 flex justify-between items-end"><div><h2 className="text-[10px] uppercase tracking-[0.5em] text-gray-400 font-bold mb-3">Customer Service</h2><h1 className="text-4xl font-bold tracking-tight text-black uppercase italic">Returns & Refunds Queue</h1></div></header>
                        <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                             <div className="p-6 border-b border-gray-100 flex items-center">
                                <SearchIconSmall />
                                <input type="text" placeholder="Search by Order ID or Customer Name..." value={returnsSearch} onChange={(e) => setReturnsSearch(e.target.value)} className="ml-4 flex-1 outline-none text-sm font-bold tracking-widest placeholder:text-gray-300 uppercase" />
                            </div>
                            <table className="w-full text-left border-collapse">
                                <thead><tr className="bg-gray-50 text-[9px] uppercase tracking-widest text-gray-500 border-b border-gray-200"><th className="p-6 font-semibold">Order ID</th><th className="p-6 font-semibold">Customer Details</th><th className="p-6 font-semibold">Amount to Refund</th><th className="p-6 font-semibold text-right">Current Status</th></tr></thead>
                                <tbody className="text-xs">{filteredReturns.length === 0 ? ( <tr><td colSpan="4" className="p-10 text-center text-gray-400 text-[10px] uppercase tracking-widest font-bold">No active returns found.</td></tr> ) : (filteredReturns.map(order => (<tr key={`ret-${order.id}`} className="border-b border-gray-100 hover:bg-gray-50 transition-colors"><td className="p-6 font-bold tracking-widest">{order.order_number || `ORD-${order.id}`}</td><td className="p-6"><div className="font-bold text-gray-900 uppercase">{order.user?.fullname || 'Guest'}</div><div className="text-[9px] text-gray-400 uppercase tracking-widest mt-1">{order.user?.email}</div></td><td className="p-6 font-bold">₱{order.total_amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td><td className="p-6 text-right"><select value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value)} className="px-4 py-2 rounded-sm font-bold uppercase tracking-widest text-[9px] cursor-pointer outline-none border-none shadow-sm" style={{ backgroundColor: getStatusColor(order.status), color: '#fff' }}><option value="Return/Refund" className="bg-white text-black">RETURN/REFUND</option><option value="Cancelled" className="bg-white text-black">CANCELLED</option><option value="Completed" className="bg-white text-black">COMPLETED (RESOLVED)</option></select></td></tr>)))}</tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* --- EDIT MODAL (Full Screen Overlay) --- */}
            {editingProduct && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60">
                    <div className="bg-white p-10 md:p-14 w-full max-w-4xl relative shadow-2xl h-[90vh] overflow-y-auto">
                        <button onClick={() => setEditingProduct(null)} className="absolute top-6 right-6 text-gray-400 hover:text-black text-xl">✕</button>
                        <h3 className="text-[11px] font-bold uppercase tracking-widest mb-8 border-b border-gray-100 pb-4">Edit Fragrance: <span className="text-black">{editingProduct.name}</span></h3>
                        
                        <form onSubmit={handleUpdateProduct} className="space-y-6">
                            <div className="grid grid-cols-2 gap-8">
                                <div><label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Product Name</label><input type="text" name="name" value={editingProduct.name} onChange={handleEditProductChange} required className="w-full border-b border-gray-300 py-3 outline-none text-sm focus:border-black transition" /></div>
                                <div><label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Category</label><select name="category" value={editingProduct.category} onChange={handleEditProductChange} required className="w-full border-b border-gray-300 py-3 outline-none text-sm focus:border-black transition bg-transparent"><option value="Women">Women</option><option value="Men">Men</option><option value="Unisex">Unisex</option></select></div>
                            </div>
                            
                            <div><label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Short Summary</label><textarea name="description" value={editingProduct.description} onChange={handleEditProductChange} required rows="2" className="w-full border-b border-gray-300 py-3 outline-none text-sm focus:border-black transition resize-none"></textarea></div>
                            <div><label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Detailed Formatting</label><textarea name="details" value={editingProduct.details || ''} onChange={handleEditProductChange} rows="4" className="w-full border border-gray-200 p-4 outline-none text-sm focus:border-black transition resize-none"></textarea></div>

                            <div className="grid grid-cols-4 gap-4 border border-gray-100 p-6 bg-gray-50">
                                <div><label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Price (100ML)</label><input type="number" name="price" value={editingProduct.price || ''} onChange={handleEditProductChange} min="0" step="0.01" className="w-full border-b border-gray-300 py-2 outline-none text-sm bg-transparent focus:border-black transition" /></div>
                                <div><label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Price (30ML)</label><input type="number" name="price30ml" value={editingProduct.price30ml || ''} onChange={handleEditProductChange} min="0" step="0.01" className="w-full border-b border-gray-300 py-2 outline-none text-sm bg-transparent focus:border-black transition" /></div>
                                <div><label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Price (3ML)</label><input type="number" name="price3ml" value={editingProduct.price3ml || ''} onChange={handleEditProductChange} min="0" step="0.01" className="w-full border-b border-gray-300 py-2 outline-none text-sm bg-transparent focus:border-black transition" /></div>
                                <div></div>
                                
                                <div><label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Stock (100ML)</label><input type="number" name="stock100ml" value={editingProduct.stock100ml || ''} onChange={handleEditProductChange} min="0" className="w-full border-b border-gray-300 py-2 outline-none text-sm bg-transparent focus:border-black transition" /></div>
                                <div><label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Stock (30ML)</label><input type="number" name="stock30ml" value={editingProduct.stock30ml || ''} onChange={handleEditProductChange} min="0" className="w-full border-b border-gray-300 py-2 outline-none text-sm bg-transparent focus:border-black transition" /></div>
                                <div><label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Stock (3ML)</label><input type="number" name="stock3ml" value={editingProduct.stock3ml || ''} onChange={handleEditProductChange} min="0" className="w-full border-b border-gray-300 py-2 outline-none text-sm bg-transparent focus:border-black transition" /></div>
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                                <div><label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Top Notes</label><input type="text" name="topNotes" value={editingProduct.topNotes || ''} onChange={handleEditProductChange} className="w-full border-b border-gray-300 py-2 outline-none text-sm focus:border-black transition" /></div>
                                <div><label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Heart Notes</label><input type="text" name="heartNotes" value={editingProduct.heartNotes || ''} onChange={handleEditProductChange} className="w-full border-b border-gray-300 py-2 outline-none text-sm focus:border-black transition" /></div>
                                <div><label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Base Notes</label><input type="text" name="baseNotes" value={editingProduct.baseNotes || ''} onChange={handleEditProductChange} className="w-full border-b border-gray-300 py-2 outline-none text-sm focus:border-black transition" /></div>
                                <div><label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Scent Family</label><input type="text" name="scentFamily" value={editingProduct.scentFamily || ''} onChange={handleEditProductChange} className="w-full border-b border-gray-300 py-2 outline-none text-sm focus:border-black transition" /></div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 border border-gray-100 p-6 bg-gray-50">
                                <div>
                                    <label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Update Cover Image</label>
                                    <input type="file" accept="image/png, image/jpeg, image/webp" onChange={(e) => setEditFile(e.target.files[0])} className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-black file:text-white hover:file:bg-gray-800" />
                                </div>
                                <div>
                                    <label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Current Cover URL</label>
                                    <input type="text" name="cover_image_url" value={editingProduct.cover_image_url || ''} onChange={handleEditProductChange} className="w-full border-b border-gray-300 py-2 outline-none text-sm bg-transparent focus:border-black transition" />
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Image Gallery URLs (Comma Separated)</label>
                                <textarea name="images" value={editingProduct.images || ''} onChange={handleEditProductChange} rows="2" className="w-full border border-gray-200 p-4 outline-none text-sm focus:border-black transition resize-none"></textarea>
                            </div>

                            <button type="submit" disabled={isUploading} className="bg-black text-white px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition mt-4 shadow-md w-full cursor-pointer disabled:bg-gray-400">
                                {isUploading ? "Saving..." : "Save Changes"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}