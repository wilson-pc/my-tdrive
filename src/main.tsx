import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { router } from './router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import '@ant-design/v5-patch-for-react-19'
import AuthProvider from './providers/AuthProvider'
import { DownloadManagerProvider } from './conexts/downloadConext'
import { DownloadFloatingPanel } from './FloatingPanel'
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchInterval: false
    }
  }
})
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          token: {
            // Seed Token
            colorPrimary: '#5b40bb',
            colorInfo: '#5b40bb',
            colorLink: '#000000'
          }
        }}
      >
        <AuthProvider>
          <DownloadManagerProvider>
            <RouterProvider router={router} />
            <DownloadFloatingPanel  />
          </DownloadManagerProvider>
        </AuthProvider>
      </ConfigProvider>
    </QueryClientProvider>
  </StrictMode>
)
