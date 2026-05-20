import Link from "next/link";
import { motion } from "framer-motion";

export default function Footer() {
    return (
        <footer className="w-full bg-gray-900 text-white pt-24 pb-12 border-t border-gray-800">
            <div className="max-w-6xl mx-auto px-6">

                {/* --- Top CTA Section --- */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-20">
                    <div className="mb-8 md:mb-0 text-center md:text-left">
                        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
                            Ready to scale your agency's analytics?
                        </h2>
                        <p className="text-gray-400 text-lg font-light max-w-lg">
                            Join leading marketing agencies building beautiful, real-time client dashboards on ArbFlow.
                        </p>
                    </div>
                    <Link href="/register">
                        <button className="px-8 py-4 bg-white text-black rounded-full font-medium text-lg hover:scale-105 transition-transform duration-300 shadow-xl">
                            Start Building Now
                        </button>
                    </Link>
                </div>

                {/* --- Divider --- */}
                <div className="w-full h-px bg-gray-800 mb-10"></div>

                {/* --- Bottom Credits Section --- */}
                <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-gray-500 font-medium">
                    <div className="flex items-center space-x-6 mb-4 sm:mb-0">
                        <p>
                            &copy; {new Date().getFullYear()} ArbFlow Systems. All rights reserved.
                        </p>
                        <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
                            About
                        </Link>
                    </div>

                    <div className="flex items-center space-x-1">
                        <span>Built with</span>
                        <svg
                            className="w-4 h-4 text-blue-500 mx-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                        <span>by</span>
                        <a
                            href="mailto:pranavmshukla"
                            className="ml-1 relative text-gray-300 hover:text-white transition-colors group"
                        >
                            Pranav Shukla
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400 group-hover:w-full transition-all duration-300"></span>
                        </a>
                    </div>
                </div>

            </div>
        </footer>
    );
}
