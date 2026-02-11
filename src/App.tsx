
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { OrderProvider } from "@/contexts/OrderContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { UserProvider } from "@/contexts/UserContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ViewProvider } from "@/contexts/ViewContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

import ProjectsPage from "./pages/Projects";
import DashboardLayout from "./layouts/DashboardLayout";
import ChatPage from "./pages/dashboard/Chat";
import { OrdersPanel } from "./components/orders/OrdersPanel";
import OrderDetailPage from "./pages/dashboard/OrderDetail";
import WalletPage from "./pages/dashboard/Wallet";
import AnalyticsPage from "./pages/dashboard/Analytics";
import ProjectConfigPage from "./pages/dashboard/ProjectConfig";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/auth/Login";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <UserProvider>
          <ProjectProvider>
            <OrderProvider>
              <ChatProvider>
                <ViewProvider>
                  <BrowserRouter>
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/login" element={<LoginPage />} />

                      {/* Protected Routes */}
                      <Route path="/" element={
                        <ProtectedRoute>
                          <Navigate to="/projects" replace />
                        </ProtectedRoute>
                      } />

                      <Route path="/projects" element={
                        <ProtectedRoute>
                          <ProjectsPage />
                        </ProtectedRoute>
                      } />

                      <Route path="/dashboard" element={
                        <ProtectedRoute>
                          <DashboardLayout />
                        </ProtectedRoute>
                      }>
                        <Route index element={<Navigate to="/dashboard/chat" replace />} />
                        <Route path="chat" element={<ChatPage />} />
                        <Route path="orders" element={<OrdersPanel />} />
                        <Route path="orders/:orderId" element={<OrderDetailPage />} />
                        <Route path="wallet" element={<WalletPage />} />
                        <Route path="analytics" element={<AnalyticsPage />} />
                        <Route path="project-settings" element={<ProjectConfigPage />} />
                      </Route>

                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </BrowserRouter>
                </ViewProvider>
              </ChatProvider>
            </OrderProvider>
          </ProjectProvider>
        </UserProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
