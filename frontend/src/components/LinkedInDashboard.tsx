"use client";

import React from "react";
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const COLORS = ['#0A66C2', '#283E4A', '#56687A', '#8694A1', '#B6C0C9'];

const mockSparkline = () => Array.from({ length: 14 }).map((_, i) => ({ day: i, value: Math.floor(Math.random() * 100) + 50 }));

export default function LinkedInDashboard() {

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
                            <linearGradient id={`gradient-${title.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={isPositive ? "#0A66C2" : "#FF3B30"} stopOpacity={0.2} />
                                <stop offset="95%" stopColor={isPositive ? "#0A66C2" : "#FF3B30"} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="value" stroke={isPositive ? "#0A66C2" : "#FF3B30"} strokeWidth={2} fillOpacity={1} fill={`url(#gradient-${title.replace(/\s/g, '')})`} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );

    return (
        <div className="font-sans w-full relative space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="absolute -top-8 right-0 z-10 bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg shadow-sm border border-yellow-200">
                MOCK DATA
            </div>

            <div className="flex justify-between items-center mb-8">
                 <div>
                    <h2 className="text-2xl font-bold text-[var(--ink)] tracking-tight">Company Page Analytics</h2>
                    <p className="text-sm text-[var(--ink-2)] mt-1">Professional network performance</p>
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 rounded-xl border bg-[var(--surface)] text-[var(--ink-2)] border-[var(--line)] hover:shadow-sm hover:bg-[var(--page)] transition-all">
                    <svg className="w-4 h-4 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                    <span className="text-xs font-medium">Connect LinkedIn</span>
                </button>
            </div>

            {/* LinkedIn Overview KPIs */}
            <section className="space-y-6">
                <div className="flex items-center space-x-2">
                    <span className="text-[var(--ink-3)] font-semibold tracking-wider text-sm uppercase">1. Page KPIs</span>
                    <div className="h-px bg-[var(--line)] flex-grow rounded-full"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <SparklineCard title="Total Followers" value="8,450" change="4.1%" isPositive={true} />
                    <SparklineCard title="Page Views" value="2,140" change="12.5%" isPositive={true} />
                    <SparklineCard title="Unique Visitors" value="980" change="8.2%" isPositive={true} />
                    <SparklineCard title="Update Impressions" value="15.2k" change="2.3%" isPositive={false} />
                </div>
            </section>

            {/* LinkedIn Follower Growth */}
            <section className="space-y-6">
                <div className="flex items-center space-x-2">
                    <span className="text-[var(--ink-3)] font-semibold tracking-wider text-sm uppercase">2. Follower Growth</span>
                    <div className="h-px bg-[var(--line)] flex-grow rounded-full"></div>
                </div>
                <Card className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={Array.from({ length: 30 }).map((_, i) => ({ day: `Day ${i + 1}`, followers: 8000 + (i * 15) + (Math.random() * 20 - 10) }))} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorLiFollowers" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0A66C2" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#0A66C2" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="day" hide />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} domain={['dataMin - 100', 'dataMax + 100']} />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                            <Area type="monotone" dataKey="followers" stroke="#0A66C2" strokeWidth={3} fillOpacity={1} fill="url(#colorLiFollowers)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </Card>
            </section>

            {/* LinkedIn Content Engagement */}
            <section className="space-y-6">
                <div className="flex items-center space-x-2">
                    <span className="text-[var(--ink-3)] font-semibold tracking-wider text-sm uppercase">3. Content Performance</span>
                    <div className="h-px bg-[var(--line)] flex-grow rounded-full"></div>
                </div>
                <Card className="!p-0 border-0 shadow-[0_4px_32px_rgba(0,0,0,0.06)] overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#F5F5F7] sticky top-0 z-10 backdrop-blur-md">
                            <tr>
                                <th className="px-8 py-5 text-xs font-bold text-[var(--ink-2)] uppercase tracking-widest border-b border-[var(--line)]">Post Title</th>
                                <th className="px-8 py-5 text-center text-xs font-bold text-[var(--ink-2)] uppercase tracking-widest border-b border-[var(--line)]">Impressions</th>
                                <th className="px-8 py-5 text-center text-xs font-bold text-[var(--ink-2)] uppercase tracking-widest border-b border-[var(--line)]">Clicks</th>
                                <th className="px-8 py-5 text-center text-xs font-bold text-[var(--ink-2)] uppercase tracking-widest border-b border-[var(--line)]">CTR</th>
                                <th className="px-8 py-5 text-right text-xs font-bold text-[var(--ink-2)] uppercase tracking-widest border-b border-[var(--line)]">Engagement Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { title: "We are thrilled to announce our Q3 results...", imp: "4,250", clicks: "340", ctr: "8.0%", er: "12.4%" },
                                { title: "Hiring: Senior Software Engineer in NY...", imp: "3,820", clicks: "410", ctr: "10.7%", er: "15.1%" },
                                { title: "Our CEO's thoughts on the future of AI...", imp: "8,100", clicks: "650", ctr: "8.0%", er: "18.2%" },
                                { title: "Case Study: How Acme Corp increased ROI...", imp: "2,400", clicks: "180", ctr: "7.5%", er: "9.8%" },
                                { title: "Join us at the upcoming SaaS Summit...", imp: "1,900", clicks: "120", ctr: "6.3%", er: "8.5%" }
                            ].map((row, i) => (
                                <tr key={i} className="hover:bg-[var(--page)] transition-colors group cursor-default">
                                    <td className="px-8 py-5 text-sm font-semibold text-[var(--ink)] border-b border-[var(--line)] flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-blue-50 dark:bg-blue-500/10 rounded-md flex items-center justify-center text-[#0A66C2]">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" /></svg>
                                        </div>
                                        <span>{row.title}</span>
                                    </td>
                                    <td className="px-8 py-5 text-center text-sm font-medium text-[var(--ink)] border-b border-[var(--line)]">{row.imp}</td>
                                    <td className="px-8 py-5 text-center text-sm font-medium text-[var(--ink)] border-b border-[var(--line)]">{row.clicks}</td>
                                    <td className="px-8 py-5 text-center text-sm font-bold text-[#0A66C2] border-b border-[var(--line)]">{row.ctr}</td>
                                    <td className="px-8 py-5 text-right text-sm font-bold text-[var(--ink-2)] border-b border-[var(--line)]">{row.er}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            </section>

            {/* LinkedIn Demographics & Ads */}
            <section className="space-y-6">
                <div className="flex items-center space-x-2">
                    <span className="text-[var(--ink-3)] font-semibold tracking-wider text-sm uppercase">4. Demographics & Ads</span>
                    <div className="h-px bg-[var(--line)] flex-grow rounded-full"></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card title="Visitor Demographics" subtitle="By Job Function" className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={[
                                { name: 'Business Development', value: 35 },
                                { name: 'Engineering', value: 25 },
                                { name: 'Marketing', value: 20 },
                                { name: 'Sales', value: 15 },
                                { name: 'Operations', value: 5 },
                            ]} margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }} />
                                <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="value" fill="#0A66C2" radius={[0, 8, 8, 0]}>
                                    {
                                        COLORS.map((color, index) => (
                                            <Cell key={`cell-${index}`} fill={color} />
                                        ))
                                    }
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>

                    <Card title="Ad Campaign Performance" subtitle="Trailing 30 Days (Mock)">
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-[var(--page)] p-3 rounded-xl">
                                <p className="text-[10px] text-[var(--ink-2)] uppercase font-semibold">Total Spend</p>
                                <p className="text-xl font-bold">$2,850</p>
                            </div>
                            <div className="bg-[var(--page)] p-3 rounded-xl">
                                <p className="text-[10px] text-[var(--ink-2)] uppercase font-semibold">Leads Gen</p>
                                <p className="text-xl font-bold text-[#0A66C2]">145</p>
                            </div>
                            <div className="bg-[var(--page)] p-3 rounded-xl">
                                <p className="text-[10px] text-[var(--ink-2)] uppercase font-semibold">CPL</p>
                                <p className="text-xl font-bold">$19.65</p>
                            </div>
                        </div>
                        <div className="flex-grow">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={Array.from({ length: 14 }).map((_, i) => ({ day: i, spend: 150 + Math.random() * 100, leads: Math.floor(Math.random() * 15) }))}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="day" hide />
                                    <YAxis yAxisId="left" hide />
                                    <YAxis yAxisId="right" orientation="right" hide />
                                    <Tooltip />
                                    <Line yAxisId="left" type="monotone" dataKey="spend" stroke="#0A66C2" strokeWidth={2} dot={false} />
                                    <Line yAxisId="right" type="stepAfter" dataKey="leads" stroke="#34C759" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
            </section>

            {/* LinkedIn Deep Dive Metrics */}
            <section className="space-y-6">
                <div className="flex items-center space-x-2">
                    <span className="text-[var(--ink-3)] font-semibold tracking-wider text-sm uppercase">5. Network & Lead Generation</span>
                    <div className="h-px bg-[var(--line)] flex-grow rounded-full"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card title="Lead Forms" subtitle="Conversion Metrics">
                        <div className="flex items-end justify-between mt-4">
                            <div className="text-4xl font-bold text-[var(--ink)]">14.2%</div>
                            <div className="text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2 py-1 rounded-md">+2.1%</div>
                        </div>
                        <p className="text-xs text-[var(--ink-2)] mt-2 font-medium">Avg Completion Rate</p>
                        
                        <div className="mt-8 space-y-4">
                            <div>
                                <div className="flex justify-between text-xs text-[var(--ink-2)] mb-1"><span>Form Opens</span><span className="font-bold text-[var(--ink)]">1,021</span></div>
                                <div className="w-full h-2 bg-[var(--page)] rounded-full"><div className="w-[100%] h-full bg-[#0A66C2] rounded-full"></div></div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs text-[var(--ink-2)] mb-1"><span>Submissions</span><span className="font-bold text-[var(--ink)]">145</span></div>
                                <div className="w-full h-2 bg-[var(--page)] rounded-full"><div className="w-[14%] h-full bg-[#34C759] rounded-full"></div></div>
                            </div>
                        </div>
                    </Card>

                    <Card title="Brand Mentions" subtitle="Across LinkedIn Network">
                        <div className="flex items-end justify-between mt-4">
                            <div className="text-4xl font-bold text-[var(--ink)]">84</div>
                            <div className="text-sm font-medium text-[var(--ink-2)] bg-[var(--page)] px-2 py-1 rounded-md">Last 30 days</div>
                        </div>
                        <div className="h-32 mt-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={Array.from({length: 10}).map((_,i) => ({name: `W${i}`, mentions: Math.floor(Math.random() * 20) + 2}))}>
                                    <Bar dataKey="mentions" fill="#0A66C2" radius={[4,4,0,0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <Card title="Profile Views" subtitle="By Top Titles">
                        <div className="space-y-4 mt-4">
                            {[
                                { title: "Software Engineer", views: "340", pct: "85%" },
                                { title: "Product Manager", views: "210", pct: "60%" },
                                { title: "Founder / CEO", views: "145", pct: "40%" },
                                { title: "Marketing Director", views: "90", pct: "25%" }
                            ].map((job, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium text-[var(--ink-2)]">{job.title}</span>
                                        <span className="font-bold">{job.views}</span>
                                    </div>
                                    <div className="w-full bg-[var(--page)] rounded-full h-2 overflow-hidden">
                                        <div className="bg-[#0A66C2] h-full rounded-full" style={{ width: job.pct }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </section>
        </div>
    );
}
