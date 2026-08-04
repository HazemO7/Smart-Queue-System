import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useQueue } from '../../context/QueueContext';
import { FiClock, FiUsers, FiArrowRight, FiArrowLeft, FiAlertCircle } from 'react-icons/fi';

function ClinicsPage() {
  const { t, lang, isRTL } = useLanguage();
  const { clinics, isLoading } = useQueue();
  const ArrowIcon = isRTL ? FiArrowLeft : FiArrowRight;

  return (
    <div className="clinics-page py-4">
      <Container>
        <div className="text-center mb-4">
          <h1 className="page-title">{t('clinicsTitle')}</h1>
          <p className="text-muted">{t('clinicsSubtitle')}</p>
        </div>
        <Row className="g-4">
          {isLoading ? (
            <>
              {[1, 2, 3].map((n) => (
                <Col xs={12} sm={6} lg={4} key={n}>
                  <Card className="clinic-card h-100 border-0 shadow-sm placeholder-wave">
                    <Card.Body className="p-4">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <span className="placeholder bg-secondary rounded-circle" style={{ width: '40px', height: '40px' }}></span>
                        <span className="placeholder col-3 rounded-pill bg-secondary"></span>
                      </div>
                      <h5 className="placeholder col-8 mb-2 bg-secondary d-block"></h5>
                      <p className="placeholder col-6 mb-4 bg-secondary d-block"></p>
                      <div className="d-flex flex-column gap-2 mb-4">
                        <span className="placeholder col-7 bg-secondary"></span>
                        <span className="placeholder col-5 bg-secondary"></span>
                      </div>
                      <Button variant="secondary" className="w-100 disabled placeholder" size="lg"></Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </>
          ) : clinics.length === 0 ? (
            <Col xs={12}>
              <Card className="border-0 shadow-sm py-5 text-center">
                <Card.Body>
                  <FiAlertCircle size={48} className="text-muted mb-3 opacity-50 mx-auto d-block" />
                  <h4 className="fw-bold mb-2">{t('noClinics') || 'No Clinics Available'}</h4>
                  <p className="text-muted mb-0">
                    {t('noClinicsDesc') || 'Please check back later for available clinics and appointment scheduling.'}
                  </p>
                </Card.Body>
              </Card>
            </Col>
          ) : (
            clinics.map((clinic) => {
              const isPaused = clinic.queueState === 'paused';
              return (
                <Col xs={12} sm={6} lg={4} key={clinic.id}>
                  <Card className={`clinic-card h-100 border-0 shadow-sm ${!clinic.isOpen && !isPaused ? 'clinic-closed' : ''}`}>
                    <Card.Body className="p-4 d-flex flex-column justify-content-between">
                      <div>
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <span className="clinic-icon">{clinic.icon || '🏥'}</span>
                          <Badge
                            bg={clinic.isOpen ? 'success' : isPaused ? 'warning' : 'secondary'}
                            className={`status-badge px-3 py-2 rounded-pill ${isPaused ? 'text-dark' : ''}`}
                          >
                            {clinic.isOpen ? t('open') : isPaused ? t('queuePaused') || 'Paused' : t('closed')}
                          </Badge>
                        </div>
                        <Card.Title className="clinic-name fw-bold mb-1">
                          {lang === 'ar' ? clinic.nameAr : clinic.name}
                        </Card.Title>
                        <p className="text-muted small mb-3">
                          {lang === 'ar' ? clinic.specialtyAr : clinic.specialty}
                        </p>
                        <div className="clinic-info d-flex flex-column gap-2 mb-4">
                          <div className="d-flex align-items-center gap-2 text-muted">
                            <FiClock size={16} />
                            <span className="small">{lang === 'ar' ? clinic.hoursAr : clinic.hours}</span>
                          </div>
                          {(clinic.isOpen || isPaused) && (
                            <div className="d-flex align-items-center gap-2 text-muted">
                              <FiUsers size={16} />
                              <span className="small">{clinic.queue.length} {t('patientsWaiting')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
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
                        ) : isPaused ? (
                          <Button
                            as={Link}
                            to={`/book/${clinic.id}`}
                            variant="warning"
                            className="w-100 d-flex align-items-center justify-content-center gap-2 text-dark fw-semibold"
                            size="lg"
                          >
                            {t('bookNow')} ({t('queuePaused') || 'Paused'})
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
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })
          )}
        </Row>
      </Container>
    </div>
  );
}

export default ClinicsPage;
