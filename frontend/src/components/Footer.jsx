import { Container } from 'react-bootstrap';
import { useLanguage } from '../context/LanguageContext';

function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="footer-main py-4 mt-auto">
      <Container className="text-center">
        <p className="mb-1 text-muted small">{t('footerDesc')}</p>
        <p className="mb-0 text-muted small">{t('footerText')}</p>
      </Container>
    </footer>
  );
}

export default Footer;
