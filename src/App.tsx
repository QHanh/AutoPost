import { Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { SolutionPage } from './pages/SolutionPage';
import { PostsPage } from './pages/PostsPage';
import { AccountsPage } from './pages/AccountsPage';
import { PricingPage } from './pages/PricingPage';
import { VideoPage } from './pages/VideoPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { usePlatforms } from './hooks/usePlatforms';
import { usePosts } from './hooks/usePosts';
import { useAuth } from './hooks/useAuth';

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
        
        
        {/* Protected routes */}
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
      </Routes>
      <ZaloButton />
      <ChatBot />
    </div>
  );
}

export default App;