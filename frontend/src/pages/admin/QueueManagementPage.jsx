import { useState } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Toast, ToastContainer, Nav } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useQueue } from '../../context/QueueContext';
import { FiSkipForward, FiUsers, FiHash, FiCheckCircle, FiCalendar, FiPause, FiPlay } from 'react-icons/fi';
import AppointmentManagement from '../../components/admin/AppointmentManagement';

function QueueManagementPage() {
  const { clinicId } = useParams();
  const { t, lang } = useLanguage();
  const { getClinic, callNextPatient, pauseClinic, resumeClinic } = useQueue();
  const [showToast, setShowToast] = useState(false);
  const [calledNumber, setCalledNumber] = useState(null);
  const [activeTab, setActiveTab] = useState('queue');

  const clinic = getClinic(clinicId);

  if (!clinic) {
    return (
      <Container className="py-5 text-center">
        <h2>Clinic not found</h2>
      </Container>
    );
  }

  const isPaused = clinic.queueState === 'paused';

  const handleNext = () => {
    if (clinic.queue.length === 0 || isPaused) return;
    const nextNum = clinic.currentServing + 1;
    setCalledNumber(nextNum);
    callNextPatient(clinicId);
    setShowToast(true);
  };

  return (
    <div className="queue-management-page py-4">
      <Container>
        {/* Header */}
        <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
          <span className="fs-2">{clinic.icon || '🏥'}</span>
          <div className="flex-grow-1">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <h1 className="page-title mb-0">
                {lang === 'ar' ? clinic.nameAr : clinic.name}
              </h1>
              {isPaused && (
                <Badge bg="warning" text="dark" className="px-3 py-2 rounded-pill fs-6">
                  {t('queuePaused') || 'Paused'}
                </Badge>
              )}
            </div>
            <p className="text-muted mb-0">{t('queueManagement')}</p>
          </div>
        </div>

        {/* Tabs */}
        <Nav variant="pills" className="mb-4 gap-2 flex-wrap" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
          <Nav.Item>
            <Nav.Link eventKey="queue" className="d-flex align-items-center gap-2 rounded-pill px-4">
              <FiUsers size={16} />
              Queue
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="appointments" className="d-flex align-items-center gap-2 rounded-pill px-4">
              <FiCalendar size={16} />
              Appointments
            </Nav.Link>
          </Nav.Item>
        </Nav>

        {/* Queue Tab */}
        {activeTab === 'queue' && (
          <Row className="g-4">
            {/* Left: Currently Serving + Next Button + Pause/Resume */}
            <Col xs={12} lg={4}>
              {/* Currently Serving */}
              <Card className="currently-serving-card border-0 shadow-sm text-center mb-3">
                <Card.Body className="p-4">
                  <p className="text-muted mb-1">{t('currentlyServing')}</p>
                  <div className="serving-number">{clinic.currentServing}</div>
                  {isPaused && (
                    <div className="text-warning fw-semibold mt-2 small">
                      {t('queuePausedDesc') || 'Queue moving paused'}
                    </div>
                  )}
                </Card.Body>
              </Card>

              {/* NEXT PATIENT BUTTON - Massive */}
              <Button
                size="lg"
                className="btn-next-patient w-100 shadow-sm mb-3"
                onClick={handleNext}
                disabled={clinic.queue.length === 0 || isPaused || !clinic.isOpen}
              >
                <FiSkipForward size={28} />
                <span>{t('nextPatient')}</span>
              </Button>

              {/* Pause / Resume Shift Controls */}
              {clinic.queueId && (
                <div className="mb-3">
                  {isPaused ? (
                    <Button
                      variant="success"
                      size="lg"
                      className="w-100 d-flex align-items-center justify-content-center gap-2 rounded-pill shadow-sm"
                      onClick={() => resumeClinic(clinic.id)}
                    >
                      <FiPlay size={20} />
                      <span>{t('resumeQueue') || 'Resume Shift'}</span>
                    </Button>
                  ) : clinic.isOpen ? (
                    <Button
                      variant="warning"
                      size="lg"
                      className="w-100 d-flex align-items-center justify-content-center gap-2 rounded-pill shadow-sm text-dark fw-semibold"
                      onClick={() => pauseClinic(clinic.id)}
                    >
                      <FiPause size={20} />
                      <span>{t('pauseQueue') || 'Pause Shift'}</span>
                    </Button>
                  ) : null}
                </div>
              )}

              {/* Stats */}
              <Row className="g-2">
                <Col xs={6}>
                  <Card className="border-0 shadow-sm text-center">
                    <Card.Body className="p-3">
                      <FiUsers size={20} className="text-warning mb-1" />
                      <div className="fw-bold fs-5">{clinic.queue.length}</div>
                      <div className="text-muted small">{t('currentlyWaiting')}</div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={6}>
                  <Card className="border-0 shadow-sm text-center">
                    <Card.Body className="p-3">
                      <FiCheckCircle size={20} className="text-success mb-1" />
                      <div className="fw-bold fs-5">{clinic.served}</div>
                      <div className="text-muted small">{t('servedToday')}</div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Col>

            {/* Right: Queue List */}
            <Col xs={12} lg={8}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white border-bottom py-3">
                  <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                    <FiUsers size={18} />
                    {t('waitingList')} ({clinic.queue.length})
                  </h5>
                </Card.Header>
                <Card.Body className="p-0">
                  {clinic.queue.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <FiUsers size={40} className="mb-2 opacity-25" />
                      <p>{t('noPatients')}</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table hover className="mb-0 queue-table align-middle">
                        <thead>
                          <tr>
                            <th>{t('ticketNumber')}</th>
                            <th>{t('patientName')}</th>
                            <th>{t('timeJoined')}</th>
                            <th>{t('status')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clinic.queue.map((patient, index) => (
                            <tr key={patient.ticketNumber} className={index === 0 && !isPaused ? 'table-next-patient' : ''}>
                              <td>
                                <Badge bg="primary" className="px-3 py-2 rounded-pill">
                                  #{patient.ticketNumber}
                                </Badge>
                              </td>
                              <td className="fw-medium">
                                {lang === 'ar' ? patient.patientNameAr : patient.patientName}
                              </td>
                              <td className="text-muted small">{patient.timeJoined}</td>
                              <td>
                                <Badge bg={index === 0 && !isPaused ? 'warning' : 'light'} text={index === 0 && !isPaused ? 'dark' : 'muted'} className="px-3 py-2 rounded-pill">
                                  {isPaused ? (t('queuePaused') || 'Paused') : index === 0 ? t('nextPatient') : t('waiting')}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <AppointmentManagement clinicId={clinicId} />
        )}

        {/* Toast Notification */}
        <ToastContainer position="bottom-center" className="p-3" style={{ zIndex: 9999 }}>
          <Toast show={showToast} onClose={() => setShowToast(false)} delay={3000} autohide bg="success" className="text-white">
            <Toast.Body className="d-flex align-items-center gap-2 fs-6">
              <FiCheckCircle size={20} />
              {t('patientCalled')} #{calledNumber}
            </Toast.Body>
          </Toast>
        </ToastContainer>
      </Container>
    </div>
  );
}

export default QueueManagementPage;
