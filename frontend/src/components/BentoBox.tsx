'use client';

import { motion } from 'framer-motion';

export default function BentoBox() {
    const fadeUp = {
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] } }
    };

    const stagger = {
        visible: { transition: { staggerChildren: 0.15 } }
    };

    return (
        <section id="features" className="w-full max-w-6xl mx-auto px-6 py-24 border-t border-gray-100">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp} className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 mb-4">
                    Engineered for scale.
                </h2>
                <p className="text-lg text-gray-500 font-light">
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
                <motion.div variants={fadeUp} className="md:col-span-2 bg-white p-10 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex flex-col justify-between overflow-hidden relative group hover:-translate-y-1 hover:shadow-xl transition-all duration-500">
                    <div className="relative z-10">
                        <h3 className="text-2xl font-medium mb-2">Multi-Tenant Workspaces</h3>
                        <p className="text-gray-500 max-w-sm">
                            Complete data isolation. Every client&apos;s API keys are AES-256 encrypted and scoped entirely to their dedicated workspace.
                        </p>
                    </div>
                    <motion.div
                        className="absolute -bottom-10 -right-10 w-64 h-64 bg-blue-50/50 rounded-full border border-blue-100 flex items-center justify-center"
                        whileHover={{ scale: 1.15, rotate: 10 }}
                        transition={{ type: "spring", stiffness: 200 }}
                    >
                        <div className="w-40 h-40 bg-white rounded-full shadow-sm border border-white flex items-center justify-center text-4xl">
                            🔒
                        </div>
                    </motion.div>
                </motion.div>

                {/* Feature 2 - Square Card */}
                <motion.div variants={fadeUp} className="bg-gray-900 text-white p-10 rounded-3xl shadow-lg flex flex-col justify-between hover:-translate-y-1 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
                    {/* Animated shine effect */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12"
                        initial={{ x: "-200%" }}
                        whileInView={{ x: "200%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
                    />
                    <div className="relative z-10">
                        <motion.div
                            whileHover={{ scale: 1.15, rotate: -10 }}
                            className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mb-6"
                        >
                            <span className="text-xl">⚡️</span>
                        </motion.div>
                        <h3 className="text-xl font-medium mb-2">Live Google Analytics Sync</h3>
                        <p className="text-gray-400 text-sm">
                            Our high-frequency core engine authenticates securely to pull live and accurate time-series data without rate limits.
                        </p>
                    </div>
                </motion.div>

                {/* Feature 3 - Square Card */}
                <motion.div variants={fadeUp} className="bg-white p-10 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex flex-col justify-between hover:-translate-y-1 hover:shadow-xl transition-all duration-500 group">
                    <div>
                        <motion.div
                            whileHover={{ scale: 1.15 }}
                            className="w-10 h-10 bg-gradient-to-br from-blue-50 to-purple-50 text-blue-500 rounded-full flex items-center justify-center mb-6 font-bold text-xs group-hover:bg-blue-100 transition-colors duration-300 border border-blue-100"
                        >
                            AI
                        </motion.div>
                        <h3 className="text-xl font-medium mb-2">Automated Strategy Insights</h3>
                        <p className="text-gray-500 text-sm">
                            Identify trends and anomalies in ad spend instantly. Let our predictive AI find the winning campaigns for your clients.
                        </p>
                    </div>
                </motion.div>

                {/* Feature 4 - Wide Card */}
                <motion.div variants={fadeUp} className="md:col-span-2 bg-gradient-to-r from-gray-50 to-white p-10 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex flex-col justify-center items-center text-center hover:-translate-y-1 hover:shadow-xl transition-all duration-500 overflow-hidden relative">
                    {/* Animated grid dots */}
                    <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                    <div className="relative z-10 w-full flex flex-col items-center">
                        <div className="flex items-center space-x-2 mb-4">
                            {["Google", "Meta", "LinkedIn"].map((platform, i) => (
                                <motion.div
                                    key={platform}
                                    initial={{ opacity: 0, scale: 0 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.3 + i * 0.15, type: "spring", stiffness: 300 }}
                                    className="px-3 py-1 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-600 shadow-sm"
                                >
                                    {platform}
                                </motion.div>
                            ))}
                        </div>
                        <h3 className="text-2xl font-medium mb-4">White-Labeled Dashboards</h3>
                        <p className="text-gray-500 mb-6 max-w-md">
                            Export beautiful reports directly to your clients with your own agency branding, URLs, and color schemes.
                        </p>
                    </div>
                </motion.div>

            </motion.div>
        </section>
    );
}
