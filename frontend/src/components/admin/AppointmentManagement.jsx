import { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Alert, Spinner, Badge, Table } from 'react-bootstrap';
import { useLanguage } from '../../context/LanguageContext';
import { useQueue } from '../../context/QueueContext';
import { FiCalendar, FiPlus, FiTrash2, FiToggleLeft, FiToggleRight, FiCheckCircle } from 'react-icons/fi';

function AppointmentManagement({ clinicId }) {
  const { t, lang } = useLanguage();
  const {
    adminAppointments,
    loadingAdminAppointments,
    errors,
    fetchAdminAppointments,
    createAppointment,
    toggleAppointmentStatus,
    deleteAppointment,
  } = useQueue();

  const [newDate, setNewDate] = useState('');
  const [newCapacity, setNewCapacity] = useState('');
  const [creating, setCreating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (clinicId) {
      fetchAdminAppointments(clinicId);
    }
  }, [clinicId, fetchAdminAppointments]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setSuccessMsg('');
    try {
      await createAppointment(clinicId, newDate, newCapacity);
      setNewDate('');
      setNewCapacity('');
      setSuccessMsg('Appointment created successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      // Error stored in errors.adminAppointments by QueueContext
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (appointmentId, currentStatus) => {
    const newStatus = currentStatus === 'Open' ? 'Closed' : 'Open';
    try {
      await toggleAppointmentStatus(clinicId, appointmentId, newStatus);
    } catch (err) {
      // Error stored in errors.adminAppointments
    }
  };

  const handleDelete = async (appointmentId) => {
    try {
      await deleteAppointment(clinicId, appointmentId);
    } catch (err) {
      // Error stored in errors.adminAppointments
    }
  };

  // Format date nicely
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date.getTime() === todayDate.getTime()) return t('today') || 'Today';

    const tomorrow = new Date(todayDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.getTime() === tomorrow.getTime()) return t('tomorrow') || 'Tomorrow';

    return date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  // --- Render ---

  if (loadingAdminAppointments) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="text-muted mt-2">Loading appointments...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Error Alert */}
      {errors.adminAppointments && (
        <Alert variant="danger" className="mb-3">
          {errors.adminAppointments}
        </Alert>
      )}

      {/* Success Alert */}
      {successMsg && (
        <Alert variant="success" className="mb-3 d-flex align-items-center gap-2">
          <FiCheckCircle /> {successMsg}
        </Alert>
      )}

      {/* Create Appointment Form */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-white border-bottom py-3">
          <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
            <FiPlus size={18} />
            Create Appointment
          </h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleCreate}>
            <Row className="g-3 align-items-end">
              <Col xs={12} sm={5}>
                <Form.Group>
                  <Form.Label className="fw-medium small">Appointment Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={newDate}
                    min={today}
                    onChange={(e) => setNewDate(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={4}>
                <Form.Group>
                  <Form.Label className="fw-medium small">Max Capacity</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="e.g. 30"
                    min="1"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={3}>
                <Button
                  type="submit"
                  className="btn-cta-primary w-100"
                  disabled={creating || !newDate}
                >
                  {creating ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <>
                      <FiPlus className="me-1" /> Create
                    </>
                  )}
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Appointment List */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-bottom py-3">
          <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
            <FiCalendar size={18} />
            Appointment Dates ({adminAppointments.length})
          </h5>
        </Card.Header>
        <Card.Body className="p-0">
          {adminAppointments.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <FiCalendar size={40} className="mb-2 opacity-25" />
              <p>No appointment dates created yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0 queue-table align-middle">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Bookings</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminAppointments.map((appt) => {
                    const hasBookings = (appt.booked || 0) > 0;
                    const isOpen = appt.status === 'Open';
                    const remaining =
                      appt.capacity !== undefined
                        ? appt.capacity - (appt.booked || 0)
                        : null;

                    return (
                      <tr key={appt._id || appt.date}>
                        <td>
                          <div className="fw-semibold">{formatDate(appt.date)}</div>
                          <small className="text-muted">{appt.date}</small>
                        </td>
                        <td>
                          <Badge
                            bg={isOpen ? 'success' : 'secondary'}
                            className="px-3 py-2 rounded-pill"
                          >
                            {isOpen ? 'Open' : 'Closed'}
                          </Badge>
                        </td>
                        <td>
                          <span className="fw-medium">{appt.booked || 0}</span>
                          {appt.capacity !== undefined && (
                            <span className="text-muted"> / {appt.capacity}</span>
                          )}
                          {remaining !== null && remaining <= 3 && remaining > 0 && (
                            <Badge bg="warning" text="dark" className="ms-2 rounded-pill small">
                              {remaining} left
                            </Badge>
                          )}
                          {remaining !== null && remaining <= 0 && (
                            <Badge bg="danger" className="ms-2 rounded-pill small">
                              Full
                            </Badge>
                          )}
                        </td>
                        <td className="text-end">
                          <Button
                            variant={isOpen ? 'outline-secondary' : 'outline-success'}
                            size="sm"
                            className="me-2 rounded-pill"
                            onClick={() => handleToggle(appt._id, appt.status)}
                            title={isOpen ? 'Close appointment' : 'Open appointment'}
                          >
                            {isOpen ? (
                              <><FiToggleRight size={14} className="me-1" /> Close</>
                            ) : (
                              <><FiToggleLeft size={14} className="me-1" /> Open</>
                            )}
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="rounded-pill"
                            onClick={() => handleDelete(appt._id)}
                            disabled={hasBookings}
                            title={
                              hasBookings
                                ? 'Cannot delete: bookings exist'
                                : 'Delete appointment'
                            }
                          >
                            <FiTrash2 size={14} />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

export default AppointmentManagement;
