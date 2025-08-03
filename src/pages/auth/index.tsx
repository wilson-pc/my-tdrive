import { useMemo, useState } from 'react'
import { tg } from '../../book/telegram'
import { useAuth } from '../../providers/AuthProvider'
import { useNavigate } from 'react-router'
import {
  Alert,
  Avatar,
  Button,
  Card,
  Form,
  Input,
  Select,
  Space,
  Spin,
  Typography
} from 'antd'
import { flags } from '../../flags'
import type { OTPProps } from 'antd/es/input/OTP'
import { ArrowLeftOutlined, KeyOutlined, UserOutlined } from '@ant-design/icons'
import { db } from '../../db'
import { users } from '../../schemas'
import { createId } from '@paralleldrive/cuid2'
import { eq } from 'drizzle-orm'
const { Title, Text } = Typography
export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [phoneCode, setPhoneCode] = useState('+591')
  const [form] = Form.useForm()
  const [code, setCode] = useState('')
  const [step, setStep] = useState('phone') // 'phone', 'code', 'logged'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { handleLogin } = useAuth()
  const navigate = useNavigate()

  const handlePhoneSubmit = async (e: any) => {
    try {
      setLoading(true)
      setError('')
      await form.validateFields(['phoneNumber', 'phoneCode']) // Validate specific fields

      await tg.sendCode({
        phone: `${phoneCode}${phoneNumber}`.replace('+', '').trim()
      })
      setStep('code')
    } catch (err: any) {
      console.error('Error sending code:', err)
      // More specific error messages for form validation vs. API errors
      if (err.errorFields) {
        setError('Por favor, corrige los errores en el formulario.')
      } else {
        setError('Error al enviar el código. Verifica tu número de teléfono.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCodeSubmit = async (e: any) => {
    try {
      setLoading(true)
      setError('')
      await form.validateFields(['otpCode']) // Validate the OTP field

      const self = await tg.start({
        phone: `${phoneCode}${phoneNumber}`, // Ensure full phone number is sent
        code: code
      })

      const user = await db.query.users.findFirst({
        where: eq(users.externalId, self.id),
        columns: {
          id: true
        }
      })
      if (!user) {
        await db
          .insert(users)
          .values({
            id: createId(),
            externalId: self.id
          })
          .returning()
      }
      handleLogin(self)
      navigate('/')
      setStep('logged') // Though navigate will likely unmount the component
    } catch (err: any) {
      console.error('Error signing in:', err)
      if (err.errorFields) {
        setError('Por favor, introduce un código de verificación válido.')
      } else {
        setError(
          'Error al iniciar sesión. Verifica el código ingresado o tu número.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  const allFlags = useMemo(() => {
    const filtered = flags
      .filter((flags) => flags.dialCodes)
      .sort((a, b) => a.name.localeCompare(b.name))
    return filtered.map((flag) => {
      return {
        label: `${flag.dialCodes?.[0] ?? '0'}`,
        value: `${flag.dialCodes?.[0] ?? '0'}`,
        flag: flag.image
      }
    })
  }, [flags])

  const onChange: OTPProps['onChange'] = (text) => {
    console.log('onChange:', text)
    const isNumber = !isNaN(Number(text))
    if (!isNumber) {
      setError('El código debe ser un número')
    }
    setCode(text)
  }

  const onInput: OTPProps['onInput'] = (value: string[]) => {
    console.log('onInput:', value)
    const isAllNumber = value.every((v) => !isNaN(Number(v)))
    if (!isAllNumber) {
      setError('El código debe ser un número')
    }
  }

  const sharedProps: OTPProps = {
    onChange,
    onInput
  }
  return (
    <div
      className='login-page-container'
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f0f2f5'
      }}
    >
      <Card
        style={{
          width: 400,
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}
        hoverable
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Avatar
            size={64}
            icon={<UserOutlined />}
            style={{ backgroundColor: '#1890ff', marginBottom: '16px' }}
          />
          <Title level={3} style={{ margin: 0 }}>
            Telegram Login
          </Title>
          <Text type='secondary'>Inicia sesión para continuar</Text>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <Spin tip='Cargando...' />
          </div>
        )}

        {error && (
          <Alert
            message='Error'
            description={error}
            type='error'
            showIcon
            closable
            onClose={() => setError('')}
            style={{ marginBottom: '16px' }}
          />
        )}

        {step === 'phone' && (
          <Form
            form={form}
            layout='vertical'
            onFinish={handlePhoneSubmit} // Use onFinish for form submission
          >
            <Form.Item
              label='Número de teléfono'
              name='phoneNumber'
              rules={[
                {
                  required: true,
                  message: 'Por favor, ingresa tu número de teléfono.'
                },
                {
                  pattern: /^\d+$/,
                  message: 'El número debe contener solo dígitos.'
                }
              ]}
              tooltip='Ingresa tu número de teléfono sin el código de país.'
            >
              <Space.Compact style={{ width: '100%' }}>
                <Form.Item
                  name='phoneCode'
                  noStyle
                  initialValue='+591' // Set initial value for the select
                  rules={[
                    { required: true, message: 'Código de país requerido' }
                  ]}
                >
                  <Select
                    style={{ width: 200 }}
                    showSearch
                    optionFilterProp='label' // Filter by the label property
                    onChange={(value) => setPhoneCode(value)}
                    options={allFlags}
                    optionRender={(option) => (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {option.data.flag && (
                          <Avatar
                            shape='square'
                            src={option.data.flag}
                            style={{ marginRight: 8, width: 20, height: 15 }} // Adjusted size for flags
                          />
                        )}
                        {option.value}
                      </div>
                    )}
                  />
                </Form.Item>
                <Input
                  placeholder='Ej: 77778888'
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </Space.Compact>
            </Form.Item>

            <Form.Item>
              <Button
                type='primary'
                htmlType='submit'
                block
                loading={loading}
                icon={<KeyOutlined />}
              >
                Enviar código
              </Button>
            </Form.Item>
          </Form>
        )}

        {step === 'code' && (
          <Form form={form} layout='vertical' onFinish={handleCodeSubmit}>
            <Form.Item
              label={`Código de verificación enviado a ${phoneCode}${phoneNumber}`}
              name='otpCode'
              rules={[
                {
                  required: true,
                  message: 'Por favor, ingresa el código de verificación.'
                },
                { len: 5, message: 'El código debe tener 5 dígitos.' },
                {
                  pattern: /^\d+$/,
                  message: 'El código debe contener solo números.'
                }
              ]}
            >
              <Input.OTP length={5} value={code} {...sharedProps} />
            </Form.Item>

            <Form.Item>
              <Button
                type='primary'
                htmlType='submit'
                block
                loading={loading}
                icon={<KeyOutlined />}
              >
                Iniciar sesión
              </Button>
            </Form.Item>

            <Form.Item>
              <Button
                block
                onClick={() => {
                  setStep('phone')
                  setCode('')
                  setError('') // Clear error when going back
                  form.resetFields(['otpCode']) // Reset OTP field
                }}
                disabled={loading}
                icon={<ArrowLeftOutlined />}
              >
                Volver
              </Button>
            </Form.Item>
          </Form>
        )}
      </Card>
    </div>
  )
}
