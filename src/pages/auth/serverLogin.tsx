import {
  ArrowLeftOutlined,
  KeyOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Form,
  Input,
  Spin,
  Typography,
} from "antd";
import { useState } from "react";
import { axios } from "../../boot/axios";
import { useAuth } from "../../providers/AuthProvider";
import type { OTPProps } from "antd/es/input/OTP";
import { useQuery } from "@tanstack/react-query";
const { Title } = Typography;

export default function ServerLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState("phone");
  const [code, setCode] = useState("");
  const [form] = Form.useForm();
  const { user } = useAuth();

  const { data, refetch } = useQuery<boolean | null>({
    queryKey: ["get-met", user?.id ?? 0, user?.id],
    queryFn: async () => {
      if (user) {
        const { data } = await axios.post("/auth/get-me", {
          externalId: user.id,
        });
        return data.success;
      } else {
        return false;
      }
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  });
  const handleServerLogin = async () => {
    try {
      setLoading(true);
      setError("");
      await axios.post("/auth/send-code", { phone: user?.phoneNumber });
      setStep("code");
      setLoading(false);
    } catch {
      setLoading(false);
      setError("ocurrió un error");
    }
  };

  const handleCodeSubmit = async () => {
    try {
      setLoading(true);
      setError("");
      await form.validateFields(["otpCode"]); // Validate the OTP field
      await axios.post("/auth/sign-in", {
        phone: user?.phoneNumber,
        code: code,
        externalId: user?.id,
      });
      setLoading(false);
      refetch();
    } catch (err: any) {
      setLoading(false);
      console.error("Error sending code:", err);
    }
  };
  const onChange: OTPProps["onChange"] = (text) => {
    console.log("onChange:", text);
    const isNumber = !isNaN(Number(text));
    if (!isNumber) {
      setError("El código debe ser un número");
    }
    setCode(text);
  };

  const onInput: OTPProps["onInput"] = (value: string[]) => {
    console.log("onInput:", value);
    const isAllNumber = value.every((v) => !isNaN(Number(v)));
    if (!isAllNumber) {
      setError("El código debe ser un número");
    }
  };
  const sharedProps: OTPProps = {
    onChange,
    onInput,
  };
  return (
    <div
      className="login-page-container"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#f0f2f5",
      }}
    >
      <Card
        style={{
          width: 400,
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        }}
        hoverable
      >
        {loading && (
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <Spin tip="Cargando..." />
          </div>
        )}

        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError("")}
            style={{ marginBottom: "16px" }}
          />
        )}
        {data === false && (
          <>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <Avatar
                size={64}
                icon={<UserOutlined />}
                style={{ backgroundColor: "#1890ff", marginBottom: "16px" }}
              />
              <Title level={3} style={{ margin: 0 }}>
                Telegram login en el servidor
              </Title>
              <Alert
                message="El login de servidor sirve para compartir archivos con otros y habilita las descargas directas"
                type="info"
              />
            </div>
            {step === "phone" && (
              <Button
                type="primary"
                onClick={() => handleServerLogin()}
                block
                loading={loading}
                icon={<KeyOutlined />}
              >
                Iniciar sesión
              </Button>
            )}

            {step === "code" && (
              <Form form={form} layout="vertical" onFinish={handleCodeSubmit}>
                <Form.Item
                  label={`Código de verificación enviado a ${user?.phoneNumber}`}
                  name="otpCode"
                  rules={[
                    {
                      required: true,
                      message: "Por favor, ingresa el código de verificación.",
                    },
                    { len: 5, message: "El código debe tener 5 dígitos." },
                    {
                      pattern: /^\d+$/,
                      message: "El código debe contener solo números.",
                    },
                  ]}
                >
                  <Input.OTP length={5} value={code} {...sharedProps} />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    loading={loading}
                    icon={<KeyOutlined />}
                  >
                    enviar Código
                  </Button>
                </Form.Item>

                <Form.Item>
                  <Button
                    block
                    onClick={() => {
                      setStep("phone");
                      setCode("");
                      setError(""); // Clear error when going back
                      form.resetFields(["otpCode"]); // Reset OTP field
                    }}
                    disabled={loading}
                    icon={<ArrowLeftOutlined />}
                  >
                    Volver
                  </Button>
                </Form.Item>
              </Form>
            )}
          </>
        )}
        {data === true && (
          <>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <Avatar
                size={64}
                icon={<UserOutlined />}
                style={{ backgroundColor: "#1890ff", marginBottom: "16px" }}
              />
              <Title level={3} style={{ margin: 0 }}>
                Ya tienes session en el servidor
              </Title>
            </div>
            {step === "phone" && (
              <Button
                type="primary"
                htmlType="submit"
                block
                color="red"
                loading={loading}
                icon={<KeyOutlined />}
              >
                Cerrar session
              </Button>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
