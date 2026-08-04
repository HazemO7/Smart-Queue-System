import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Form, Modal, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useQueue } from '../../context/QueueContext';
import {
  FiUsers, FiCheckCircle, FiActivity, FiSettings,
  FiCalendar, FiPlusCircle, FiClock, FiTrendingUp,
  FiAlertCircle, FiChevronRight, FiHome
} from 'react-icons/fi';

function DashboardPage() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const {
    clinics, toggleClinic,
    dashboardStats, loadingStats, fetchDashboardStats,
    createClinic
  } = useQueue();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClinicName, setNewClinicName] = useState('');
  const [newClinicDesc, setNewClinicDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Fetch dashboard stats on mount
  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  // Compute live stats from clinics (real-time via Socket.IO)
  const totalWaiting = clinics.reduce((sum, c) => sum + c.queue.length, 0);
  const totalServed = clinics.reduce((sum, c) => sum + c.served, 0);
  const openClinics = clinics.filter((c) => c.isOpen).length;

  // Get current date for welcome banner
  const now = new Date();
  const dateStr = now.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const timeStr = now.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', {
    hour: '2-digit', minute: '2-digit'
  });

  const handleCreateClinic = async () => {
    if (!newClinicName.trim()) return;
    setCreating(true);
    setCreateError('');
    try {
      await createClinic(newClinicName.trim(), newClinicDesc.trim());
      setShowCreateModal(false);
      setNewClinicName('');
      setNewClinicDesc('');
      // Refresh stats after creating a clinic
      fetchDashboardStats();
    } catch (err) {
      setCreateError(err.response?.data?.msg || err.response?.data?.message || 'Failed to create clinic.');
    } finally {
      setCreating(false);
    }
  };

  // Stats cards config
  const statsCards = [
    {
      label: 'Total Clinics',
      value: dashboardStats?.totalClinics ?? clinics.length,
      icon: FiHome,
      color: 'primary',
      bg: 'dash-stat-blue',
    },
    {
      label: 'Registered Patients',
      value: dashboardStats?.totalPatients ?? '—',
      icon: FiUsers,
      color: 'info',
      bg: 'dash-stat-cyan',
    },
    {
      label: "Today's Tickets",
      value: dashboardStats?.todayStats?.totalTickets ?? (totalWaiting + totalServed),
      icon: FiActivity,
      color: 'purple',
      bg: 'dash-stat-purple',
    },
    {
      label: 'Currently Waiting',
      value: totalWaiting,
      icon: FiClock,
      color: 'warning',
      bg: 'dash-stat-amber',
    },
    {
      label: 'Served Today',
      value: totalServed,
      icon: FiCheckCircle,
      color: 'success',
      bg: 'dash-stat-green',
    },
    {
      label: 'Upcoming Appointments',
      value: dashboardStats?.upcomingAppointments ?? '—',
      icon: FiCalendar,
      color: 'danger',
      bg: 'dash-stat-rose',
    },
  ];

  return (
    <div className="admin-page py-4">
      <Container>
        {/* Welcome Banner */}
        <Card className="dash-welcome-card border-0 mb-4">
          <Card.Body className="p-4">
            <Row className="align-items-center">
              <Col>
                <h1 className="dash-welcome-title mb-1">
                  Welcome back, {user?.name || 'Admin'} 👋
                </h1>
                <p className="dash-welcome-sub mb-0">
                  <FiCalendar size={14} className="me-1" />
                  {dateStr} — {timeStr}
                </p>
              </Col>
              <Col xs="auto">
                <div className="dash-open-indicator">
                  <span className="dash-open-dot" />
                  <span className="fw-semibold">{openClinics}</span>
                  <span className="text-muted ms-1">Open Clinics</span>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Stats Grid */}
        {loadingStats && !dashboardStats ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : (
          <Row className="g-3 mb-4">
            {statsCards.map((stat, idx) => (
              <Col xs={6} md={4} lg={2} key={idx}>
                <Card className={`dash-stat-card border-0 ${stat.bg}`}>
                  <Card.Body className="p-3 text-center">
                    <div className="dash-stat-icon-wrap mb-2">
                      <stat.icon size={22} />
                    </div>
                    <div className="dash-stat-value">{stat.value}</div>
                    <div className="dash-stat-label">{stat.label}</div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {/* Today's Breakdown (mini bar) */}
        {dashboardStats?.todayStats && dashboardStats.todayStats.totalTickets > 0 && (
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="p-3">
              <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <FiTrendingUp size={16} /> Today's Ticket Breakdown
              </h6>
              <div className="dash-breakdown-bar">
                {dashboardStats.todayStats.served > 0 && (
                  <div
                    className="dash-bar-segment bg-success"
                    style={{ flex: dashboardStats.todayStats.served }}
                    title={`Served: ${dashboardStats.todayStats.served}`}
                  />
                )}
                {dashboardStats.todayStats.live > 0 && (
                  <div
                    className="dash-bar-segment bg-primary"
                    style={{ flex: dashboardStats.todayStats.live }}
                    title={`In Queue: ${dashboardStats.todayStats.live}`}
                  />
                )}
                {dashboardStats.todayStats.pending > 0 && (
                  <div
                    className="dash-bar-segment bg-warning"
                    style={{ flex: dashboardStats.todayStats.pending }}
                    title={`Pending: ${dashboardStats.todayStats.pending}`}
                  />
                )}
                {dashboardStats.todayStats.noShow > 0 && (
                  <div
                    className="dash-bar-segment bg-secondary"
                    style={{ flex: dashboardStats.todayStats.noShow }}
                    title={`No-Show: ${dashboardStats.todayStats.noShow}`}
                  />
                )}
              </div>
              <div className="d-flex gap-2 gap-md-4 mt-2 flex-wrap">
                <small className="d-flex align-items-center gap-1">
                  <span className="dash-legend-dot bg-success" /> Served ({dashboardStats.todayStats.served})
                </small>
                <small className="d-flex align-items-center gap-1">
                  <span className="dash-legend-dot bg-primary" /> In Queue ({dashboardStats.todayStats.live})
                </small>
                <small className="d-flex align-items-center gap-1">
                  <span className="dash-legend-dot bg-warning" /> Pending ({dashboardStats.todayStats.pending})
                </small>
                <small className="d-flex align-items-center gap-1">
                  <span className="dash-legend-dot bg-secondary" /> No-Show ({dashboardStats.todayStats.noShow})
                </small>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Clinics Management Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="section-subtitle mb-0">{t('manageQueues')}</h2>
          <Button
            variant="primary"
            size="sm"
            className="rounded-pill px-3 d-flex align-items-center gap-1"
            onClick={() => setShowCreateModal(true)}
          >
            <FiPlusCircle size={16} /> Add Clinic
          </Button>
        </div>

        {/* Clinics Grid */}
        <Row className="g-3">
          {clinics.map(clinic => (
            <Col xs={12} md={6} key={clinic.id}>
              <Card className="dash-clinic-card border-0 shadow-sm">
                <Card.Body className="p-3">
                  {/* Top row: icon + name + toggle */}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <div className="dash-clinic-icon">
                        {clinic.icon}
                      </div>
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

                  {/* Status bar */}
                  <div className="dash-clinic-status mb-3">
                    <Badge
                      bg={clinic.isOpen ? 'success' : 'secondary'}
                      className="px-3 py-2 rounded-pill"
                    >
                      {clinic.isOpen ? t('open') : t('closed')}
                    </Badge>
                    {clinic.isOpen && (
                      <span className="dash-serving-badge">
                        Now Serving: <strong>#{clinic.currentServing}</strong>
                      </span>
                    )}
                  </div>

                  {/* Stats row */}
                  <Row className="g-2 mb-3">
                    <Col xs={4}>
                      <div className="dash-clinic-mini-stat">
                        <FiUsers size={14} className="text-warning" />
                        <span className="fw-bold">{clinic.queue.length}</span>
                        <span className="text-muted small">Waiting</span>
                      </div>
                    </Col>
                    <Col xs={4}>
                      <div className="dash-clinic-mini-stat">
                        <FiCheckCircle size={14} className="text-success" />
                        <span className="fw-bold">{clinic.served}</span>
                        <span className="text-muted small">Served</span>
                      </div>
                    </Col>
                    <Col xs={4}>
                      <div className="dash-clinic-mini-stat">
                        <FiActivity size={14} className="text-primary" />
                        <span className="fw-bold">{clinic.nextTicket}</span>
                        <span className="text-muted small">Next #</span>
                      </div>
                    </Col>
                  </Row>

                  {/* Action button */}
                  <Button
                    as={Link}
                    to={`/admin/queue/${clinic.id}`}
                    variant="outline-primary"
                    className="w-100 rounded-pill d-flex align-items-center justify-content-center gap-2"
                  >
                    <FiSettings size={16} />
                    {t('manageQueue')}
                    <FiChevronRight size={16} />
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}

          {clinics.length === 0 && (
            <Col xs={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="text-center py-5">
                  <FiAlertCircle size={40} className="text-muted mb-2 opacity-25" />
                  <p className="text-muted">No clinics found. Create one to get started.</p>
                </Card.Body>
              </Card>
            </Col>
          )}
        </Row>
      </Container>

      {/* Create Clinic Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            <FiPlusCircle size={20} className="me-2 text-primary" />
            Create New Clinic
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-3">
          {createError && (
            <div className="alert alert-danger py-2 small">{createError}</div>
          )}
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Clinic Name *</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g. General Medicine"
              value={newClinicName}
              onChange={(e) => setNewClinicName(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="Short description (optional)"
              value={newClinicDesc}
              onChange={(e) => setNewClinicDesc(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowCreateModal(false)} className="rounded-pill px-4">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateClinic}
            disabled={!newClinicName.trim() || creating}
            className="rounded-pill px-4"
          >
            {creating ? <Spinner size="sm" animation="border" /> : 'Create Clinic'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default DashboardPage;
