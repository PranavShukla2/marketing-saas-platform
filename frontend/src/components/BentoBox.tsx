'use client';

import { motion, type Variants } from 'framer-motion';

export default function BentoBox() {
    const fadeUp: Variants = {
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] } }
    };

    const stagger: Variants = {
        visible: { transition: { staggerChildren: 0.15 } }
    };

    const cardClass = "bg-white p-10 rounded-3xl border border-[#E5E5E5] shadow-[0_2px_20px_rgb(0,0,0,0.03)] flex flex-col justify-between hover:-translate-y-1 hover:shadow-xl transition-all duration-500 group";

    return (
        <section id="features" className="w-full max-w-6xl mx-auto px-6 py-24 border-t border-[#E5E5E5]">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp} className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.02em] text-[#1D1D1F] mb-4">
                    Engineered for scale.
                </h2>
                <p className="text-lg text-[#6E6E73] font-light">
                    Everything you need to run a thousand client dashboards.
                </p>
            </motion.div>

            <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={stagger}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >

                {/* Feature 1 - Wide Card */}
                <motion.div variants={fadeUp} className={`md:col-span-2 ${cardClass} relative overflow-hidden`}>
                    <div className="relative z-10">
                        <h3 className="text-2xl font-medium mb-2 text-[#1D1D1F]">Multi-Tenant Workspaces</h3>
                        <p className="text-[#6E6E73] max-w-sm">
                            Complete data isolation. Every client&apos;s API keys are AES-256 encrypted and scoped entirely to their dedicated workspace.
                        </p>
                    </div>
                    <motion.div
                        className="absolute -bottom-10 -right-10 w-64 h-64 bg-[#F5F5F7] rounded-full border border-[#E5E5E5] flex items-center justify-center"
                        whileHover={{ scale: 1.15, rotate: 10 }}
                        transition={{ type: "spring", stiffness: 200 }}
                    >
                        <div className="w-40 h-40 bg-white rounded-full shadow-sm border border-[#E5E5E5] flex items-center justify-center">
                            <svg className="w-12 h-12 text-[#1D1D1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75M3.75 22.5h16.5a1.5 1.5 0 001.5-1.5V12a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 12v9a1.5 1.5 0 001.5 1.5z" />
                            </svg>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Feature 2 - Square Card */}
                <motion.div variants={fadeUp} className={cardClass}>
                    <div className="relative z-10">
                        <motion.div
                            whileHover={{ scale: 1.15 }}
                            className="w-10 h-10 bg-[#F5F5F7] rounded-full flex items-center justify-center mb-6 border border-[#E5E5E5]"
                        >
                            <svg className="w-5 h-5 text-[#1D1D1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                            </svg>
                        </motion.div>
                        <h3 className="text-xl font-medium mb-2 text-[#1D1D1F]">Live Google Analytics Sync</h3>
                        <p className="text-[#6E6E73] text-sm">
                            Our high-frequency core engine authenticates securely to pull live and accurate time-series data without rate limits.
                        </p>
                    </div>
                </motion.div>

                {/* Feature 3 - Square Card */}
                <motion.div variants={fadeUp} className={cardClass}>
                    <div>
                        <motion.div
                            whileHover={{ scale: 1.15 }}
                            className="w-10 h-10 bg-[#F5F5F7] rounded-full flex items-center justify-center mb-6 border border-[#E5E5E5] group-hover:bg-[#EEF2FF] transition-colors duration-300"
                        >
                            <svg className="w-5 h-5 text-[#1D1D1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.456-2.456L14.25 6l1.035-.259a3.375 3.375 0 002.456-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                            </svg>
                        </motion.div>
                        <h3 className="text-xl font-medium mb-2 text-[#1D1D1F]">Automated Strategy Insights</h3>
                        <p className="text-[#6E6E73] text-sm">
                            Identify trends and anomalies in ad spend instantly. Let our predictive AI find the winning campaigns for your clients.
                        </p>
                    </div>
                </motion.div>

                {/* Feature 4 - Wide Card */}
                <motion.div variants={fadeUp} className={`md:col-span-2 ${cardClass} items-center text-center`}>
                    <div className="relative z-10 w-full flex flex-col items-center">
                        <div className="flex items-center space-x-2 mb-4">
                            {["Google", "Meta", "LinkedIn"].map((platform, i) => (
                                <motion.div
                                    key={platform}
                                    initial={{ opacity: 0, scale: 0 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.3 + i * 0.15, type: "spring", stiffness: 300 }}
                                    className="px-3 py-1 rounded-full bg-white border border-[#E5E5E5] text-xs font-semibold text-[#6E6E73] shadow-sm"
                                >
                                    {platform}
                                </motion.div>
                            ))}
                        </div>
                        <h3 className="text-2xl font-medium mb-4 text-[#1D1D1F]">White-Labeled Dashboards</h3>
                        <p className="text-[#6E6E73] mb-6 max-w-md">
                            Export beautiful reports directly to your clients with your own agency branding, URLs, and color schemes.
                        </p>
                    </div>
                </motion.div>

            </motion.div>
        </section>
    );
}
