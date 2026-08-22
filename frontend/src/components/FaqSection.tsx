'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type FAQItem = {
    question: string;
    answer: string;
};

const faqs: FAQItem[] = [
    {
        question: "How do I connect my Google Analytics?",
        answer: "You can easily connect your Google Analytics account from the Integrations tab in your dashboard. We support secure OAuth for safe, 1-click connectivity without sharing your passwords."
    },
    {
        question: "Is my clients' data secure?",
        answer: "Yes, absolute security is our top priority. All data is encrypted at rest and in transit using industry-standard AES-256 encryption. We are also fully SOC2 Type II compliant."
    },
    {
        question: "Can I create custom reports for my clients?",
        answer: "Absolutely! Our drag-and-drop report builder allows you to select any metrics and dimensions to create fully white-labeled reports. You can even add your own agency's branding."
    },
    {
        question: "Do you offer real-time data tracking?",
        answer: "Yes, our platform syncs data in real-time or near real-time depending on the API limits of the connected data source, ensuring you always have the latest marketing insights."
    },
    {
        question: "What happens if I exceed my plan's data limits?",
        answer: "We'll never cut off your access unexpectedly. If you approach your limits, we'll notify you via email. You can then choose to upgrade your plan or opt for flexible overage pricing."
    }
];

const FaqItem = ({ item, isOpen, toggleOpen }: { item: FAQItem; isOpen: boolean; toggleOpen: () => void }) => {
    return (
        <div className="border border-[var(--line)] rounded-2xl bg-[var(--surface)] overflow-hidden">
            <button
                onClick={toggleOpen}
                className="flex justify-between items-center w-full px-5 py-4 text-left focus:outline-none"
                aria-expanded={isOpen}
            >
                <span className="font-medium text-[var(--ink)] text-base sm:text-lg">{item.question}</span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="ml-4 flex-shrink-0 text-[var(--ink-2)]"
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        {isOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        )}
                    </svg>
                </motion.div>
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                        <div className="px-5 pb-4 text-[var(--ink-2)] sm:text-base text-sm">
                            {item.answer}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function FaqSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const handleToggle = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section id="faq" className="py-20 bg-[var(--page)]">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-[-0.02em] text-[var(--ink)] sm:text-4xl">
                        Frequently Asked Questions
                    </h2>
                    <p className="mt-4 text-lg text-[var(--ink-2)]">
                        Everything you need to know about the product and billing.
                    </p>
                </div>
                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <FaqItem
                            key={index}
                            item={faq}
                            isOpen={openIndex === index}
                            toggleOpen={() => handleToggle(index)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
