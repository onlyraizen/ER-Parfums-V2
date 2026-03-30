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

// --- PHASE 4 FIX: NEW SEARCH OVERLAY IMPORT ---
import SearchOverlay from './components/SearchOverlay';

// ICONS
const SearchIconSmall = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 inline-block mr-2 -mt-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>);
const BagIcon = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 inline-block ml-1 -mt-1"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>);
const MenuIcon = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>);
const CloseIcon = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);

const PageTransition = ({ children }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}>
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // --- PHASE 4 FIX: NEW SEARCH OVERLAY STATE ---
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);

  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  // Close menus when route changes
  useEffect(() => {
    setIsNavHovered(false);
    setIsCartDrawerOpen(false); 
    setIsMobileMenuOpen(false); 
    setIsSearchOverlayOpen(false); // Close search when moving pages
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('er_cart');
    setCart([]);
    setIsMobileMenuOpen(false);
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
    if (newQuantity < 1) {
      setCart(prevCart => prevCart.filter(item => item.id !== productId));
      return;
    } 
    setCart(prevCart => prevCart.map(item => item.id === productId ? { ...item, quantity: newQuantity } : item));
  };

  const isHome = location.pathname === '/';
  const isAdmin = location.pathname.startsWith('/admin');
  const isProfile = location.pathname === '/profile';

  // Mobile menu or Search overlay overrides hover state
  const isSolid = !isHome || isNavHovered || isCartDrawerOpen || isMobileMenuOpen || isSearchOverlayOpen; 
  const navPositionClass = isHome ? 'absolute top-0 left-0 w-full z-50' : 'relative w-full z-50';
  const navBackgroundClass = isSolid ? 'bg-white border-b border-gray-100' : 'bg-transparent border-b border-transparent';
  const textColor = isSolid ? 'text-black' : 'text-white';
  const lineBgColor = isSolid ? 'bg-black' : 'bg-white';

  const Divider = () => <span className={`text-[10px] mx-4 font-light transition-colors duration-300 hidden md:inline ${isSolid ? 'text-gray-300' : 'text-white/40'}`}>|</span>;

  // Custom link component for Desktop Nav
  const NavLink = ({ to, onClick, children, className="" }) => {
    const baseClass = `group relative inline-block ${textColor} uppercase font-bold text-[10px] tracking-[0.15em] transition-colors duration-300 cursor-pointer ${className}`;
    const lineClass = `absolute left-0 -bottom-1.5 w-full h-[1px] ${lineBgColor} scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`;
    if (to) return <Link to={to} onClick={() => setIsMobileMenuOpen(false)} className={baseClass}>{children}<span className={lineClass}></span></Link>;
    return <button onClick={onClick} className={baseClass}>{children}<span className={lineClass}></span></button>;
  };

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="min-h-screen bg-white relative flex flex-col overflow-x-hidden">
      
      {/* AUTH AND CART */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setAuthModalOpen(false)} />
      <CartDrawer isOpen={isCartDrawerOpen} onClose={() => setIsCartDrawerOpen(false)} cart={cart} setCart={setCart} updateQuantity={updateCartQuantity} requireAuth={requireAuth} />

      {/* --- PHASE 4 FIX: SEARCH OVERLAY COMPONENT --- */}
      <SearchOverlay isOpen={isSearchOverlayOpen} onClose={() => setIsSearchOverlayOpen(false)} />


      {/* MOBILE NAVIGATION OVERLAY */}
      <AnimatePresence>
          {isMobileMenuOpen && (
              <motion.div 
                  initial={{ opacity: 0, x: '100%' }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: '100%' }} 
                  transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
                  className="fixed inset-0 z-[60] bg-black text-white p-10 flex flex-col"
              >
                  <div className="flex justify-end mb-12">
                      <button onClick={() => setIsMobileMenuOpen(false)} className="text-white hover:text-gray-400 transition-colors"><CloseIcon /></button>
                  </div>
                  
                  <div className="flex flex-col space-y-8 text-lg font-normal tracking-[0.15em] uppercase logo-font">
                      <Link to="/collection" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-gray-400 transition-colors">The Collection</Link>
                      <Link to="/collection/Women" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-gray-400 transition-colors">Women</Link>
                      <Link to="/collection/Men" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-gray-400 transition-colors">Men</Link>
                      
                      {/* Mobile search is different, just navigates to the generic collection page */}
                      <Link to="/collection" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-gray-400 transition-colors">Search</Link>
                  </div>

                  <div className="mt-auto pt-10 border-t border-gray-800 flex flex-col space-y-6 text-xs uppercase tracking-widest font-bold text-gray-400">
                      {token ? (
                          <>
                              <Link to={user?.role === 'admin' ? "/admin" : "/profile"} onClick={() => setIsMobileMenuOpen(false)} className="hover:text-white transition-colors">{user?.role === 'admin' ? 'Admin Dashboard' : 'My Account'}</Link>
                              <button onClick={handleLogout} className="text-left hover:text-white transition-colors">Logout</button>
                          </>
                      ) : (
                          <button onClick={() => { setIsMobileMenuOpen(false); setAuthModalOpen(true); }} className="text-left hover:text-white transition-colors">Log In / Register</button>
                      )}
                      <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-white transition-colors">Customer Service</Link>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>


      {!isAdmin && (
          <nav className={`${navPositionClass} ${navBackgroundClass} flex flex-col transition-all duration-300 ease-out`} onMouseEnter={() => setIsNavHovered(true)} onMouseLeave={() => setIsNavHovered(false)}>
            <div className="px-6 md:px-10 pt-6 pb-6 flex flex-col">
                <div className="flex justify-between items-center w-full">
                    
                    {/* LEFT: Desktop Links & Mobile Hamburger */}
                    <div className="w-1/3 flex items-center">
                        <button className={`md:hidden ${textColor}`} onClick={() => setIsMobileMenuOpen(true)}>
                            <MenuIcon />
                        </button>
                        <div className="hidden md:flex items-center">
                            <NavLink to="/">Find a Store</NavLink><Divider /><NavLink to="/">Customer Service</NavLink>
                        </div>
                    </div>

                    {/* CENTER: Logo */}
                    <div className="w-1/3 flex justify-center">
                        <Link to="/" className="hover:opacity-80 transition-opacity duration-300 flex items-center justify-center">
                            <img src="/logo.png" alt="ER Parfums Logo" className="h-12 md:h-16 lg:h-20 w-auto object-contain transition-transform duration-300 hover:scale-105" />
                        </Link>
                    </div>

                    {/* RIGHT: Desktop Auth & Cart */}
                    <div className="w-1/3 flex justify-end items-center">
                        <div className="hidden md:flex items-center">
                            {token ? (
                                <><NavLink to={user?.role === 'admin' ? "/admin" : "/profile"}>{user?.role === 'admin' ? 'Dashboard' : 'Profile'}</NavLink><Divider /><NavLink onClick={handleLogout}>Logout</NavLink></>
                            ) : (<NavLink onClick={() => setAuthModalOpen(true)}>Log In</NavLink>)}
                            <Divider />
                        </div>
                        {/* Cart is always visible, even on mobile */}
                        <NavLink onClick={() => setIsCartDrawerOpen(true)}>
                            <span className="hidden md:inline">My Bag ({cartItemCount})</span>
                            <span className="md:hidden flex items-center gap-1"><BagIcon /> {cartItemCount}</span>
                        </NavLink>
                    </div>
                </div>
                
                {/* Desktop Sub-Nav (Hidden on Mobile or Profile) */}
                {!isProfile && (
                    <div className="hidden md:flex justify-center items-center space-x-16 mt-8 animate-fade-in">
                        <NavLink to="/collection">Highlights</NavLink>
                        <NavLink to="/collection/Women">Women</NavLink>
                        <NavLink to="/collection/Men">Men</NavLink>
                        
                        {/* --- FIXED SEARCH BUTTON HERE --- */}
                        <NavLink onClick={() => setIsSearchOverlayOpen(true)}><SearchIconSmall /> Search</NavLink>
                    </div>
                )}
            </div>
          </nav>
      )}

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><Home /></PageTransition>} />
          <Route path="/collection" element={<PageTransition><Collection addToCart={addToCart} /></PageTransition>} />
          <Route path="/collection/:category" element={<PageTransition><Collection addToCart={addToCart} /></PageTransition>} />
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