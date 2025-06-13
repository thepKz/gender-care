import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export interface AccordionItem {
  header: React.ReactNode;
  content: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  className?: string;
}

/**
 * Accordion – thay thế antd Collapse.
 */
const Accordion: React.FC<AccordionProps> = ({ items, className = '' }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setActiveIndex(prev => (prev === index ? null : index));
  };

  return (
    <div className={`divide-y divide-gray-200 rounded-xl bg-white shadow-md ${className}`}>
      {items.map((item, idx) => {
        const isOpen = idx === activeIndex;
        return (
          <div key={idx}>
            <button
              onClick={() => toggle(idx)}
              className="w-full flex items-center justify-between gap-3 text-left px-6 py-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0C3C54]"
            >
              <span className="font-medium text-gray-800">{item.header}</span>
              <ChevronDown
                className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden px-6 pb-4 text-gray-600"
                >
                  {item.content}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

export default Accordion; 