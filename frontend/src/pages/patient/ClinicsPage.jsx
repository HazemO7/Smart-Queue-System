import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useQueue } from '../../context/QueueContext';
import { FiClock, FiUsers, FiArrowRight, FiArrowLeft } from 'react-icons/fi';

function ClinicsPage() {
  const { t, lang, isRTL } = useLanguage();
  const { clinics } = useQueue();
  const ArrowIcon = isRTL ? FiArrowLeft : FiArrowRight;

  return (
    <div className="clinics-page py-4">
      <Container>
        <div className="text-center mb-4">
          <h1 className="page-title">{t('clinicsTitle')}</h1>
          <p className="text-muted">{t('clinicsSubtitle')}</p>
        </div>
        <Row className="g-4">
          {clinics.map(clinic => (
            <Col xs={12} sm={6} lg={4} key={clinic.id}>
              <Card className={`clinic-card h-100 border-0 shadow-sm ${!clinic.isOpen ? 'clinic-closed' : ''}`}>
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <span className="clinic-icon">{clinic.icon}</span>
                    <Badge
                      bg={clinic.isOpen ? 'success' : 'secondary'}
                      className="status-badge px-3 py-2 rounded-pill"
                    >
                      {clinic.isOpen ? t('open') : t('closed')}
                    </Badge>
                  </div>
                  <Card.Title className="clinic-name fw-bold mb-1">
                    {lang === 'ar' ? clinic.nameAr : clinic.name}
                  </Card.Title>
                  <p className="text-muted small mb-3">
                    {lang === 'ar' ? clinic.specialtyAr : clinic.specialty}
                  </p>
                  <div className="clinic-info d-flex flex-column gap-2 mb-3">
                    <div className="d-flex align-items-center gap-2 text-muted">
                      <FiClock size={16} />
                      <span className="small">{lang === 'ar' ? clinic.hoursAr : clinic.hours}</span>
                    </div>
                    {clinic.isOpen && (
                      <div className="d-flex align-items-center gap-2 text-muted">
                        <FiUsers size={16} />
                        <span className="small">{clinic.queue.length} {t('patientsWaiting')}</span>
                      </div>
                    )}
                  </div>
                  {clinic.isOpen ? (
                    <Button
                      as={Link}
                      to={`/book/${clinic.id}`}
                      className="btn-cta-primary w-100 d-flex align-items-center justify-content-center gap-2"
                      size="lg"
                    >
                      {t('bookNow')}
                      <ArrowIcon size={18} />
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      className="w-100"
                      size="lg"
                      disabled
                    >
                      {t('closed')}
                    </Button>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </div>
  );
}

export default ClinicsPage;
