import { createBrowserRouter } from "react-router";
import { AdminLayout } from "./layouts/adminLayout";
import Index from "./pages/drive";
import { AuthLayout } from "./layouts/authLayout";
import LoginPage from "./pages/auth";
import { PrivatePage } from "./PrivatePage";
import FilePage from "./pages/drive/file";

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
        { path: "file/:fileId", Component: FilePage },
      ],
    }
]);
