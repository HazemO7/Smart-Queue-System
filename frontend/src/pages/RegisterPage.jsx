import { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FiUser, FiPhone, FiLock, FiUserPlus } from 'react-icons/fi';

function RegisterPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const { register, isLoading, error, clearError } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    // Client-side basic validation
    if (!name.trim() || !phone.trim() || !password) {
      return;
    }

    try {
      await register(name, phone, password);
      navigate('/clinics');
    } catch {
      // Error is already set in AuthContext
    }
  };

  return (
    <div className="auth-page py-5">
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={8} lg={5}>
            <div className="text-center mb-4">
              <div className="auth-icon-circle mx-auto mb-3">
                <FiUserPlus size={32} />
              </div>
              <h1 className="auth-title">{t('registerTitle')}</h1>
              <p className="text-muted">{t('registerSubtitle')}</p>
            </div>
            <Card className="auth-card border-0 shadow-sm">
              <Card.Body className="p-4">
                {error && (
                  <Alert variant="danger" dismissible onClose={clearError}>
                    {error}
                  </Alert>
                )}
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label className="form-label-lg">{t('fullName')}</Form.Label>
                    <div className="input-icon-wrapper">
                      <FiUser className="input-icon" size={20} />
                      <Form.Control
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="form-control-lg input-with-icon"
                        size="lg"
                        disabled={isLoading}
                        autoComplete="name"
                      />
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="form-label-lg">{t('phone')}</Form.Label>
                    <div className="input-icon-wrapper">
                      <FiPhone className="input-icon" size={20} />
                      <Form.Control
                        type="tel"
                        placeholder="01x-xxx-xxxx"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="form-control-lg input-with-icon"
                        size="lg"
                        disabled={isLoading}
                        autoComplete="tel"
                      />
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="form-label-lg">{t('password')}</Form.Label>
                    <div className="input-icon-wrapper">
                      <FiLock className="input-icon" size={20} />
                      <Form.Control
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="form-control-lg input-with-icon"
                        size="lg"
                        disabled={isLoading}
                        autoComplete="new-password"
                      />
                    </div>
                  </Form.Group>

                  <Button
                    type="submit"
                    size="lg"
                    className="btn-cta-primary w-100 mb-3"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        {t('signUp')}...
                      </>
                    ) : (
                      t('signUp')
                    )}
                  </Button>

                  <p className="text-center text-muted mb-0">
                    {t('haveAccount')}{' '}
                    <Link to="/login" className="auth-link">{t('signIn')}</Link>
                  </p>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}



export default RegisterPage;
