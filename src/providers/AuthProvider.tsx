import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from 'react'
import { Spin } from 'antd'
import type { User } from '@mtcute/web'
import { checkSignedIn, tg } from '../book/telegram'

interface ContextProps {
  user: User | null
  handleLogin: (_user: User) => void
  handleLogout: () => void
}
const AuthContext = createContext<ContextProps | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
interface Props {
  children?: ReactNode
}
const AuthProvider = ({ children }: Props) => {
  const [user, setUser] = useState<User | null |undefined>(undefined)

  useEffect(() => {
    checkSignedIn().then((data) => {
      console.log(data)
      if (data) {
        setUser(data)
      } else {
        setUser(null)
      }
    })
  }, [])
  const handleLogout = async () => {
    try {
      setUser(null)
      await tg.logOut()
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
    }
  }
  const handleLogin = (user: User) => {
    setUser(user)
  }

  if (user === undefined) {
    return <Spin fullscreen={true} />
  }

  return (
    <AuthContext.Provider value={{ user, handleLogout, handleLogin }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
