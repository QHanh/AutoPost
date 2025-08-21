import { Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { SolutionPage } from './pages/SolutionPage';
import { PostsPage } from './pages/PostsPage';
import { AccountsPage } from './pages/AccountsPage';
import { PricingPage } from './pages/PricingPage';
import { VideoPage } from './pages/VideoPage';
import { ChatbotPage } from './pages/ChatbotPage';
import ChatbotPageWithTabs from './pages/ChatbotPageWithTabs';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import { LoginCallbackPage } from './pages/LoginCallbackPage';
import { usePlatforms } from './hooks/usePlatforms';
import { usePosts } from './hooks/usePosts';
import { useAuth } from './hooks/useAuth';
import { ServiceManagementPage } from './pages/ServiceManagementPage';
import ApiIntegrationPage from './pages/ApiIntegrationPage';

import { ChatBot } from './components/ChatBot';
import { ZaloButton } from './components/ZaloButton';

function App() {
  const { 
    platforms, 
    accounts, 
    savedAccounts,
    isLoadingAccounts,
    getAccountsByPlatform,
    getSavedAccountsByPlatform,
    getSocialAccountId,
    loadSavedAccounts,
    removeAccountFromState,
  } = usePlatforms();
  
  const { 
    publishedPosts, 
    unpublishedPosts, 
    isLoadingPublished, 
    isLoadingUnpublished, 
    refreshPosts,
    updatePost,
    deletePost,
    retryPost
  } = usePosts();
  
  const { isLoading } = useAuth();
  
  const location = useLocation();
  const showChatButtons = location.pathname !== '/chatbot-tabs';

  // Only server accounts now
  const connectedAccounts = accounts.filter(acc => acc.connected);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải ứng dụng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        connectedCount={connectedAccounts.length}
        totalPosts={publishedPosts.length + unpublishedPosts.length}
      />

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/solution" element={<SolutionPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/login/callback" element={<LoginCallbackPage />} />
        
        
        {/* Protected routes */}
        <Route
          path="/services"
          element={
            <ProtectedRoute>
              <ServiceManagementPage />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/posts" 
          element={
            <ProtectedRoute>
              <PostsPage
                accounts={accounts}
                publishedPosts={publishedPosts}
                unpublishedPosts={unpublishedPosts}
                isLoadingPublished={isLoadingPublished}
                isLoadingUnpublished={isLoadingUnpublished}
                getSocialAccountId={getSocialAccountId}
                onRefreshPosts={refreshPosts}
                onUpdatePost={updatePost}
                onDeletePost={deletePost}
                onRetryPost={retryPost}
              />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/accounts" 
          element={
            <ProtectedRoute>
              <AccountsPage
                platforms={platforms}
                accounts={accounts}
                savedAccounts={savedAccounts}
                isLoadingAccounts={isLoadingAccounts}
                getAccountsByPlatform={getAccountsByPlatform}
                getSavedAccountsByPlatform={getSavedAccountsByPlatform}
                onReloadAccounts={(platformId) => loadSavedAccounts(platformId)}
                onAccountDeleted={removeAccountFromState}
              />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/video" 
          element={
            <ProtectedRoute>
              <VideoPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/chatbot" 
          element={
            <ProtectedRoute>
              <ChatbotPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/chatbot-tabs" 
          element={
            <ProtectedRoute>
              <ChatbotPageWithTabs />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/api-integration" 
          element={
            <ProtectedRoute>
              <ApiIntegrationPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
      
      {showChatButtons && <ZaloButton />}
      {showChatButtons && <ChatBot />}
    </div>
  );
}

export default App;