import { useState } from "react";
import {
  DownOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import {
  Button,
  Dropdown,
  Layout,
  Menu,
  Space,
  theme,
  type MenuProps,
} from "antd";
import { useAuth } from "../providers/AuthProvider";
import { useNavigate, useNavigation, useOutlet } from "react-router";
import { menuItems } from "./MenuItems";
const { Header, Content, Footer, Sider } = Layout;

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(true);
  const { user, handleLogout } = useAuth();
  const outlet = useOutlet();
  const router = useNavigate();

  const items: MenuProps["items"] = [
    {
      key: "3",
      label: "Logout",
      onClick: () => {
        handleLogout();
      },
    },
    {
      key: "4",
      label: "Login en el servidor",

      onClick: () => {
        router("/server-login");
      },
    },
  ];

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        trigger={null}
        collapsible
        collapsed={collapsed}
        onBreakpoint={(broken) => {
          console.log(broken);
        }}
        onCollapse={(collapsed, type) => {
          console.log(collapsed, type);
        }}
      >
        <div className="demo-logo-vertical" />
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={[`${location.pathname.split("/")[1]}`]}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: "16px",
                width: 64,
                height: 64,
              }}
            />

            <Dropdown
              menu={{ items }}
              trigger={["click"]}
              placement="bottomLeft"
            >
              <a
                type="text"
                style={{
                  fontSize: "16px",
                  paddingRight: 40,
                }}
                onClick={(e) => e.preventDefault()}
              >
                <Space>
                  {user?.displayName}
                  <DownOutlined />
                </Space>
              </a>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: "24px 16px 0" }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            {outlet}
          </div>
        </Content>
        <Footer style={{ textAlign: "center" }}>
          MY Tdrive ©{new Date().getFullYear()} Created wilson-pc
        </Footer>
      </Layout>
    </Layout>
  );
}
