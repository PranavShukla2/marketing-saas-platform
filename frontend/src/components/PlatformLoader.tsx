"use client";

import { motion } from "framer-motion";

const platformConfig: Record<string, { name: string; color: string; gradient: string; icon: React.ReactNode }> = {
  google: {
    name: "Google Analytics",
    color: "#4285F4",
    gradient: "from-blue-500 via-green-400 to-yellow-400",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    )
  },
  meta: {
    name: "Meta Business Suite",
    color: "#1877F2",
    gradient: "from-blue-600 via-indigo-500 to-purple-500",
    icon: (
      <svg className="w-10 h-10" fill="#1877F2" viewBox="0 0 24 24">
        <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z" />
      </svg>
    )
  },
  linkedin: {
    name: "LinkedIn Analytics",
    color: "#0A66C2",
    gradient: "from-sky-600 via-blue-600 to-indigo-600",
    icon: (
      <svg className="w-10 h-10" fill="#0A66C2" viewBox="0 0 24 24">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
      </svg>
    )
  }
};

export default function PlatformLoader({ platform }: { platform: string }) {
  const config = platformConfig[platform] || platformConfig.google;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/95 backdrop-blur-xl"
    >
      {/* Animated rings */}
      <div className="relative flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [0.8, 1.2, 1], opacity: [0, 0.3, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
          className={`absolute w-32 h-32 rounded-full bg-gradient-to-r ${config.gradient}`}
          style={{ filter: 'blur(20px)' }}
        />
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: [0.5, 1.1, 0.9, 1], opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          className="relative z-10 w-20 h-20 bg-white rounded-3xl shadow-2xl flex items-center justify-center"
        >
          {config.icon}
        </motion.div>
      </div>

      {/* Platform name */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 text-lg font-semibold text-gray-900 tracking-tight"
      >
        {config.name}
      </motion.p>

      {/* Loading bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-4 w-48 h-1 bg-gray-100 rounded-full overflow-hidden"
      >
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className={`h-full w-1/2 rounded-full bg-gradient-to-r ${config.gradient}`}
        />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-3 text-xs text-gray-400 font-medium"
      >
        Loading dashboard...
      </motion.p>
    </motion.div>
  );
}
