import { useState } from 'react';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { OrdersPanel } from '@/components/orders/OrdersPanel';
import { SettingsPanel } from '@/components/settings/SettingsPanel';

type TabType = 'chat' | 'orders' | 'settings';

function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('chat');

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'chat' && <ChatPanel />}
        {activeTab === 'orders' && <OrdersPanel />}
        {activeTab === 'settings' && <SettingsPanel />}
      </main>
    </div>
  );
}

const Index = () => {
  return (
    <ProjectProvider>
      <Dashboard />
    </ProjectProvider>
  );
};

export default Index;
