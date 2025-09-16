import { useState } from 'react';
import type { Session } from '@shared/schema';

interface SidebarProps {
  session: Session | null;
  isConnected: boolean;
}

export function Sidebar({ session, isConnected }: SidebarProps) {
  const [activeTab, setActiveTab] = useState('dashboard');

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
    { id: 'consent', label: 'Consent Manager', icon: 'fas fa-shield-alt' },
    { id: 'opportunities', label: 'Opportunities', icon: 'fas fa-dollar-sign' },
    { id: 'actions', label: 'Actions', icon: 'fas fa-cogs' },
    { id: 'bridge', label: 'Device Bridge', icon: 'fas fa-mobile-alt' }
  ];

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center relative">
            <i className="fas fa-phone-alt text-primary-foreground"></i>
            {isConnected && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse"></div>
            )}
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Sovereign Phone Agent</h1>
            <p className="text-sm text-muted-foreground">Private Money Engine</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
            <span className="text-primary-foreground font-semibold text-lg">ED</span>
          </div>
          <div>
            <p className="font-medium text-foreground">El Dario Stephon Bernard Bey</p>
            <p className="text-sm text-muted-foreground">Sovereign Principal</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-md font-medium transition-colors ${
              activeTab === item.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            data-testid={`nav-${item.id}`}
          >
            <i className={`${item.icon} w-5`}></i>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* System Status */}
      <div className="p-4 border-t border-border">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">API Status</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-400">Online</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Voice Engine</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400">Ready</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Mobile Bridge</span>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-yellow-500'
              }`}></div>
              <span className={isConnected ? 'text-green-400' : 'text-yellow-400'}>
                {isConnected ? 'Connected' : 'Pending'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
