import { motion } from 'framer-motion';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-white pt-40 pb-24 font-sans text-black">
            <div className="max-w-[800px] mx-auto px-6 md:px-10">
                <header className="mb-16 text-center">
                    <h1 className="text-3xl md:text-4xl font-normal tracking-[0.15em] uppercase logo-font">Privacy Policy</h1>
                    <div className="w-16 h-px bg-black mx-auto mt-8"></div>
                </header>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-8 text-sm text-gray-700 leading-loose">
                    <p>At <span className="font-bold">ER PARFUMS</span>, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, retain, and safeguard your personal information.</p>
                    
                    <div>
                        <h2 className="font-bold text-black mb-2 uppercase tracking-widest text-xs">1. Information Collection</h2>
                        <p className="mb-2">We may collect personal information when you:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Make a purchase</li>
                            <li>Sign up for our newsletter</li>
                            <li>Contact us for customer support</li>
                        </ul>
                        <p className="mt-4 mb-2">The information collected may include:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Name</li>
                            <li>Email address</li>
                            <li>Phone number</li>
                            <li>Shipping address</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="font-bold text-black mb-2 uppercase tracking-widest text-xs">2. Use of Information</h2>
                        <p className="mb-2">We use your personal information to:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Process and fulfill your orders</li>
                            <li>Communicate with you about your orders, products, and promotions</li>
                            <li>Improve our website and customer service</li>
                            <li>Send you promotional materials (only if you have opted in)</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="font-bold text-black mb-2 uppercase tracking-widest text-xs">3. Information Sharing</h2>
                        <p className="mb-2">We do not sell, trade, or share your personal information with third parties, except when necessary to complete your order, such as:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Payment processing services</li>
                            <li>Shipping companies</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="font-bold text-black mb-2 uppercase tracking-widest text-xs">4. Data Retention and Deletion</h2>
                        <p>We retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, comply with legal obligations, resolve disputes, and enforce our agreements. Upon request, we will delete your personal data in accordance with applicable laws and regulations.</p>
                    </div>

                    <div>
                        <h2 className="font-bold text-black mb-2 uppercase tracking-widest text-xs">5. Google User Data Compliance</h2>
                        <p>ER PARFUMS does not use Google Workspace APIs to develop, improve, or train generalized AI and/or machine learning models. We access and process Google user data strictly in compliance with Google's data policies and with user consent.</p>
                    </div>

                    <div>
                        <h2 className="font-bold text-black mb-2 uppercase tracking-widest text-xs">6. Data Security</h2>
                        <p>We implement security measures to protect your personal information. Your data is stored in secured networks and accessible only to authorized personnel with special access rights.</p>
                    </div>

                    <div>
                        <h2 className="font-bold text-black mb-2 uppercase tracking-widest text-xs">7. Cookies</h2>
                        <p>Our website uses cookies to enhance your browsing experience. You can disable cookies through your browser settings if you prefer.</p>
                    </div>

                    <div>
                        <h2 className="font-bold text-black mb-2 uppercase tracking-widest text-xs">8. Third-Party Links</h2>
                        <p>We may feature third-party products or services on our website. These external sites have their own privacy policies, and we are not responsible for their content or activities.</p>
                    </div>

                    <div>
                        <h2 className="font-bold text-black mb-2 uppercase tracking-widest text-xs">9. Changes to Our Privacy Policy</h2>
                        <p>ER PARFUMS may update this Privacy Policy periodically. Any changes will be posted on our website.</p>
                    </div>

                    <div className="pt-8 border-t border-gray-100">
                        <p>For any questions regarding this policy, please contact us.<br/>
                        This version ensures compliance with Google's requirements and includes data retention and deletion policies. Let me know if you need further refinements! 🚀 Email: <a href="mailto:help@erparfums.com" className="text-black underline">help@erparfums.com</a><br/>
                        By using our site, you consent to our Privacy Policy.</p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}