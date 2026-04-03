import { motion } from 'framer-motion';

export default function RefundPolicy() {
    return (
        <div className="min-h-screen bg-white pt-40 pb-24 font-sans text-black">
            <div className="max-w-[800px] mx-auto px-6 md:px-10">
                <header className="mb-16 text-center">
                    <h1 className="text-3xl md:text-4xl font-normal tracking-[0.15em] uppercase logo-font">Refund Policy</h1>
                    <div className="w-16 h-px bg-black mx-auto mt-8"></div>
                </header>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-8 text-sm text-gray-700 leading-loose">
                    <p>At ER PARFUMS, we strive to ensure you are completely satisfied with your purchase. If you receive a damaged, defective, or incorrect item, we are here to help.</p>
                    
                    <div>
                        <h2 className="font-bold text-black mb-2 uppercase tracking-widest text-xs">1. Eligibility for Returns</h2>
                        <p>To be eligible for a return and refund, the following conditions must be met:</p>
                        <ul className="list-disc pl-5 space-y-2 mt-2">
                            <li>The return request must be initiated within <strong>7 days</strong> of receiving the item.</li>
                            <li>The item must be unused, in the same condition that you received it, and in its original sealed packaging.</li>
                            <li>Due to hygiene and safety reasons, opened or used fragrances cannot be returned unless the bottle mechanism itself is defective.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="font-bold text-black mb-2 uppercase tracking-widest text-xs">2. The Unboxing Video Requirement</h2>
                        <p>To protect both the buyer and the seller from fraudulent claims, <strong>a clear, unedited unboxing video is strictly required</strong> for all return and refund requests concerning missing, leaked, or damaged items. The video must show the waybill and the parcel completely sealed before opening.</p>
                    </div>

                    <div>
                        <h2 className="font-bold text-black mb-2 uppercase tracking-widest text-xs">3. Process for Returns</h2>
                        <p>To initiate a return, please navigate to your Profile, select "My Purchases," locate the completed order, and click "Request Return/Refund." You may also contact our support team directly. Approved refunds will be processed back to your original method of payment (e.g., GCash) within 5-7 business days after we receive and inspect the returned item.</p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}