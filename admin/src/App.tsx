import { createBrowserRouter, RouterProvider } from 'react-router';
import { Toaster } from '@/components/ui/sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminOnlyPage from './components/admin-only-page';
import Auth from './pages/auth';
import Wrapper from './components/wrapper';
import Home from './pages/home';
import Customers from './pages/customers';
import Admins from './pages/admins';
import Orders from './pages/orders';
import { UserContextProvider } from './providers/user-provider';

const queryClient = new QueryClient();
const router = createBrowserRouter([
  {
    path: '/auth',
    element: <Auth />,
  },
  {
    path: '/',
    element: <Wrapper />,
    children: [
      {
        path: '',
        element: <Home />,
      },
      {
        path: 'customers',
        element: (
          <AdminOnlyPage>
            <Customers />
          </AdminOnlyPage>
        ),
      },
      {
        path: 'users',
        element: (
          <AdminOnlyPage>
            <Admins />
          </AdminOnlyPage>
        ),
      },
      {
        path: 'orders',
        element: (
          <AdminOnlyPage>
            <Orders />
          </AdminOnlyPage>
        ),
      },
    ],
  },
]);

function App() {
  return (
    <>
      <UserContextProvider>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <Toaster />
        </QueryClientProvider>
      </UserContextProvider>
    </>
  );
}

export default App;
