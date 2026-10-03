'use client';

import { useState, ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
}

/**
 * Tabs - Tabbed interface component
 * Manages tab state and renders active tab content
 */
export function Tabs({ tabs, defaultTab, onChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const activeContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <div>
      {/* Tab buttons */}
      <div className="flex gap-1 border-b border-line" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => handleTabChange(tab.id)}
            className={`whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === tab.id
                ? 'bg-ink text-paper'
                : 'text-ink-3 hover:bg-porcelain hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={activeTab}
        className="pt-4"
      >
        {activeContent}
      </div>
    </div>
  );
}
