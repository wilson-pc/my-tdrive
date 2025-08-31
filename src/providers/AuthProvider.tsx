import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Spin } from "antd";
import type { User } from "@mtcute/web";
import { checkSignedIn, tg } from "../boot/telegram";
import { users, type DUser } from "../schemas";
import { db } from "../db";
import { eq } from "drizzle-orm";

interface ContextProps {
  user: User | null;
  dUser: DUser | null;
  handleLogin: (_user: User) => void;
  handleLogout: () => void;
}
const AuthContext = createContext<ContextProps | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
interface Props {
  children?: ReactNode;
}
const AuthProvider = ({ children }: Props) => {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [dUser, setDUser] = useState<DUser | null | undefined>(undefined);

  useEffect(() => {
    checkSignedIn().then(async (data) => {
      console.log(data);
      if (data) {
        const dUser = await db.query.users.findFirst({
          where: eq(users.externalId, data.id),
        });
        setDUser(dUser ?? null);
        setUser(data);
        setDUser(dUser ?? null);
      } else {
        setUser(null);
      }
    });
  }, []);
  const handleLogout = async () => {
    try {
      setUser(null);
      await tg.logOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  const handleLogin = async (user: User) => {
    const dUser = await db.query.users.findFirst({
      where: eq(users.externalId, user.id),
    });
    setDUser(dUser ?? null);
    setUser(user);
  };

  if (user === undefined) {
    return <Spin fullscreen={true} />;
  }

  return (
    <AuthContext.Provider
      value={{ user, handleLogout, handleLogin, dUser: dUser ?? null }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
