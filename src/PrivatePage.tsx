import { Navigate } from "react-router";
import { useAuth } from "./providers/AuthProvider";

// eslint-disable-next-line @typescript-eslint/no-explicit-any

export type PrivatePageProps = {
  page: React.ReactNode;
};
export const PrivatePage = ({ page }: PrivatePageProps) => {
  const { user } = useAuth();

  if (user === null) {
    return <Navigate to="/auth" />;
  }
  return page;
};
