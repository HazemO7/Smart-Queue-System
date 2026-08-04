import { Navbar as BSNavbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FiGlobe, FiLogOut, FiLogIn } from 'react-icons/fi';

function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { t, toggleLang, isRTL } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <BSNavbar expand="md" className="navbar-main shadow-sm sticky-top" bg="white" data-bs-theme="light">
      <Container>
        <BSNavbar.Brand as={Link} to="/" className="brand-logo d-flex align-items-center gap-2">
          <span className="brand-icon">🏥</span>
          <span className="brand-text fw-bold">{t('brand')}</span>
        </BSNavbar.Brand>
        <BSNavbar.Toggle aria-controls="main-nav" className="border-0" />
        <BSNavbar.Collapse id="main-nav">
          <Nav className={`${isRTL ? 'me-auto' : 'ms-auto'} align-items-center gap-2`}>
            <Nav.Link as={Link} to="/" className="nav-link-custom">{t('home')}</Nav.Link>
            {isAuthenticated && !isAdmin && (
              <Nav.Link as={Link} to="/clinics" className="nav-link-custom">{t('clinics')}</Nav.Link>
            )}
            {isAuthenticated && isAdmin && (
              <Nav.Link as={Link} to="/admin" className="nav-link-custom">{t('dashboard')}</Nav.Link>
            )}
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={toggleLang}
              className="lang-toggle d-flex align-items-center gap-1 rounded-pill"
            >
              <FiGlobe size={16} />
              {t('language')}
            </Button>
            {isAuthenticated ? (
              <Button
                variant="outline-danger"
                size="sm"
                onClick={handleLogout}
                className="d-flex align-items-center gap-1 rounded-pill"
              >
                <FiLogOut size={16} />
                {t('logout')}
              </Button>
            ) : (
              <Button
                as={Link}
                to="/login"
                variant="primary"
                className="btn-cta-sm d-flex align-items-center gap-1 rounded-pill"
              >
                <FiLogIn size={16} />
                {t('login')}
              </Button>
            )}
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
}

export default Navbar;
