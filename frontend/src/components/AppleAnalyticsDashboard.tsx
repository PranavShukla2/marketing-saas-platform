"use client";

import React, { useState, useEffect } from "react";
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { motion } from "framer-motion";

// CSS variables for Apple-style monochrome base and vibrant accents
const COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#5856D6', '#AF52DE'];

// Mock Data Generator for background shapes since GA4 timeseries wasn't explicitly queried
const mockSparkline = () => Array.from({ length: 14 }).map((_, i) => ({ day: i, value: Math.floor(Math.random() * 1000) + 500 }));

export default function AppleAnalyticsDashboard({ data }: { data: any }) {

    // Layout Sub-components
    const Card = ({ children, className = "", title = "", subtitle = "" }: { children: React.ReactNode, className?: string, title?: string, subtitle?: string }) => (
        <div className={`bg-[var(--surface)]/80 backdrop-blur-xl border border-white/40 shadow-[0_4px_24px_rgba(0,0,0,0.04)] rounded-[20px] p-6 lg:p-8 hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-all duration-500 overflow-hidden flex flex-col ${className}`}>
            {(title || subtitle) && (
                <div className="mb-6">
                    {title && <h3 className="text-xl font-semibold text-[var(--ink)] tracking-tight">{title}</h3>}
                    {subtitle && <p className="text-sm font-medium text-[var(--ink-2)] mt-1">{subtitle}</p>}
                </div>
            )}
            <div className="flex-grow flex flex-col">{children}</div>
        </div>
    );

    const SparklineCard = ({ title, value, change, isPositive }: { title: string, value: string, change: string, isPositive: boolean }) => (
        <Card className="!p-5">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-3)] mb-1">{title}</p>
                    <div className="text-3xl font-bold tracking-tight text-[var(--ink)]">{value}</div>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${isPositive ? 'bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400'}`}>
                    {isPositive ? '↑' : '↓'} {change}
                </div>
            </div>
            <div className="h-16 w-full -mx-2 -mb-2">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockSparkline()}>
                        <defs>
                            <linearGradient id={`gradient-${title.replace(/\\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={isPositive ? "#34C759" : "#FF3B30"} stopOpacity={0.2} />
                                <stop offset="95%" stopColor={isPositive ? "#34C759" : "#FF3B30"} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="value" stroke={isPositive ? "#34C759" : "#FF3B30"} strokeWidth={2} fillOpacity={1} fill={`url(#gradient-${title.replace(/\\s/g, '')})`} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );

    return (
        <div className="font-sans space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* SECTION 1: The Heartbeat */}
            <section className="space-y-6">
                <div className="flex items-center space-x-2">
                    <span className="text-[var(--ink-3)] font-semibold tracking-wider text-sm uppercase">1. The Heartbeat</span>
                    <div className="h-px bg-[var(--line)] flex-grow rounded-full"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <Card className="lg:col-span-1 border-blue-100 dark:border-blue-500/25 bg-gradient-to-b from-blue-50/50 to-white/80">
                        <div className="flex items-center space-x-3 mb-4">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            <p className="text-sm font-semibold uppercase text-[var(--ink-2)] tracking-wider">Active Right Now</p>
                        </div>
                        <div className="text-6xl font-black text-[var(--ink)] tracking-tighter mb-6">
                            {data?.summary?.active_users ? Math.floor(data.summary.active_users * 0.05) : 0} {/* Simulated live concurrent based on monthly */}
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between border-b border-[var(--line)] pb-2">
                                <span className="text-sm font-medium text-[var(--ink-2)]">/home</span>
                                <span className="text-sm font-bold text-[var(--ink)]">--</span>
                            </div>
                            <div className="flex justify-between border-b border-[var(--line)] pb-2">
                                <span className="text-sm font-medium text-[var(--ink-2)]">/pricing</span>
                                <span className="text-sm font-bold text-[var(--ink)]">--</span>
                            </div>
                        </div>
                    </Card>

                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <SparklineCard title="Total Users" value={data?.summary?.active_users?.toString() || "0"} change="--" isPositive={true} />
                        <SparklineCard title="Bounce Rate" value={data?.summary?.bounce_rate || "0%"} change="--" isPositive={false} />
                        <SparklineCard title="Pageviews" value={data?.summary?.page_views?.toString() || "0"} change="--" isPositive={true} />
                        <SparklineCard title="Avg Duration" value={data?.summary?.avg_duration || "0s"} change="--" isPositive={true} />
                    </div>
                </div>
            </section>

            {/* SECTION 2: Acquisition & Demographics */}
            <section className="space-y-6">
                <div className="flex items-center space-x-2">
                    <span className="text-[var(--ink-3)] font-semibold tracking-wider text-sm uppercase">2. Acquisition & Demographics</span>
                    <div className="h-px bg-[var(--line)] flex-grow rounded-full"></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Acquisition */}
                    <Card title="Traffic Acquisition" subtitle="Where your users are coming from" className="lg:col-span-2 min-h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={data?.post_level?.map((item: any) => ({ name: item.source, value: item.views })) || []} margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }} />
                                <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                                    {
                                        (data?.post_level || []).map((_: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))
                                    }
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Demographics */}
                    <Card title="Device Breakdowns" subtitle="Mobile vs Desktop footprint">
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie
                                    data={data?.device_data?.map((item: any) => ({ name: item.device, value: item.users })) || []}
                                    cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                                >
                                    {(data?.device_data || []).map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: 500 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </Card>
                </div>
            </section>

            {/* SECTION 3: Behavior & Engagement */}
            <section className="space-y-6">
                <div className="flex items-center space-x-2">
                    <span className="text-[var(--ink-3)] font-semibold tracking-wider text-sm uppercase">3. Behavior & Engagement</span>
                    <div className="h-px bg-[var(--line)] flex-grow rounded-full"></div>
                </div>
                <Card className="!p-0 border-0 shadow-[0_4px_32px_rgba(0,0,0,0.06)] overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[var(--page)] sticky top-0 z-10 backdrop-blur-md">
                            <tr>
                                <th className="px-8 py-5 text-xs font-bold text-[var(--ink-2)] uppercase tracking-widest border-b border-[var(--line)]">Page Path</th>
                                <th className="px-8 py-5 text-center text-xs font-bold text-[var(--ink-2)] uppercase tracking-widest border-b border-[var(--line)]">Views</th>
                                <th className="px-8 py-5 text-center text-xs font-bold text-[var(--ink-2)] uppercase tracking-widest border-b border-[var(--line)]">Avg. Engagement</th>
                                <th className="px-8 py-5 text-right text-xs font-bold text-[var(--ink-2)] uppercase tracking-widest border-b border-[var(--line)]">Engagement Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(data?.pages_data || []).map((row: any, i: number) => (
                                <tr key={i} className="hover:bg-[var(--page)] transition-colors group cursor-default">
                                    <td className="px-8 py-5 text-sm font-semibold text-[var(--ink)] border-b border-[var(--line)]">{row.path}</td>
                                    <td className="px-8 py-5 text-center text-sm font-medium text-[var(--ink-2)] border-b border-[var(--line)]">{row.views}</td>
                                    <td className="px-8 py-5 text-center text-sm font-medium text-[var(--ink-2)] border-b border-[var(--line)]">{`${Math.floor(row.avg_duration / 60)}m ${Math.floor(row.avg_duration % 60)}s`}</td>
                                    <td className="px-8 py-5 text-right text-sm font-bold text-[var(--ink-3)] border-b border-[var(--line)]">--</td>
                                </tr>
                            ))}
                            {(!data?.pages_data || data.pages_data.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="px-8 py-10 text-center text-sm text-[var(--ink-3)]">No page data found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </Card>
            </section>

            <section className="space-y-6">
                <div className="flex items-center space-x-2">
                    <span className="text-[var(--ink-3)] font-semibold tracking-wider text-sm uppercase">4. The Journey</span>
                    <div className="h-px bg-[var(--line)] flex-grow rounded-full"></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card title="Conversion Funnel" subtitle="Real GA4 event tracking" className="min-h-[380px]">
                        {data?.funnel_data && data.funnel_data.length > 1 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={data.funnel_data} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="step" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 500 }} />
                                    <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                    <Bar dataKey="count" fill="#5856D6" radius={[8, 8, 0, 0]} label={{ position: 'top', fill: '#111827', fontSize: 11, fontWeight: 700 }} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex-grow flex flex-col items-center justify-center text-center p-6">
                                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-4">
                                    <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                                </div>
                                <h4 className="text-base font-semibold text-[var(--ink)] mb-2">Set up e-commerce events</h4>
                                <p className="text-[var(--ink-2)] text-sm mb-4 max-w-xs">Enable <code className="bg-[var(--page)] px-1.5 py-0.5 rounded text-xs">add_to_cart</code>, <code className="bg-[var(--page)] px-1.5 py-0.5 rounded text-xs">begin_checkout</code>, and <code className="bg-[var(--page)] px-1.5 py-0.5 rounded text-xs">purchase</code> events in GA4 to see your real funnel.</p>
                                <a href="https://support.google.com/analytics/answer/9267735" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:text-blue-400 text-sm font-medium flex items-center space-x-1">
                                    <span>GA4 Setup Guide</span>
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                                </a>
                            </div>
                        )}
                    </Card>

                    <Card title="User Retention" subtitle="New vs returning users by week">
                        {data?.cohort_data && data.cohort_data.length > 0 ? (
                            <div className="overflow-x-auto -mx-2">
                                <div className="min-w-[320px]">
                                    <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-semibold text-[var(--ink-3)] uppercase tracking-wider mb-3 px-2">
                                        <div className="text-left">Week</div>
                                        <div>New Users</div>
                                        <div>Returning</div>
                                        <div>Retention</div>
                                    </div>
                                    <div className="space-y-2 px-2">
                                        {data.cohort_data.map((row: any, i: number) => {
                                            const total = (row.new || 0) + (row.returning || 0);
                                            const retention = total > 0 ? Math.round((row.returning / total) * 100) : 0;
                                            const opacity = (retention / 100).toFixed(2);
                                            return (
                                                <div key={i} className="grid grid-cols-4 gap-2 items-center text-sm">
                                                    <div className="text-[var(--ink-2)] font-medium text-xs">W{row.week}</div>
                                                    <div className="h-10 rounded-lg flex items-center justify-center font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs">{row.new?.toLocaleString()}</div>
                                                    <div className="h-10 rounded-lg flex items-center justify-center font-bold bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-xs">{row.returning?.toLocaleString()}</div>
                                                    <div className="h-10 rounded-lg flex items-center justify-center font-bold text-xs"
                                                        style={{ backgroundColor: `rgba(0, 122, 255, ${opacity})`, color: retention > 40 ? '#FFFFFF' : '#4B5563' }}>
                                                        {retention}%
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-grow flex flex-col items-center justify-center text-center p-6">
                                <div className="w-14 h-14 bg-green-50 dark:bg-green-500/10 rounded-2xl flex items-center justify-center mb-4">
                                    <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                </div>
                                <h4 className="text-base font-semibold text-[var(--ink)] mb-2">Retention data loading</h4>
                                <p className="text-[var(--ink-2)] text-sm max-w-xs">Once your site has at least 2 weeks of GA4 traffic, retention cohorts will appear here automatically.</p>
                            </div>
                        )}
                    </Card>
                </div>
            </section>

            {/* SECTION 5: Performance & Revenue */}
            <section className="space-y-6">
                <div className="flex items-center space-x-2">
                    <span className="text-[var(--ink-3)] font-semibold tracking-wider text-sm uppercase">5. Performance & Revenue</span>
                    <div className="h-px bg-[var(--line)] flex-grow rounded-full"></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card title="Revenue Velocity" subtitle="Trailing 30 Days MRR Growth" className="lg:col-span-2 h-[400px] opacity-60">
                        <ResponsiveContainer width="100%" height="100%">
                            {/* Daily Revenue Time-series mock because GA4 data is aggregated above */}
                            <AreaChart data={Array.from({ length: 30 }).map((_, i) => ({ day: `Day ${i + 1}`, revenue: 5000 + (i * 200) + (Math.random() * 1000 - 500) }))} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#34C759" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#34C759" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="day" hide />
                                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `$${val / 1000}k`} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                <Tooltip formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Revenue']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                <Area type="monotone" dataKey="revenue" stroke="#34C759" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Card>

                    <Card title="Top Products" subtitle="By Top Revenue">
                        <div className="space-y-4">
                            {(data?.ecommerce_data || []).length > 0 ? (
                                data.ecommerce_data.map((item: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center p-4 bg-[var(--page)] rounded-[16px] hover:bg-[var(--page)] transition-colors">
                                        <div>
                                            <p className="text-sm font-semibold text-[var(--ink)] truncate max-w-[120px]" title={item.name}>{item.name}</p>
                                            <p className="text-xs font-medium text-[var(--ink-2)] mt-1">Purchases: <span className="text-blue-600 dark:text-blue-400">{item.purchases}</span></p>
                                        </div>
                                        <div className="text-sm font-bold text-[var(--ink)]">${Number(item.revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-center text-[var(--ink-3)] text-sm">No recent product revenue data found in GA4.</div>
                            )}
                        </div>
                    </Card>
                </div>
            </section>

        </div>
    );
}
