import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion'; 
import Home from './pages/Home';       
import Cart from './pages/Cart'; 
import AdminDashboard from './pages/AdminDashboard';
import ProductDetails from './pages/ProductDetails';
import AuthModal from './components/AuthModal'; 
import Profile from './pages/Profile';
import Collection from './pages/Collection';
import CartDrawer from './components/CartDrawer'; 
import Footer from './components/Footer'; 

// ICONS
const SearchIconSmall = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 inline-block mr-2 -mt-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>);
const BagIcon = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 inline-block ml-1 -mt-1"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>);

// ULTRA-FAST HARDWARE-ACCELERATED PAGE TRANSITION
const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }} // Tween is faster/smoother than Spring
  >
    {children}
  </motion.div>
);

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [cart, setCart] = useState(() => {
      const savedCart = localStorage.getItem('er_cart');
      return savedCart ? JSON.parse(savedCart) : [];
  });
  useEffect(() => { localStorage.setItem('er_cart', JSON.stringify(cart)); }, [cart]);

  const [isAuthModalOpen, setAuthModalOpen] = useState(false); 
  const [isNavHovered, setIsNavHovered] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  useEffect(() => {
    setIsNavHovered(false);
    setIsCartDrawerOpen(false); 
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/'); 
    window.location.reload();
  };

  const requireAuth = (actionCallback) => {
    if (token) actionCallback();
    else setAuthModalOpen(true);
  };

  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
    setIsCartDrawerOpen(true); 
  };

  const updateCartQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return; 
    setCart(prevCart => prevCart.map(item => item.id === productId ? { ...item, quantity: newQuantity } : item));
  };

  const isHome = location.pathname === '/';
  const isAdmin = location.pathname.startsWith('/admin');
  
  // FIX COMPLAINT 1: Hide lower links on profile page
  const isProfile = location.pathname === '/profile';

  const isSolid = !isHome || isNavHovered || isCartDrawerOpen; 
  const navPositionClass = isHome ? 'absolute top-0 left-0 w-full z-50' : 'relative w-full z-50';
  // Removing backdrop-blur everywhere to fix performance lag
  const navBackgroundClass = isSolid ? 'bg-white border-b border-gray-100' : 'bg-transparent border-b border-transparent';
  const textColor = isSolid ? 'text-black' : 'text-white';
  const lineBgColor = isSolid ? 'bg-black' : 'bg-white';

  const Divider = () => <span className={`text-[10px] mx-4 font-light transition-colors duration-300 ${isSolid ? 'text-gray-300' : 'text-white/40'}`}>|</span>;

  const NavLink = ({ to, onClick, children }) => {
    const baseClass = `group relative inline-block ${textColor} uppercase font-bold text-[10px] tracking-[0.15em] transition-colors duration-300 cursor-pointer`;
    const lineClass = `absolute left-0 -bottom-1.5 w-full h-[1px] ${lineBgColor} scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`;
    if (to) return <Link to={to} className={baseClass}>{children}<span className={lineClass}></span></Link>;
    return <button onClick={onClick} className={baseClass}>{children}<span className={lineClass}></span></button>;
  };

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="min-h-screen bg-white relative flex flex-col overflow-x-hidden">
      
      {/* Auth Modal resets view to Login when closed */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setAuthModalOpen(false)} />
      
      {/* Cart Drawer is now lag-free */}
      <CartDrawer isOpen={isCartDrawerOpen} onClose={() => setIsCartDrawerOpen(false)} cart={cart} setCart={setCart} updateQuantity={updateCartQuantity} requireAuth={requireAuth} />

      {!isAdmin && (
          <nav className={`${navPositionClass} ${navBackgroundClass} flex flex-col transition-all duration-300 ease-out`} onMouseEnter={() => setIsNavHovered(true)} onMouseLeave={() => setIsNavHovered(false)}>
            <div className="px-10 pt-8 pb-6 flex flex-col">
                <div className="flex justify-between items-center w-full">
                    <div className="w-1/3 flex items-center">
                        <NavLink to="/">Find a Store</NavLink><Divider /><NavLink to="/">Customer Service</NavLink>
                    </div>
                    <div className="w-1/3 flex justify-center">
                        <Link to="/" className="hover:opacity-80 transition-opacity duration-300 flex items-center justify-center">
                            <img src="/logo.png" alt="ER Parfums Logo" className="h-16 md:h-20 w-auto object-contain transition-transform duration-300 hover:scale-105" />
                        </Link>
                    </div>
                    <div className="w-1/3 flex justify-end items-center">
                        {token ? (
                            <><NavLink to={user?.role === 'admin' ? "/admin" : "/profile"}>{user?.role === 'admin' ? 'Dashboard' : 'Profile'}</NavLink><Divider /><NavLink onClick={handleLogout}>Logout</NavLink></>
                        ) : (<NavLink onClick={() => setAuthModalOpen(true)}>Log In</NavLink>)}
                        <Divider />
                        <NavLink onClick={() => setIsCartDrawerOpen(true)}>My Bag ({cartItemCount}) <BagIcon /></NavLink>
                    </div>
                </div>
                
                {/* FIX COMPLAINT 1: Hide links if on profile */}
                {!isProfile && (
                    <div className="flex justify-center items-center space-x-16 mt-8 animate-fade-in">
                        <NavLink to="/collection">Highlights</NavLink>
                        <NavLink to="/collection/Women">Women</NavLink>
                        <NavLink to="/collection/Men">Men</NavLink>
                        <NavLink to="/collection"><SearchIconSmall /> Search</NavLink>
                    </div>
                )}
            </div>
          </nav>
      )}

      {/* ANIMATED PAGE ROUTES */}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><Home /></PageTransition>} />
          <Route path="/collection" element={<PageTransition><Collection /></PageTransition>} />
          <Route path="/collection/:category" element={<PageTransition><Collection /></PageTransition>} />
          <Route path="/product/:id" element={<PageTransition><ProductDetails requireAuth={requireAuth} addToCart={addToCart} /></PageTransition>} />
          <Route path="/cart" element={<PageTransition><Cart cart={cart} setCart={setCart} /></PageTransition>} />
          <Route path="/admin" element={<PageTransition><AdminDashboard /></PageTransition>} />
          <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
        </Routes>
      </AnimatePresence>

      {!isAdmin && <Footer />}
      
    </div>
  );
}

export default App;