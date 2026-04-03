import { motion } from 'framer-motion';

export default function TermsOfUse() {
    return (
        <div className="min-h-screen bg-white pt-40 pb-24 font-sans text-black">
            <div className="max-w-[800px] mx-auto px-6 md:px-10">
                <header className="mb-16 text-center">
                    <h1 className="text-3xl md:text-4xl font-normal tracking-[0.15em] uppercase logo-font">Terms of Use</h1>
                    <div className="w-16 h-px bg-black mx-auto mt-8"></div>
                </header>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-8 text-sm text-gray-700 leading-loose">
                    <p>Welcome to ER PARFUMS. By accessing or using our website, you agree to be bound by the following terms and conditions. Please read them carefully.</p>
                    
                    <div>
                        <h2 className="font-bold text-black mb-2 uppercase tracking-widest text-xs">1. General Conditions</h2>
                        <p>We reserve the right to refuse service to anyone for any reason at any time. You understand that your content (not including credit card information), may be transferred unencrypted and involve transmissions over various networks.</p>
                    </div>

                    <div>
                        <h2 className="font-bold text-black mb-2 uppercase tracking-widest text-xs">2. Products and Pricing</h2>
                        <p>Prices for our products are subject to change without notice. We reserve the right at any time to modify or discontinue the Service (or any part or content thereof) without notice at any time. All descriptions of products or product pricing are subject to change at anytime without notice, at the sole discretion of us.</p>
                    </div>

                    <div>
                        <h2 className="font-bold text-black mb-2 uppercase tracking-widest text-xs">3. Accuracy of Billing and Account Information</h2>
                        <p>We reserve the right to refuse any order you place with us. We may, in our sole discretion, limit or cancel quantities purchased per person, per household or per order. You agree to provide current, complete and accurate purchase and account information for all purchases made at our store.</p>
                    </div>

                    <div>
                        <h2 className="font-bold text-black mb-2 uppercase tracking-widest text-xs">4. User Comments and Feedback</h2>
                        <p>If, at our request, you send certain specific submissions or without a request from us you send creative ideas, suggestions, proposals, plans, or other materials, you agree that we may, at any time, without restriction, edit, copy, publish, distribute, translate and otherwise use in any medium any comments that you forward to us.</p>
                    </div>

                    <div>
                        <h2 className="font-bold text-black mb-2 uppercase tracking-widest text-xs">5. Prohibited Uses</h2>
                        <p>In addition to other prohibitions as set forth in the Terms of Service, you are prohibited from using the site or its content: (a) for any unlawful purpose; (b) to solicit others to perform or participate in any unlawful acts; (c) to violate any international, federal, provincial or state regulations, rules, laws, or local ordinances.</p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}