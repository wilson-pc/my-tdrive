import { Layout, Space, theme } from "antd";
import { useAuth } from "../providers/AuthProvider";
import { Link, useOutlet } from "react-router";
const { Header, Content, Footer } = Layout;

export function MixLayout() {
  const { user } = useAuth();
  const outlet = useOutlet();

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <Layout>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <Link to={`/`}>TDRIVE</Link> <Space>{user?.displayName}</Space>
          </div>
        </Header>
        <Content style={{ margin: "24px 16px 0" }}>{outlet}</Content>
        <Footer style={{ textAlign: "center" }}>
          Mi tdrive ©{new Date().getFullYear()} Created wilson-pc
        </Footer>
      </Layout>
    </Layout>
  );
}
