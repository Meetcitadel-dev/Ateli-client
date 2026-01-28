import { useState } from 'react';
import { ProjectProvider, useProject } from '@/contexts/ProjectContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { OrdersPanel } from '@/components/orders/OrdersPanel';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { ProjectListScreen } from '@/components/home/ProjectListScreen';
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel';
import { WalletPanel } from '@/components/wallet/WalletPanel';
import { AnalyticsPanel } from '@/components/analytics/AnalyticsPanel';
import { ProjectConfigPanel } from '@/components/project/ProjectConfigPanel';
import { Project, Notification } from '@/types';

type TabType = 'chat' | 'orders' | 'settings' | 'wallet' | 'analytics' | 'project-config';
type ScreenType = 'project-list' | 'dashboard';

function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);
  const { setCurrentProject } = useProject();

  const handleSelectProject = (project: Project) => {
    setCurrentProject(project);
    setCurrentScreen('dashboard');
    setActiveTab('chat');
  };

  const handleCreateProject = () => {
    // Would open create project modal
    console.log('Create project');
  };

  const handleNotificationClick = (notification: Notification) => {
    setShowNotifications(false);
    if (notification.orderId) {
      setActiveTab('orders');
    }
  };

  if (currentScreen === 'project-list') {
    return (
      <ProjectListScreen 
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
      />
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onShowNotifications={() => setShowNotifications(true)}
        onBackToProjects={() => setCurrentScreen('project-list')}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'chat' && <ChatPanel />}
        {activeTab === 'orders' && <OrdersPanel />}
        {activeTab === 'settings' && <SettingsPanel />}
        {activeTab === 'wallet' && <WalletPanel />}
        {activeTab === 'analytics' && <AnalyticsPanel />}
        {activeTab === 'project-config' && <ProjectConfigPanel />}
      </main>

      {/* Notifications Panel */}
      {showNotifications && (
        <NotificationsPanel
          onClose={() => setShowNotifications(false)}
          onNotificationClick={handleNotificationClick}
        />
      )}
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
