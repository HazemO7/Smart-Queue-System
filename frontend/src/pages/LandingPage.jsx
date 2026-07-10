import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { FiActivity, FiSmartphone, FiClock, FiArrowRight, FiArrowLeft } from 'react-icons/fi';

function LandingPage() {
  const { t, isRTL } = useLanguage();
  const { isAuthenticated, isAdmin } = useAuth();
  const ArrowIcon = isRTL ? FiArrowLeft : FiArrowRight;

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <Container>
          <Row className="align-items-center justify-content-center min-vh-75">
            <Col xs={12} md={8} lg={6} className="text-center">
              <div className="hero-badge mb-3">
                <span className="badge-dot"></span>
                Smart Queue System
              </div>
              <h1 className="hero-title mb-3">{t('heroTitle')}</h1>
              <p className="hero-subtitle mb-4">{t('heroSubtitle')}</p>
              <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
                {isAuthenticated ? (
                  <Button
                    as={Link}
                    to={isAdmin ? '/admin' : '/clinics'}
                    size="lg"
                    className="btn-cta-primary d-flex align-items-center justify-content-center gap-2"
                  >
                    {isAdmin ? t('dashboard') : t('bookTicket')}
                    <ArrowIcon size={20} />
                  </Button>
                ) : (
                  <>
                    <Button
                      as={Link}
                      to="/login"
                      size="lg"
                      className="btn-cta-primary d-flex align-items-center justify-content-center gap-2"
                    >
                      {t('getStarted')}
                      <ArrowIcon size={20} />
                    </Button>
                    <Button
                      as={Link}
                      to="/register"
                      size="lg"
                      variant="outline-primary"
                      className="btn-cta-secondary d-flex align-items-center justify-content-center gap-2"
                    >
                      {t('signUp')}
                    </Button>
                  </>
                )}
              </div>
            </Col>
          </Row>
        </Container>
        {/* Decorative elements */}
        <div className="hero-decoration">
          <div className="hero-circle hero-circle-1"></div>
          <div className="hero-circle hero-circle-2"></div>
          <div className="hero-circle hero-circle-3"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section py-5">
        <Container>
          <h2 className="section-title text-center mb-2">{t('featuresTitle')}</h2>
          <div className="section-divider mx-auto mb-5"></div>
          <Row className="g-4">
            <Col xs={12} md={4}>
              <Card className="feature-card h-100 border-0 text-center">
                <Card.Body className="p-4">
                  <div className="feature-icon-wrapper mb-3">
                    <FiActivity size={32} />
                  </div>
                  <Card.Title className="feature-card-title fw-semibold mb-2">{t('feature1Title')}</Card.Title>
                  <Card.Text className="feature-card-text text-muted">{t('feature1Desc')}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} md={4}>
              <Card className="feature-card h-100 border-0 text-center">
                <Card.Body className="p-4">
                  <div className="feature-icon-wrapper mb-3">
                    <FiSmartphone size={32} />
                  </div>
                  <Card.Title className="feature-card-title fw-semibold mb-2">{t('feature2Title')}</Card.Title>
                  <Card.Text className="feature-card-text text-muted">{t('feature2Desc')}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} md={4}>
              <Card className="feature-card h-100 border-0 text-center">
                <Card.Body className="p-4">
                  <div className="feature-icon-wrapper mb-3">
                    <FiClock size={32} />
                  </div>
                  <Card.Title className="feature-card-title fw-semibold mb-2">{t('feature3Title')}</Card.Title>
                  <Card.Text className="feature-card-text text-muted">{t('feature3Desc')}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Bottom CTA */}
      <section className="cta-section py-5">
        <Container className="text-center">
          <div className="cta-card p-5 rounded-4">
            <h2 className="cta-title mb-3">{t('heroTitle')}</h2>
            <p className="cta-subtitle mb-4 text-muted">{t('heroSubtitle')}</p>
            <Button
              as={Link}
              to={isAuthenticated ? '/clinics' : '/login'}
              size="lg"
              className="btn-cta-primary d-flex align-items-center justify-content-center gap-2 mx-auto"
            >
              {t('getStarted')}
              <ArrowIcon size={20} />
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
}

export default LandingPage;
