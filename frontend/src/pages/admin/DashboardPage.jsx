import { Container, Row, Col, Card, Badge, Button, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useQueue } from '../../context/QueueContext';
import { FiUsers, FiCheckCircle, FiActivity, FiSettings } from 'react-icons/fi';

function DashboardPage() {
  const { t, lang } = useLanguage();
  const { clinics, toggleClinic } = useQueue();

  const totalWaiting = clinics.reduce((sum, c) => sum + c.queue.length, 0);
  const totalServed = clinics.reduce((sum, c) => sum + c.served, 0);
  const totalToday = totalWaiting + totalServed;

  return (
    <div className="admin-page py-4">
      <Container>
        <div className="mb-4">
          <h1 className="page-title">{t('adminTitle')}</h1>
        </div>

        {/* Stats Cards */}
        <Row className="g-3 mb-4">
          <Col xs={12} sm={4}>
            <Card className="stat-card border-0 shadow-sm">
              <Card.Body className="p-3 d-flex align-items-center gap-3">
                <div className="stat-icon-circle bg-primary-subtle">
                  <FiActivity size={24} className="text-primary" />
                </div>
                <div>
                  <div className="text-muted small">{t('totalToday')}</div>
                  <div className="fw-bold fs-3">{totalToday}</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} sm={4}>
            <Card className="stat-card border-0 shadow-sm">
              <Card.Body className="p-3 d-flex align-items-center gap-3">
                <div className="stat-icon-circle bg-warning-subtle">
                  <FiUsers size={24} className="text-warning" />
                </div>
                <div>
                  <div className="text-muted small">{t('currentlyWaiting')}</div>
                  <div className="fw-bold fs-3">{totalWaiting}</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} sm={4}>
            <Card className="stat-card border-0 shadow-sm">
              <Card.Body className="p-3 d-flex align-items-center gap-3">
                <div className="stat-icon-circle bg-success-subtle">
                  <FiCheckCircle size={24} className="text-success" />
                </div>
                <div>
                  <div className="text-muted small">{t('servedToday')}</div>
                  <div className="fw-bold fs-3">{totalServed}</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Clinics Management */}
        <h2 className="section-subtitle mb-3">{t('manageQueues')}</h2>
        <Row className="g-3">
          {clinics.map(clinic => (
            <Col xs={12} md={6} key={clinic.id}>
              <Card className="admin-clinic-card border-0 shadow-sm">
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="fs-4">{clinic.icon}</span>
                      <div>
                        <h5 className="mb-0 fw-bold">
                          {lang === 'ar' ? clinic.nameAr : clinic.name}
                        </h5>
                        <small className="text-muted">
                          {lang === 'ar' ? clinic.specialtyAr : clinic.specialty}
                        </small>
                      </div>
                    </div>
                    <Form.Check
                      type="switch"
                      id={`switch-${clinic.id}`}
                      checked={clinic.isOpen}
                      onChange={() => toggleClinic(clinic.id)}
                      className="clinic-toggle"
                    />
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex gap-3">
                      <Badge bg={clinic.isOpen ? 'success' : 'secondary'} className="px-3 py-2 rounded-pill">
                        {clinic.isOpen ? t('open') : t('closed')}
                      </Badge>
                      <span className="text-muted small d-flex align-items-center gap-1">
                        <FiUsers size={14} />
                        {clinic.queue.length} {t('patientsWaiting')}
                      </span>
                    </div>
                    <Button
                      as={Link}
                      to={`/admin/queue/${clinic.id}`}
                      variant="outline-primary"
                      size="sm"
                      className="rounded-pill px-3"
                    >
                      <FiSettings size={14} className="me-1" />
                      {t('manageQueue')}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </div>
  );
}

export default DashboardPage;
