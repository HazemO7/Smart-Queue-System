import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useQueue } from '../../context/QueueContext';
import { FiClock, FiUsers, FiHash, FiCalendar } from 'react-icons/fi';

function TicketPage() {
  const { t, lang } = useLanguage();
  const { patientTicket, getClinic, getEstimatedWait, getPosition } = useQueue();
  const navigate = useNavigate();
  const [pulse, setPulse] = useState(false);

  const clinic = patientTicket ? getClinic(patientTicket.clinicId) : null;
  const position = patientTicket ? getPosition(patientTicket.clinicId, patientTicket.ticketNumber) : 0;
  const waitTime = patientTicket ? getEstimatedWait(patientTicket.clinicId, patientTicket.ticketNumber) : 0;
  
  // Date logic
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let isFuture = false;
  let formattedDate = '';
  const rawDate = patientTicket?.bookingDate || patientTicket?.appointmentDate;

  if (rawDate) {
    const bookingDate = new Date(rawDate);
    bookingDate.setHours(0, 0, 0, 0);
    isFuture = bookingDate.getTime() > today.getTime();
    
    if (bookingDate.getTime() === today.getTime()) {
      formattedDate = t('today') || 'Today';
    } else {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (bookingDate.getTime() === tomorrow.getTime()) {
        formattedDate = t('tomorrow') || 'Tomorrow';
      } else {
        formattedDate = bookingDate.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    }
  }

  const isYourTurn = !isFuture && position <= 1 && clinic;
  const currentServing = clinic?.currentServing || 0;

  // Calculate progress for the ring (0-100)
  const maxWait = 60; // max 60 minutes for full ring
  const progress = Math.max(0, Math.min(100, ((maxWait - waitTime) / maxWait) * 100));
  const circumference = 2 * Math.PI * 54; // radius 54
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Pulse animation when turn changes
  useEffect(() => {
    if (currentServing > 0 && !isFuture) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [currentServing, isFuture]);

  if (!patientTicket) {
    return (
      <Container className="py-5 text-center">
        <div className="empty-ticket">
          <span className="empty-ticket-icon">🎫</span>
          <h2>{t('ticketTitle')}</h2>
          <p className="text-muted">{t('noPatients')}</p>
        </div>
      </Container>
    );
  }

  return (
    <div className="ticket-page py-4">
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} md={8} lg={6}>
            {/* Clinic Name */}
            <div className="text-center mb-3">
              <span className="ticket-clinic-icon">{clinic?.icon}</span>
              <h2 className="ticket-clinic-name">
                {lang === 'ar' ? clinic?.nameAr || patientTicket.clinicNameAr : clinic?.name || patientTicket.clinicName}
              </h2>
            </div>

            {/* Main Ticket Card */}
            <Card className={`ticket-main-card border-0 shadow text-center ${isYourTurn ? 'ticket-your-turn' : ''} ${pulse ? 'ticket-pulse' : ''} mb-4`}>
              <Card.Body className="p-4 p-md-5">
                <div className="d-flex justify-content-center align-items-center gap-2 mb-3 text-primary bg-primary-subtle rounded-pill py-1 px-3 d-inline-flex mx-auto">
                  <FiCalendar size={16} />
                  <span className="fw-medium">{formattedDate}</span>
                </div>
                
                <p className="ticket-label text-muted mb-1">{t('yourNumber')}</p>
                <div className="ticket-number-massive">
                  {patientTicket.ticketNumber}
                </div>
                <Badge
                  bg={isYourTurn ? 'success' : 'primary'}
                  className="ticket-status-badge px-4 py-2 rounded-pill fs-6 mt-2"
                >
                  {isYourTurn ? t('yourTurn') : (patientTicket.status === 'Pending' ? t('pending') || 'Pending' : t('waiting'))}
                </Badge>
                {isYourTurn && (
                  <p className="text-success fw-semibold mt-3 mb-0 fs-5">
                    {t('goToCounter')}
                  </p>
                )}
                {!isYourTurn && !isFuture && (
                  <p className="text-muted mt-3 mb-0">
                    {t('pleaseWait')}
                  </p>
                )}
              </Card.Body>
            </Card>

            {/* Info Cards Row - Hidden if future booking */}
            {!isFuture ? (
              <Row className="g-3">
                {/* Now Serving */}
                <Col xs={12}>
                  <Card className="info-card border-0 shadow-sm">
                    <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-3">
                        <div className="info-card-icon bg-primary-subtle">
                          <FiHash size={20} className="text-primary" />
                        </div>
                        <div>
                          <div className="text-muted small">{t('nowServing')}</div>
                          <div className="fw-bold fs-4">{currentServing}</div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Position in Queue */}
                <Col xs={6}>
                  <Card className="info-card border-0 shadow-sm">
                    <Card.Body className="p-3 text-center">
                      <div className="info-card-icon-sm bg-info-subtle mx-auto mb-2">
                        <FiUsers size={18} className="text-info" />
                      </div>
                      <div className="text-muted small">{t('position')}</div>
                      <div className="fw-bold fs-4">{position}</div>
                      <div className="text-muted small">{t('inQueue')}</div>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Estimated Wait with Progress Ring */}
                <Col xs={6}>
                  <Card className="info-card border-0 shadow-sm">
                    <Card.Body className="p-3 text-center">
                      <div className="progress-ring-container mx-auto mb-2">
                        <svg className="progress-ring" width="64" height="64">
                          <circle
                            className="progress-ring-bg"
                            cx="32"
                            cy="32"
                            r="27"
                            fill="none"
                            stroke="#e8f4fd"
                            strokeWidth="5"
                          />
                          <circle
                            className="progress-ring-fill"
                            cx="32"
                            cy="32"
                            r="27"
                            fill="none"
                            stroke="#4A90D9"
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 27}
                            strokeDashoffset={2 * Math.PI * 27 - (progress / 100) * 2 * Math.PI * 27}
                            transform="rotate(-90 32 32)"
                          />
                        </svg>
                        <div className="progress-ring-text">
                          <FiClock size={16} className="text-primary" />
                        </div>
                      </div>
                      <div className="text-muted small">{t('estimatedWaitTime')}</div>
                      <div className="fw-bold fs-4">{waitTime}</div>
                      <div className="text-muted small">{t('minutes')}</div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            ) : (
              <Card className="info-card border-0 shadow-sm text-center">
                <Card.Body className="p-4">
                  <FiClock size={32} className="text-muted mb-3" />
                  <h5 className="mb-2">Queue Information Not Available Yet</h5>
                  <p className="text-muted mb-0">
                    Queue information will become available on your appointment day.
                  </p>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default TicketPage;
