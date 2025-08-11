import React, { useState } from 'react';
import { Form, Input, Button, Typography, Steps, message, Result } from 'antd';
import { MailOutlined, LockOutlined, KeyOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

const { Title } = Typography;
const { Step } = Steps;

const ForgotPasswordPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { forgotPassword, resetPassword } = useAuth();

  const handleSendCode = async (values: { email: string }) => {
    setLoading(true);
    const result = await forgotPassword(values.email);
    setLoading(false);
    if (result.success) {
      message.success(result.message);
      setEmail(values.email);
      setCurrentStep(1);
    } else {
      message.error(result.message);
    }
  };

  const handleResetPassword = async (values: { code: string; new_password: string }) => {
    setLoading(true);
    const result = await resetPassword(email, values.code, values.new_password);
    setLoading(false);
    if (result.success) {
      message.success(result.message);
      setCurrentStep(2);
    } else {
      message.error(result.message);
    }
  };

  const steps = [
    {
      title: 'Nhập Email',
      content: (
        <Form onFinish={handleSendCode} layout="vertical">
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: 'Vui lòng nhập email!' }, { type: 'email', message: 'Email không hợp lệ!' }]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Gửi mã xác thực
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      title: 'Đặt lại mật khẩu',
      content: (
        <Form onFinish={handleResetPassword} layout="vertical">
           <p>Một mã xác thực đã được gửi đến <strong>{email}</strong>. Vui lòng kiểm tra và nhập vào bên dưới.</p>
          <Form.Item
            name="code"
            label="Mã xác thực"
            rules={[{ required: true, message: 'Vui lòng nhập mã xác thực!' }]}
          >
            <Input prefix={<KeyOutlined />} placeholder="Mã xác thực" />
          </Form.Item>
          <Form.Item
            name="new_password"
            label="Mật khẩu mới"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới!' }, { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }]}
            hasFeedback
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu mới" />
          </Form.Item>
          <Form.Item
            name="confirm_password"
            label="Xác nhận mật khẩu mới"
            dependencies={['new_password']}
            hasFeedback
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
              ({ getFieldValue }) => ({
                validator(_: any, value: any) {
                  if (!value || getFieldValue('new_password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Hai mật khẩu không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Xác nhận mật khẩu mới" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Đặt lại mật khẩu
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
        title: 'Hoàn thành',
        content: (
            <Result
                status="success"
                title="Đặt lại mật khẩu thành công!"
                subTitle="Bây giờ bạn có thể đăng nhập bằng mật khẩu mới của mình."
                extra={[
                    <Button type="primary" key="login">
                        <Link to="/login">Đi đến trang Đăng nhập</Link>
                    </Button>,
                ]}
            />
        ),
    }
  ];

  return (
    <div style={{ maxWidth: 600, margin: '50px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <Title level={2} style={{ textAlign: 'center' }}>Quên mật khẩu</Title>
      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        {steps.map(item => <Step key={item.title} title={item.title} />)}
      </Steps>
      <div>{steps[currentStep].content}</div>
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <Link to="/login">Quay lại Đăng nhập</Link>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
