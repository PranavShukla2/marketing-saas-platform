import Link from "next/link";
import { motion } from "framer-motion";

export default function Footer() {
    return (
        <footer className="w-full bg-[#F5F5F7] text-[#1D1D1F] pt-24 pb-12 border-t border-[#E5E5E5]">
            <div className="max-w-6xl mx-auto px-6">

                {/* --- Top CTA Section --- */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-20">
                    <div className="mb-8 md:mb-0 text-center md:text-left">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.02em] mb-4">
                            Ready to scale your agency&apos;s analytics?
                        </h2>
                        <p className="text-[#6E6E73] text-lg font-light max-w-lg">
                            Join leading marketing agencies building beautiful, real-time client dashboards on ArbFlow.
                        </p>
                    </div>
                    <Link href="/register">
                        <button className="px-8 py-4 bg-[#0071E3] text-white rounded-full font-medium text-lg hover:scale-105 transition-transform duration-300 shadow-lg">
                            Start Building Now
                        </button>
                    </Link>
                </div>

                {/* --- Divider --- */}
                <div className="w-full h-px bg-[#E5E5E5] mb-10"></div>

                {/* --- Bottom Credits Section --- */}
                <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-[#6E6E73] font-medium">
                    <div className="flex items-center space-x-6 mb-4 sm:mb-0">
                        <p>
                            &copy; {new Date().getFullYear()} ArbFlow Systems. All rights reserved.
                        </p>
                        <Link href="/about" className="text-[#6E6E73] hover:text-[#1D1D1F] transition-colors">
                            About
                        </Link>
                        <Link href="/pricing" className="text-[#6E6E73] hover:text-[#1D1D1F] transition-colors">
                            Pricing
                        </Link>
                    </div>

                    <div className="flex items-center space-x-4">
                        <a
                            href="https://github.com/PranavShukla2"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="GitHub"
                            className="text-[#6E6E73] hover:text-[#1D1D1F] transition-colors"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.082-.73.082-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.808 1.304 3.49.997.108-.776.42-1.305.762-1.605-2.665-.303-5.467-1.332-5.467-5.93 0-1.31.468-2.382 1.235-3.222-.123-.303-.535-1.524.117-3.176 0 0 1.008-.323 3.3 1.23A11.5 11.5 0 0112 5.803c1.02.005 2.047.138 3.005.404 2.29-1.553 3.297-1.23 3.297-1.23.653 1.652.24 2.873.118 3.176.77.84 1.233 1.912 1.233 3.222 0 4.61-2.807 5.625-5.48 5.92.43.37.823 1.1.823 2.222 0 1.605-.015 2.896-.015 3.286 0 .322.216.696.825.578C20.565 21.795 24 17.298 24 12c0-6.63-5.37-12-12-12z" />
                            </svg>
                        </a>
                        <a
                            href="https://www.linkedin.com/in/pranav-shukla-softwaredeveloper"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="LinkedIn"
                            className="text-[#6E6E73] hover:text-[#1D1D1F] transition-colors"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                            </svg>
                        </a>
                    </div>
                </div>

            </div>
        </footer>
    );
}
