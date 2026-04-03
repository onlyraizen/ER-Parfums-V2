import { useState } from 'react';
import { motion } from 'framer-motion';

// ICONS
const MapPinIcon = () => (<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>);

// --- REAL STORE DATA ---
const STORES_DATA = [
    {
        id: 1,
        name: "ER Parfums - Karuhatan Branch",
        address: "254 Mac-Arthur Highway, Karuhatan, Valenzuela City",
        hours: "Mon - Sun: 9:00 AM - 9:00 PM",
        // Properly formatted embed URL so it works in the iframe
        mapCenter: "https://www.google.com/maps?q=254+Mac-Arthur+Highway,+Karuhatan,+Valenzuela+City&output=embed"
    },
    {
        id: 2,
        name: "ER Parfums - Marulas Branch",
        address: "15 Pio Valenzuela Street, Marulas, Valenzuela City",
        hours: "Mon - Sun: 9:00 AM - 9:00 PM",
        mapCenter: "https://www.google.com/maps?q=15+Pio+Valenzuela+Street,+Marulas,+Valenzuela+City&output=embed"
    },
    {
        id: 3,
        name: "ER Parfums - Dalandanan Branch",
        address: "Dalandanan, Valenzuela City",
        hours: "Mon - Sun: 9:00 AM - 9:00 PM",
        mapCenter: "https://www.google.com/maps?q=Dalandanan,+Valenzuela+City&output=embed"
    }
];

export default function StoreLocator() {
    const [selectedLocation, setSelectedLocation] = useState(STORES_DATA[0]);

    return (
        <div className="min-h-screen bg-white pt-32 pb-24 font-sans text-black overflow-x-hidden">
            <div className="max-w-[1400px] mx-auto px-6 md:px-10">
                
                {/* Header */}
                <header className="mb-16 md:mb-20 text-center flex flex-col items-center">
                    <h2 className="text-[10px] md:text-xs uppercase tracking-[0.5em] text-gray-400 font-bold mb-4">Visit Our Franchises</h2>
                    <h1 className="text-4xl md:text-5xl font-normal tracking-[0.15em] uppercase logo-font italic">Store Locator</h1>
                    <div className="w-24 h-px bg-black mt-8"></div>
                </header>

                <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
                    
                    {/* LEFT SIDE: List of 3 Franchises */}
                    <div className="w-full lg:w-2/5 space-y-6 lg:max-h-[700px] lg:overflow-y-auto pr-4 scrollbar-hide">
                        {STORES_DATA.map(store => (
                            <motion.div 
                                key={store.id}
                                onClick={() => setSelectedLocation(store)}
                                whileHover={{ y: -4, borderColor: '#000' }}
                                transition={{ type: 'tween', duration: 0.2 }}
                                className={`border p-8 flex gap-6 cursor-pointer transition-colors duration-300 rounded-sm ${selectedLocation.id === store.id ? 'border-black bg-gray-50 shadow-lg' : 'border-gray-100 hover:shadow-md'}`}
                            >
                                <div className={`w-12 h-12 rounded-full border flex items-center justify-center shrink-0 transition-colors ${selectedLocation.id === store.id ? 'border-black bg-black text-white' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>
                                    <MapPinIcon />
                                </div>
                                
                                <div className="space-y-3 flex-1">
                                    <h3 className="text-sm md:text-base font-bold uppercase tracking-widest">{store.name}</h3>
                                    <p className="text-xs text-gray-600 leading-relaxed uppercase tracking-widest">{store.address}</p>
                                    
                                    <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row gap-3 sm:gap-6 text-xs text-gray-500 uppercase tracking-widest font-bold">
                                        <span className="flex items-center gap-2 text-green-600">✓ Open Today</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-normal normal-case">{store.hours}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* RIGHT SIDE: Dynamic Map Embed */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={selectedLocation.id} // Re-animate when location changes
                        transition={{ type: 'tween', duration: 0.4, ease: 'easeOut' }}
                        className="w-full lg:w-3/5 bg-gray-50 border border-gray-100 h-[400px] md:h-[500px] lg:h-[700px] relative shadow-inner overflow-hidden rounded-sm"
                    >
                        <iframe 
                            width="100%" 
                            height="100%" 
                            frameBorder="0" 
                            scrolling="no" 
                            marginHeight="0" 
                            marginWidth="0" 
                            title={`Map for ${selectedLocation.name}`}
                            src={selectedLocation.mapCenter} 
                            style={{ border: 0 }} 
                            allowFullScreen="" 
                            loading="lazy"
                        />
                    </motion.div>
                </div>
            </div>
        </div>
    );
}