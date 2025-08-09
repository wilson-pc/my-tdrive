import { UserOutlined } from '@ant-design/icons'

import type { ItemType, MenuItemType } from 'antd/es/menu/interface'
import { Link } from 'react-router'

type MenuItem = ItemType<MenuItemType> & {
  roles?: string[]
}
export const menuItems: MenuItem[] = [
  {
    key: '/',
    icon: <UserOutlined />,
    label: <Link to='/'>Home</Link>
  }
]
