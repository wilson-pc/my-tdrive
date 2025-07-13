import { createBrowserRouter } from "react-router";
import { AdminLayout } from "./layouts/adminLayout";
import Index from "./pages/drive";
import About from "./pages/drive/about";
import { AuthLayout } from "./layouts/authLayout";
import LoginPage from "./pages/auth";
import { PrivatePage } from "./PrivatePage";

export const router: ReturnType<typeof createBrowserRouter> =  createBrowserRouter([
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      {
        index:true,
        Component:LoginPage
      }
    ]
  },  
  {
      path: "/",
      element: <PrivatePage page={<AdminLayout />} />,
      children: [
        { index: true, Component: Index },
        { path: "about", Component: About },
      ],
    }
]);
