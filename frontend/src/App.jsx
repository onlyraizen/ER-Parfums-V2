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
import SearchOverlay from './components/SearchOverlay';
import StoreLocator from './pages/StoreLocator';

// NEW LEGAL & CONTACT PAGES
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';
import RefundPolicy from './pages/RefundPolicy';
import ContactUs from './pages/ContactUs';

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
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  
  // NEW: Scroll Listener State
  const [isScrolled, setIsScrolled] = useState(false);

  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  // Track Scrolling for Morphing Navbar
  useEffect(() => {
      const handleScroll = () => {
          setIsScrolled(window.scrollY > 30);
      };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsNavHovered(false);
    setIsCartDrawerOpen(false); 
    setIsMobileMenuOpen(false); 
    setIsSearchOverlayOpen(false); 
    window.scrollTo(0, 0);
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

  // DYNAMIC MORPHING & ADAPTIVE STYLES
  const isSolid = !isHome || isNavHovered || isCartDrawerOpen || isMobileMenuOpen || isSearchOverlayOpen || isScrolled; 
  const navPositionClass = 'fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-in-out';
  const navBackgroundClass = isSolid ? 'bg-white/95 dark:bg-black/95 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-800' : 'bg-transparent border-b border-transparent';
  const textColor = isSolid ? 'text-black dark:text-white' : 'text-white';
  const lineBgColor = isSolid ? 'bg-black dark:bg-white' : 'bg-white';
  const paddingYClass = isSolid ? 'py-4' : 'py-8';

  const Divider = () => <span className={`text-[10px] mx-4 font-light transition-colors duration-300 hidden md:inline ${isSolid ? 'text-gray-300 dark:text-gray-700' : 'text-white/40'}`}>|</span>;

  const NavLink = ({ to, onClick, children, className="" }) => {
    const baseClass = `group relative inline-block ${textColor} uppercase font-bold text-[10px] tracking-[0.15em] transition-colors duration-300 cursor-pointer ${className}`;
    const lineClass = `absolute left-0 -bottom-1.5 w-full h-[1px] ${lineBgColor} scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`;
    if (to) return <Link to={to} onClick={() => setIsMobileMenuOpen(false)} className={baseClass}>{children}<span className={lineClass}></span></Link>;
    return <button onClick={onClick} className={baseClass}>{children}<span className={lineClass}></span></button>;
  };

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-black dark:text-white relative flex flex-col overflow-x-hidden transition-colors duration-300">
      
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setAuthModalOpen(false)} />
      <CartDrawer isOpen={isCartDrawerOpen} onClose={() => setIsCartDrawerOpen(false)} cart={cart} setCart={setCart} updateQuantity={updateCartQuantity} requireAuth={requireAuth} />
      <SearchOverlay isOpen={isSearchOverlayOpen} onClose={() => setIsSearchOverlayOpen(false)} />

      <AnimatePresence>
          {isMobileMenuOpen && (
              <motion.div 
                  initial={{ opacity: 0, x: '100%' }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: '100%' }} 
                  transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
                  className="fixed inset-0 z-[60] bg-black dark:bg-gray-900 text-white p-10 flex flex-col"
              >
                  <div className="flex justify-end mb-12">
                      <button onClick={() => setIsMobileMenuOpen(false)} className="text-white hover:text-gray-400 transition-colors"><CloseIcon /></button>
                  </div>
                  
                  <div className="flex flex-col space-y-8 text-lg font-normal tracking-[0.15em] uppercase logo-font">
                      <Link to="/collection" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-gray-400 transition-colors">The Collection</Link>
                      <Link to="/collection/Women" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-gray-400 transition-colors">Women</Link>
                      <Link to="/collection/Men" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-gray-400 transition-colors">Men</Link>
                      <button onClick={() => { setIsMobileMenuOpen(false); setIsSearchOverlayOpen(true); }} className="hover:text-gray-400 transition-colors text-left text-lg font-normal tracking-[0.15em] uppercase logo-font">Search</button>
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
                      <Link to="/stores" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-white transition-colors">Find a Store</Link>
                      <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-white transition-colors">Customer Service</Link>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>

      {!isAdmin && (
          <nav className={`${navPositionClass} ${navBackgroundClass}`} onMouseEnter={() => setIsNavHovered(true)} onMouseLeave={() => setIsNavHovered(false)}>
            <div className={`px-6 md:px-10 flex flex-col transition-all duration-500 ease-in-out ${paddingYClass}`}>
                <div className="flex justify-between items-center w-full">
                    
                    <div className="w-1/3 flex items-center">
                        <button className={`md:hidden ${textColor}`} onClick={() => setIsMobileMenuOpen(true)}>
                            <MenuIcon />
                        </button>
                        <div className="hidden md:flex items-center">
                            <NavLink to="/stores">Find a Store</NavLink><Divider /><NavLink to="/contact">Customer Service</NavLink>
                        </div>
                    </div>

                    <div className="w-1/3 flex justify-center">
                        <Link to="/" className="hover:opacity-80 transition-opacity duration-300 flex items-center justify-center">
                            {/* Logo smoothly shrinks when scrolling */}
                            <img src="/logo.png" alt="ER Parfums Logo" className={`w-auto object-contain transition-all duration-500 hover:scale-105 ${isSolid ? 'h-8 md:h-10 lg:h-12' : 'h-12 md:h-16 lg:h-20'} dark:invert`} />
                        </Link>
                    </div>

                    <div className="w-1/3 flex justify-end items-center">
                        <div className="hidden md:flex items-center">
                            {token ? (
                                <><NavLink to={user?.role === 'admin' ? "/admin" : "/profile"}>{user?.role === 'admin' ? 'Dashboard' : 'Profile'}</NavLink><Divider /><NavLink onClick={handleLogout}>Logout</NavLink></>
                            ) : (<NavLink onClick={() => setAuthModalOpen(true)}>Log In</NavLink>)}
                            <Divider />
                        </div>
                        <NavLink onClick={() => setIsCartDrawerOpen(true)}>
                            <span className="hidden md:inline">My Bag ({cartItemCount})</span>
                            <span className="md:hidden flex items-center gap-1"><BagIcon /> {cartItemCount}</span>
                        </NavLink>
                    </div>
                </div>
                
                {!isProfile && (
                    <div className={`hidden md:flex justify-center items-center space-x-16 transition-all duration-500 overflow-hidden ${isSolid ? 'opacity-0 h-0 mt-0 pointer-events-none' : 'opacity-100 h-auto mt-8'}`}>
                        <NavLink to="/collection">Highlights</NavLink>
                        <NavLink to="/collection/Women">Women</NavLink>
                        <NavLink to="/collection/Men">Men</NavLink>
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
          <Route path="/product/:id" element={<PageTransition><ProductDetails addToCart={addToCart} /></PageTransition>} />
          <Route path="/stores" element={<PageTransition><StoreLocator /></PageTransition>} />
          <Route path="/cart" element={<PageTransition><Cart cart={cart} setCart={setCart} /></PageTransition>} />
          <Route path="/admin" element={<PageTransition><AdminDashboard /></PageTransition>} />
          <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
          
          {/* LEGAL & CONTACT ROUTES */}
          <Route path="/privacy-policy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />
          <Route path="/terms-of-use" element={<PageTransition><TermsOfUse /></PageTransition>} />
          <Route path="/refund-policy" element={<PageTransition><RefundPolicy /></PageTransition>} />
          <Route path="/contact" element={<PageTransition><ContactUs /></PageTransition>} />
        </Routes>
      </AnimatePresence>

      {!isAdmin && <Footer />}
    </div>
  );
}

export default App;