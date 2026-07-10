import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useQueue } from '../../context/QueueContext';
import { FiUsers, FiClock, FiCheckCircle, FiCalendar } from 'react-icons/fi';

function BookingPage() {
  const { clinicId } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  
  const { 
    getClinic, 
    bookTicket, 
    patientTicket,
    availableAppointments,
    selectedAppointmentDate,
    setSelectedAppointmentDate,
    loadingAppointments,
    errors,
    fetchAvailableAppointments
  } = useQueue();
  
  const [booked, setBooked] = useState(false);
  const clinic = getClinic(clinicId);

  useEffect(() => {
    if (clinicId) {
      fetchAvailableAppointments(clinicId);
    }
  }, [clinicId, fetchAvailableAppointments]);

  if (!clinic) {
    return (
      <Container className="py-5 text-center">
        <h2>Clinic not found</h2>
      </Container>
    );
  }

  const handleBook = async () => {
    try {
      await bookTicket(clinicId, selectedAppointmentDate);
      setBooked(true);
    } catch (err) {
      // Error is caught and stored in QueueContext (errors.booking)
    }
  };

  const estimatedWait = clinic.queue.length * 7;

  // Helper to format date nicely
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0,0,0,0);
    date.setHours(0,0,0,0);
    
    if (date.getTime() === today.getTime()) return t('today') || 'Today';
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.getTime() === tomorrow.getTime()) return t('tomorrow') || 'Tomorrow';
    
    return date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      weekday: 'long', month: 'short', day: 'numeric'
    });
  };

  const renderAppointments = () => {
    if (loadingAppointments) {
      return (
        <div className="text-center py-4">
          <Spinner animation="border" variant="primary" />
          <p className="text-muted mt-2">Loading available appointments...</p>
        </div>
      );
    }
    
    if (errors.appointments) {
      return <Alert variant="danger">{errors.appointments}</Alert>;
    }
    
    if (availableAppointments.length === 0) {
      return (
        <Alert variant="info" className="text-center">
          No appointments are currently available.
        </Alert>
      );
    }

    return (
      <Row className="g-3 mb-4">
        {availableAppointments.map((appt) => {
          const isSelected = selectedAppointmentDate === appt.date;
          const isAvailable = appt.available !== false && appt.status !== 'Closed';
          const isFull = appt.capacity !== undefined && appt.booked !== undefined && appt.booked >= appt.capacity;
          const isDisabled = !isAvailable || isFull;

          return (
            <Col xs={12} sm={6} key={appt.date}>
              <Card 
                className={`appointment-card h-100 shadow-sm ${isSelected ? 'border-primary bg-primary-subtle' : ''} ${isDisabled ? 'opacity-50' : ''}`}
                onClick={() => !isDisabled && setSelectedAppointmentDate(appt.date)}
                style={{ cursor: isDisabled ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease' }}
              >
                <Card.Body className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className={`mb-1 d-flex align-items-center gap-2 ${isSelected ? 'text-primary fw-bold' : ''}`}>
                      <FiCalendar size={18} className={isSelected ? 'text-primary' : 'text-muted'} />
                      {formatDate(appt.date)}
                    </h5>
                    <div className={`small ${isSelected ? 'text-primary' : 'text-muted'}`}>
                      {isDisabled 
                        ? (isFull ? 'Fully Booked' : 'Closed') 
                        : (appt.capacity ? `${appt.capacity - (appt.booked || 0)} Slots Remaining` : 'Available')}
                    </div>
                  </div>
                  {isSelected && <FiCheckCircle size={24} className="text-primary" />}
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    );
  };

  return (
    <div className="booking-page py-4">
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} md={8} lg={6}>
            <div className="text-center mb-4">
              <span className="booking-clinic-icon">{clinic.icon}</span>
              <h1 className="page-title mt-2">
                {lang === 'ar' ? clinic.nameAr : clinic.name}
              </h1>
              <p className="text-muted">{t('bookingTitle')}</p>
            </div>

            <Card className="booking-info-card border-0 shadow-sm mb-4">
              <Card.Body className="p-4">
                <Row className="g-3 text-center">
                  <Col xs={6}>
                    <div className="info-stat">
                      <FiUsers size={24} className="text-primary mb-2" />
                      <div className="stat-value">{clinic.queue.length}</div>
                      <div className="stat-label text-muted small">{t('waitingPatients')}</div>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div className="info-stat">
                      <FiClock size={24} className="text-primary mb-2" />
                      <div className="stat-value">{estimatedWait} {t('minutes')}</div>
                      <div className="stat-label text-muted small">{t('estWaitTime')}</div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {!booked ? (
              <div className="booking-form-section">
                {errors.booking && <Alert variant="danger">{errors.booking}</Alert>}
                
                <h5 className="mb-3">Select Appointment</h5>
                {renderAppointments()}

                <Button
                  size="lg"
                  className="btn-cta-primary w-100 btn-confirm-booking"
                  onClick={handleBook}
                  disabled={!selectedAppointmentDate || loadingAppointments || availableAppointments.length === 0}
                >
                  {t('confirmBooking')}
                </Button>
              </div>
            ) : (
              <Card className="booking-success-card border-0 shadow-sm text-center">
                <Card.Body className="p-5">
                  <div className="success-icon-circle mx-auto mb-3">
                    <FiCheckCircle size={48} />
                  </div>
                  <h2 className="text-success mb-2">{t('bookingSuccess')}</h2>
                  <p className="text-muted mb-1">{t('yourTicket')}</p>
                  <div className="ticket-number-preview">{patientTicket?.ticketNumber}</div>
                  <Button
                    size="lg"
                    className="btn-cta-primary mt-3"
                    onClick={() => navigate('/ticket')}
                  >
                    {t('viewTicket')}
                  </Button>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default BookingPage;
