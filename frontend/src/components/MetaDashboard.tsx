"use client";

import React, { useState } from "react";
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { motion, AnimatePresence } from "framer-motion";

const COLORS = ['#1877F2', '#4267B2', '#898F9C', '#CCD0D5', '#E1306C', '#F56040', '#FCAF45'];

const mockSparkline = () => Array.from({ length: 14 }).map((_, i) => ({ day: i, value: Math.floor(Math.random() * 1000) + 500 }));

export default function MetaDashboard() {
    const [subTab, setSubTab] = useState("facebook");

    // Layout Sub-components
    const Card = ({ children, className = "", title = "", subtitle = "" }: { children: React.ReactNode, className?: string, title?: string, subtitle?: string }) => (
        <div className={`bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_4px_24px_rgba(0,0,0,0.04)] rounded-[20px] p-6 lg:p-8 hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-all duration-500 overflow-hidden flex flex-col ${className}`}>
            {(title || subtitle) && (
                <div className="mb-6">
                    {title && <h3 className="text-xl font-semibold text-gray-900 tracking-tight">{title}</h3>}
                    {subtitle && <p className="text-sm font-medium text-gray-500 mt-1">{subtitle}</p>}
                </div>
            )}
            <div className="flex-grow flex flex-col">{children}</div>
        </div>
    );

    const SparklineCard = ({ title, value, change, isPositive, colorHint }: { title: string, value: string, change: string, isPositive: boolean, colorHint?: 'blue' | 'gradient' }) => {
        let strokeColor = isPositive ? "#34C759" : "#FF3B30";
        if (colorHint === 'blue') strokeColor = "#1877F2";
        else if (colorHint === 'gradient') strokeColor = "#E1306C"; // using pinkish from IG gradient

        return (
            <Card className="!p-5">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">{title}</p>
                        <div className="text-3xl font-bold tracking-tight text-gray-900">{value}</div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {isPositive ? '↑' : '↓'} {change}
                    </div>
                </div>
                <div className="h-16 w-full -mx-2 -mb-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={mockSparkline()}>
                            <defs>
                                <linearGradient id={`gradient-${title.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={strokeColor} stopOpacity={0.2} />
                                    <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="value" stroke={strokeColor} strokeWidth={2} fillOpacity={1} fill={`url(#gradient-${title.replace(/\s/g, '')})`} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        );
    };

    return (
        <div className="font-sans w-full relative">
            <div className="absolute top-0 right-0 z-10 bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg shadow-sm border border-yellow-200">
                MOCK DATA
            </div>

            <div className="flex justify-between items-center mb-8">
                <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200 w-max">
                    <button onClick={() => setSubTab("facebook")} className={`px-8 py-2 rounded-xl text-sm font-medium transition-all ${subTab === "facebook" ? "bg-white shadow-sm text-[#1877F2]" : "text-gray-500 hover:text-gray-800"}`}>
                        Facebook
                    </button>
                    <button onClick={() => setSubTab("instagram")} className={`px-8 py-2 rounded-xl text-sm font-medium transition-all ${subTab === "instagram" ? "bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] text-white shadow-sm" : "text-gray-500 hover:text-gray-800"}`}>
                        Instagram
                    </button>
                </div>

                <button className="flex items-center space-x-2 px-4 py-2 rounded-xl border bg-white text-gray-700 border-gray-200 hover:shadow-sm hover:bg-gray-50 transition-all">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2V7h2v10z" /></svg>
                    <span className="text-xs font-medium">Connect Meta Account</span>
                </button>
            </div>

            <AnimatePresence mode="wait">
                {subTab === "facebook" && (
                    <motion.div key="facebook" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                        {/* FB Overview */}
                        <section className="space-y-6">
                            <div className="flex items-center space-x-2">
                                <span className="text-gray-400 font-semibold tracking-wider text-sm uppercase">1. Page Overview</span>
                                <div className="h-px bg-gray-200 flex-grow rounded-full"></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <SparklineCard title="Page Likes" value="12,405" change="2.4%" isPositive={true} colorHint="blue" />
                                <SparklineCard title="Page Reach" value="45,210" change="14.1%" isPositive={true} />
                                <SparklineCard title="Post Engagements" value="8,920" change="5.2%" isPositive={false} />
                                <SparklineCard title="Page Followers" value="14,100" change="3.1%" isPositive={true} colorHint="blue" />
                            </div>
                        </section>

                        {/* FB Audience Growth */}
                        <section className="space-y-6">
                            <div className="flex items-center space-x-2">
                                <span className="text-gray-400 font-semibold tracking-wider text-sm uppercase">2. Audience Growth</span>
                                <div className="h-px bg-gray-200 flex-grow rounded-full"></div>
                            </div>
                            <Card className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={Array.from({ length: 30 }).map((_, i) => ({ day: `Day ${i + 1}`, followers: 13000 + (i * 35) + (Math.random() * 50 - 25) }))} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorFbFollowers" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#1877F2" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#1877F2" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="day" hide />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                        <Area type="monotone" dataKey="followers" stroke="#1877F2" strokeWidth={3} fillOpacity={1} fill="url(#colorFbFollowers)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </Card>
                        </section>

                        {/* FB Post Performance */}
                        <section className="space-y-6">
                            <div className="flex items-center space-x-2">
                                <span className="text-gray-400 font-semibold tracking-wider text-sm uppercase">3. Top Posts</span>
                                <div className="h-px bg-gray-200 flex-grow rounded-full"></div>
                            </div>
                            <Card className="!p-0 border-0 shadow-[0_4px_32px_rgba(0,0,0,0.06)] overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-[#F5F5F7] sticky top-0 z-10 backdrop-blur-md">
                                        <tr>
                                            <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-200">Post</th>
                                            <th className="px-8 py-5 text-center text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-200">Date</th>
                                            <th className="px-8 py-5 text-center text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-200">Reach</th>
                                            <th className="px-8 py-5 text-center text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-200">Engagements</th>
                                            <th className="px-8 py-5 text-right text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-200">Shares</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            { title: "Product Launch Announcem...", date: "Oct 12", reach: "12,450", engagements: "1,204", shares: "340" },
                                            { title: "Behind the scenes at HQ...", date: "Oct 10", reach: "9,820", engagements: "890", shares: "120" },
                                            { title: "New feature highlight ree...", date: "Oct 08", reach: "8,100", engagements: "760", shares: "85" },
                                            { title: "Customer spotlight: Acme...", date: "Oct 05", reach: "7,400", engagements: "650", shares: "45" },
                                            { title: "Weekly tips & tricks #4...", date: "Oct 01", reach: "6,200", engagements: "510", shares: "30" }
                                        ].map((row, i) => (
                                            <tr key={i} className="hover:bg-gray-50 transition-colors group cursor-default">
                                                <td className="px-8 py-5 text-sm font-semibold text-gray-900 border-b border-gray-100 flex items-center space-x-3">
                                                    <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center text-blue-600 text-xs">IMG</div>
                                                    <span>{row.title}</span>
                                                </td>
                                                <td className="px-8 py-5 text-center text-sm text-gray-500 border-b border-gray-100">{row.date}</td>
                                                <td className="px-8 py-5 text-center text-sm font-medium text-gray-900 border-b border-gray-100">{row.reach}</td>
                                                <td className="px-8 py-5 text-center text-sm font-medium text-[#1877F2] border-b border-gray-100">{row.engagements}</td>
                                                <td className="px-8 py-5 text-right text-sm font-medium text-gray-600 border-b border-gray-100">{row.shares}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </Card>
                        </section>

                        {/* FB Demographics & Ads */}
                        <section className="space-y-6">
                            <div className="flex items-center space-x-2">
                                <span className="text-gray-400 font-semibold tracking-wider text-sm uppercase">4. Demographics & Ads</span>
                                <div className="h-px bg-gray-200 flex-grow rounded-full"></div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card title="Audience Demographics" subtitle="Age Groups & Top Countries" className="h-[400px]">
                                    <div className="flex h-full">
                                        <div className="w-1/2 h-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={[
                                                        { name: "18-24", value: 15 }, { name: "25-34", value: 45 },
                                                        { name: "35-44", value: 25 }, { name: "45-54", value: 10 }, { name: "55+", value: 5 }
                                                    ]} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value">
                                                        {COLORS.map((color, index) => <Cell key={`cell-${index}`} fill={color} />)}
                                                    </Pie>
                                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="w-1/2 h-full pl-4 flex flex-col justify-center space-y-4">
                                            {[
                                                { country: "United States", pct: 42 },
                                                { country: "United Kingdom", pct: 18 },
                                                { country: "Canada", pct: 12 },
                                                { country: "Australia", pct: 8 }
                                            ].map(item => (
                                                <div key={item.country}>
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="font-medium">{item.country}</span>
                                                        <span className="text-gray-500">{item.pct}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                        <div className="bg-[#1877F2] h-1.5 rounded-full" style={{ width: `${item.pct}%` }}></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Card>

                                <Card title="Ad Campaign Performance" subtitle="Trailing 30 Days (Mock)">
                                    <div className="grid grid-cols-3 gap-4 mb-6">
                                        <div className="bg-gray-50 p-3 rounded-xl">
                                            <p className="text-[10px] text-gray-500 uppercase font-semibold">Total Spend</p>
                                            <p className="text-xl font-bold">$4,250</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-xl">
                                            <p className="text-[10px] text-gray-500 uppercase font-semibold">Impressions</p>
                                            <p className="text-xl font-bold">1.2M</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-xl">
                                            <p className="text-[10px] text-gray-500 uppercase font-semibold">ROAS</p>
                                            <p className="text-xl font-bold text-green-600">3.2x</p>
                                        </div>
                                    </div>
                                    <div className="flex-grow">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={Array.from({ length: 10 }).map((_, i) => ({ day: i, spend: 100 + Math.random() * 50, conversions: 5 + Math.random() * 10 }))}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                                <XAxis dataKey="day" hide />
                                                <YAxis yAxisId="left" hide />
                                                <YAxis yAxisId="right" orientation="right" hide />
                                                <Tooltip />
                                                <Line yAxisId="left" type="monotone" dataKey="spend" stroke="#FF3B30" strokeWidth={2} dot={false} />
                                                <Line yAxisId="right" type="monotone" dataKey="conversions" stroke="#34C759" strokeWidth={2} dot={false} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </Card>
                            </div>
                        </section>
                    </motion.div>
                )}

                {subTab === "instagram" && (
                    <motion.div key="instagram" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                        {/* IG Overview */}
                        <section className="space-y-6">
                            <div className="flex items-center space-x-2">
                                <span className="text-gray-400 font-semibold tracking-wider text-sm uppercase">1. Account Overview</span>
                                <div className="h-px bg-gray-200 flex-grow rounded-full"></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <SparklineCard title="Followers" value="45.2k" change="4.8%" isPositive={true} colorHint="gradient" />
                                <SparklineCard title="Accounts Reached" value="128k" change="22.4%" isPositive={true} />
                                <SparklineCard title="Impressions" value="450k" change="18.1%" isPositive={true} />
                                <SparklineCard title="Profile Visits" value="12.5k" change="1.2%" isPositive={false} colorHint="gradient" />
                            </div>
                        </section>

                        {/* IG Content Performance Grid */}
                        <section className="space-y-6">
                            <div className="flex items-center space-x-2">
                                <span className="text-gray-400 font-semibold tracking-wider text-sm uppercase">2. Recent Content</span>
                                <div className="h-px bg-gray-200 flex-grow rounded-full"></div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 group cursor-pointer hover:shadow-md transition-shadow">
                                        <div className="aspect-square bg-gradient-to-br from-pink-100 to-orange-100 rounded-xl mb-3 flex items-center justify-center relative overflow-hidden">
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                                                <div className="flex items-center text-white space-x-1"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg><span className="text-sm font-bold">{Math.floor(Math.random() * 500) + 100}</span></div>
                                                <div className="flex items-center text-white space-x-1"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" /></svg><span className="text-sm font-bold">{Math.floor(Math.random() * 50) + 5}</span></div>
                                            </div>
                                            <svg className="w-8 h-8 text-pink-300" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-1.96-2.36L6.5 17h11l-3.54-4.71z" /></svg>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* IG Stories Funnel & Reels */}
                        <section className="space-y-6">
                            <div className="flex items-center space-x-2">
                                <span className="text-gray-400 font-semibold tracking-wider text-sm uppercase">3. Formats Breakdown</span>
                                <div className="h-px bg-gray-200 flex-grow rounded-full"></div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card title="Stories Retention" subtitle="Average across active stories">
                                    <div className="flex-grow flex flex-col justify-center space-y-4">
                                        {[
                                            { label: "Impressions", value: 100, count: "4,500" },
                                            { label: "Taps Forward", value: 75, count: "3,375" },
                                            { label: "Taps Back", value: 20, count: "900" },
                                            { label: "Exits", value: 12, count: "540" }
                                        ].map((step, i) => (
                                            <div key={i} className="relative">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="font-medium text-gray-700">{step.label}</span>
                                                    <span className="font-bold">{step.count}</span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                                    <div className="bg-gradient-to-r from-[#FCAF45] to-[#E1306C] h-full rounded-full" style={{ width: `${step.value}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>

                                <Card title="Top Reels" subtitle="By Plays">
                                    <div className="space-y-3">
                                        {[
                                            { title: "Product Teaser", plays: "125k", likes: "12k" },
                                            { title: "Behind the Scenes", plays: "89k", likes: "8.5k" },
                                            { title: "Q&A Session", plays: "45k", likes: "4.2k" },
                                        ].map((reel, i) => (
                                            <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                                                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">{reel.title}</p>
                                                        <p className="text-xs text-gray-500">Plays: <span className="font-medium text-gray-900">{reel.plays}</span></p>
                                                    </div>
                                                </div>
                                                <div className="text-sm font-bold text-[#E1306C]">{reel.likes} ♡</div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        </section>

                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
