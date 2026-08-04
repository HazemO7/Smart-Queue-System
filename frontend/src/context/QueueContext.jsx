import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import api from '../api/axios';

const QueueContext = createContext();

/**
 * Maps backend clinic data to the shape expected by all page components.
 * Adds default values for fields not stored in the backend (icon, hours, etc.).
 */
function mapClinicToFrontend(backendClinic) {
  const queueStatus = backendClinic.queue?.status || null;
  const isOpen = queueStatus === 'Open';
  const queueState = queueStatus === 'Open' ? 'open' : (queueStatus === 'Paused' ? 'paused' : (queueStatus === 'Closed' ? 'closed' : 'not-started'));

  return {
    id: backendClinic._id,
    name: backendClinic.name,
    nameAr: backendClinic.name,           // Backend stores one name; shown for both languages
    specialty: backendClinic.description || '',
    specialtyAr: backendClinic.description || '',
    icon: '🏥',
    hours: '—',
    hoursAr: '—',
    isOpen,
    queueState,
    currentServing: backendClinic.queue?.currentServingNumber || 0,
    nextTicket: backendClinic.nextTicketNumber || 1,
    queue: (backendClinic.waitingTickets || []).map((t) => ({
      ticketNumber: t.ticketNumber,
      patientName: t.patientName || 'Patient',
      patientNameAr: t.patientName || 'مريض',
      timeJoined: t.timeJoined
        ? new Date(t.timeJoined).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : '—',
      status: 'waiting',
    })),
    served: backendClinic.servedCount || 0,
    // Keep backend IDs for API calls
    queueId: backendClinic.queue?._id || null,
    waitingCount: backendClinic.waitingCount || 0,
  };
}

export function QueueProvider({ children }) {
  const [clinics, setClinics] = useState([]);
  const [patientTicket, setPatientTicket] = useState(() => {
    const saved = sessionStorage.getItem('sq-ticket');
    return saved ? JSON.parse(saved) : null;
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Appointment logic states (patient-facing)
  const [availableAppointments, setAvailableAppointments] = useState([]);
  const [selectedAppointmentDate, setSelectedAppointmentDate] = useState('');
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  // Admin appointment management states
  const [adminAppointments, setAdminAppointments] = useState([]);
  const [loadingAdminAppointments, setLoadingAdminAppointments] = useState(false);

  // Dashboard stats state
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const [errors, setErrors] = useState({ appointments: '', booking: '', queue: '', adminAppointments: '' });

  const { socket, isConnected } = useSocket();
  const { isAuthenticated, user } = useAuth();

  // Track joined clinic rooms to prevent duplicate joins
  const joinedRooms = useRef(new Set());

  // ─────────────────────────────────────────────
  //  Fetch clinics from backend on mount / auth change
  // ─────────────────────────────────────────────
  const fetchClinics = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const res = await api.get('/clinic');
      const mapped = (res.data?.data?.clinics || []).map(mapClinicToFrontend);
      setClinics(mapped);
    } catch (err) {
      console.error('[QueueContext] Failed to fetch clinics:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchClinics();
  }, [fetchClinics]);

  // ─────────────────────────────────────────────
  //  Fetch patient's active ticket on mount
  // ─────────────────────────────────────────────
  const fetchMyTicket = useCallback(async () => {
    if (!isAuthenticated || user?.role === 'admin') return;
    try {
      const res = await api.get('/ticket/my-tickets');
      const tickets = res.data?.data?.tickets || [];
      if (tickets.length > 0) {
        const t = tickets[0]; // Most relevant active ticket
        const ticket = {
          ...t,
          clinicName: t.clinicName || t.clinicId?.name || '',
          clinicId: t.clinicId?._id || t.clinicId,
          queueId: t.queueId?._id || t.queueId
        };
        setPatientTicket(ticket);
        sessionStorage.setItem('sq-ticket', JSON.stringify(ticket));
      }
    } catch (err) {
      console.error('[QueueContext] Failed to fetch tickets:', err);
    }
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    fetchMyTicket();
  }, [fetchMyTicket]);

  // ─────────────────────────────────────────────
  //  Socket event listeners
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Join all clinic rooms so we receive updates
    clinics.forEach((clinic) => {
      if (!joinedRooms.current.has(clinic.id)) {
        socket.emit('join:clinic', clinic.id);
        joinedRooms.current.add(clinic.id);
      }
    });

    // Handler: Admin started a shift (queue opened, tickets activated)
    const handleQueueStarted = (data) => {
      setClinics((prev) =>
        prev.map((clinic) => {
          if (clinic.id !== data.clinicId) return clinic;
          return {
            ...clinic,
            isOpen: true,
            queueState: 'open',
            currentServing: data.queue?.currentServingNumber || 0,
            queueId: data.queue?._id || null,
          };
        })
      );
      // If patient has a pending ticket for this clinic, it's now live
      setPatientTicket((prev) => {
        if (!prev || prev.clinicId !== data.clinicId) return prev;
        const updated = { ...prev, status: 'Live', queueState: 'open' };
        sessionStorage.setItem('sq-ticket', JSON.stringify(updated));
        return updated;
      });
    };

    // Handler: Admin closed the shift
    const handleQueueClosed = (data) => {
      setClinics((prev) =>
        prev.map((clinic) => {
          if (clinic.id !== data.clinicId) return clinic;
          return {
            ...clinic,
            isOpen: false,
            queueState: 'closed',
            currentServing: 0,
            queue: [],
            queueId: null,
          };
        })
      );
      // If patient has a ticket for this clinic, it's now a no-show
      setPatientTicket((prev) => {
        if (!prev || prev.clinicId !== data.clinicId) return prev;
        sessionStorage.removeItem('sq-ticket');
        return null;
      });
    };

    // Handler: Admin called next patient
    const handleQueueNext = (data) => {
      setClinics((prev) =>
        prev.map((clinic) => {
          if (clinic.id !== data.clinicId) return clinic;
          return {
            ...clinic,
            currentServing: data.currentServingNumber,
            queue: clinic.queue.filter(
              (p) => p.ticketNumber !== data.servedTicket?.ticketNumber
            ),
            served: clinic.served + 1,
          };
        })
      );
      // Update patient ticket — check if they're being served
      setPatientTicket((prev) => {
        if (!prev || prev.clinicId !== data.clinicId) return prev;
        if (prev.ticketNumber === data.servedTicket?.ticketNumber) {
          const updated = { ...prev, status: 'Served' };
          sessionStorage.setItem('sq-ticket', JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
    };

    // Handler: New ticket booked by a patient
    const handleTicketNew = (data) => {
      setClinics((prev) =>
        prev.map((clinic) => {
          if (clinic.id !== data.clinicId) return clinic;
          return {
            ...clinic,
            nextTicket: data.ticket.ticketNumber + 1,
            queue:
              data.ticket.status === 'Live'
                ? [
                    ...clinic.queue,
                    {
                      ticketNumber: data.ticket.ticketNumber,
                      patientName: 'Patient',
                      patientNameAr: 'مريض',
                      timeJoined: new Date().toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      }),
                      status: 'waiting',
                    },
                  ]
                : clinic.queue,
          };
        })
      );
    };

    const handleQueuePaused = (data) => {
      setClinics((prev) =>
        prev.map((clinic) => {
          if (clinic.id !== data.clinicId) return clinic;
          return {
            ...clinic,
            isOpen: false,
            queueState: 'paused',
          };
        })
      );
      setPatientTicket((prev) => {
        if (!prev || prev.clinicId !== data.clinicId) return prev;
        const updated = { ...prev, queueState: 'paused', estimatedWaitMinutes: null };
        sessionStorage.setItem('sq-ticket', JSON.stringify(updated));
        return updated;
      });
    };

    const handleQueueResumed = (data) => {
      setClinics((prev) =>
        prev.map((clinic) => {
          if (clinic.id !== data.clinicId) return clinic;
          return {
            ...clinic,
            isOpen: true,
            queueState: 'open',
          };
        })
      );
      setPatientTicket((prev) => {
        if (!prev || prev.clinicId !== data.clinicId) return prev;
        const updated = { ...prev, queueState: 'open' };
        sessionStorage.setItem('sq-ticket', JSON.stringify(updated));
        return updated;
      });
    };

    const handleQueueUpdate = (data) => {
      setClinics((prev) =>
        prev.map((clinic) => {
          if (clinic.id !== data.clinicId) return clinic;
          return {
            ...clinic,
            currentServing: data.currentServingNumber !== undefined ? data.currentServingNumber : clinic.currentServing,
            queueState: data.queueState || clinic.queueState,
            isOpen: data.queueState === 'open',
          };
        })
      );
      setPatientTicket((prev) => {
        if (!prev || prev.clinicId !== data.clinicId) return prev;
        if (prev.ticketNumber && data.ticketNumber && prev.ticketNumber !== data.ticketNumber) return prev;
        const updated = {
          ...prev,
          position: data.position !== undefined ? data.position : prev.position,
          estimatedWaitMinutes: data.estimatedWaitMinutes !== undefined ? data.estimatedWaitMinutes : prev.estimatedWaitMinutes,
          queueState: data.queueState || prev.queueState,
          currentServingNumber: data.currentServingNumber !== undefined ? data.currentServingNumber : prev.currentServingNumber,
        };
        sessionStorage.setItem('sq-ticket', JSON.stringify(updated));
        return updated;
      });
    };

    socket.on('queue:started', handleQueueStarted);
    socket.on('queue:closed', handleQueueClosed);
    socket.on('queue:next', handleQueueNext);
    socket.on('ticket:new', handleTicketNew);
    socket.on('queue:paused', handleQueuePaused);
    socket.on('queue:resumed', handleQueueResumed);
    socket.on('queue:update', handleQueueUpdate);

    // Cleanup listeners on unmount or dependency change
    return () => {
      socket.off('queue:started', handleQueueStarted);
      socket.off('queue:closed', handleQueueClosed);
      socket.off('queue:next', handleQueueNext);
      socket.off('ticket:new', handleTicketNew);
      socket.off('queue:paused', handleQueuePaused);
      socket.off('queue:resumed', handleQueueResumed);
      socket.off('queue:update', handleQueueUpdate);
    };
  }, [socket, isConnected, clinics]);

  // ─────────────────────────────────────────────
  //  Context functions (preserve existing signatures)
  // ─────────────────────────────────────────────

  const getClinic = useCallback(
    (clinicId) => {
      return clinics.find((c) => c.id === clinicId);
    },
    [clinics]
  );

  const fetchAvailableAppointments = useCallback(async (clinicId) => {
    setLoadingAppointments(true);
    setErrors((prev) => ({ ...prev, appointments: '' }));
    setAvailableAppointments([]);
    setSelectedAppointmentDate('');
    
    try {
      const res = await api.get(`/clinic/${clinicId}/appointments`);
      const appointments = res.data?.data?.appointments || [];
      setAvailableAppointments(appointments);
    } catch (err) {
      console.error('[QueueContext] Failed to fetch appointments:', err);
      setErrors((prev) => ({
        ...prev,
        appointments: err.response?.data?.message || 'Failed to load available appointments.'
      }));
    } finally {
      setLoadingAppointments(false);
    }
  }, []);

  const bookTicket = useCallback(
    async (clinicId, appointmentDate) => {
      try {
        setErrors((prev) => ({ ...prev, booking: '' }));
        
        if (!appointmentDate) {
          throw new Error('Please select an appointment date.');
        }

        const appointment = availableAppointments.find(a => a.date === appointmentDate);
        if (!appointment) {
          throw new Error('The selected appointment date is not available.');
        }

        if (appointment.status === 'Closed' || appointment.available === false) {
          throw new Error('This appointment date is closed or unavailable.');
        }

        if (appointment.capacity !== undefined && appointment.booked !== undefined) {
          if (appointment.booked >= appointment.capacity) {
            throw new Error('This appointment date is fully booked.');
          }
        }

        const res = await api.post('/ticket/book', {
          clinicId,
          appointmentDate, 
        });
        const newTicket = res.data?.data?.ticket;
        if (newTicket) {
          setPatientTicket(newTicket);
          sessionStorage.setItem('sq-ticket', JSON.stringify(newTicket));
          setShowSuccess(true);
        }
      } catch (err) {
        console.error('[QueueContext] Book ticket failed:', err);
        const errorMsg = err.response?.data?.message || err.message || 'Failed to book ticket.';
        setErrors((prev) => ({ ...prev, booking: errorMsg }));
        throw err;
      }
    },
    [availableAppointments]
  );

  const callNextPatient = useCallback(
    async (clinicId) => {
      const clinic = clinics.find((c) => c.id === clinicId);
      if (!clinic?.queueId) return;
      try {
        await api.patch(`/queue/next/${clinic.queueId}`);
        // State update happens via socket event (queue:next)
      } catch (err) {
        console.error('[QueueContext] Call next failed:', err);
        throw err;
      }
    },
    [clinics]
  );

  const toggleClinic = useCallback(
    async (clinicId) => {
      const clinic = clinics.find((c) => c.id === clinicId);
      if (!clinic) return;
      try {
        if (clinic.isOpen && clinic.queueId) {
          // Close the shift
          await api.patch(`/queue/close/${clinic.queueId}`);
          // State update happens via socket event (queue:closed)
        } else if (!clinic.isOpen) {
          // Start a new shift
          await api.post('/queue/start-shift', { clinicId });
          // State update happens via socket event (queue:started)
        }
      } catch (err) {
        console.error('[QueueContext] Toggle clinic failed:', err);
      }
    },
    [clinics]
  );

  const pauseClinic = useCallback(
    async (clinicId) => {
      const clinic = clinics.find((c) => c.id === clinicId);
      if (!clinic?.queueId) return;
      try {
        await api.patch(`/queue/pause/${clinic.queueId}`);
      } catch (err) {
        console.error('[QueueContext] Pause clinic failed:', err);
      }
    },
    [clinics]
  );

  const resumeClinic = useCallback(
    async (clinicId) => {
      const clinic = clinics.find((c) => c.id === clinicId);
      if (!clinic?.queueId) return;
      try {
        await api.patch(`/queue/resume/${clinic.queueId}`);
      } catch (err) {
        console.error('[QueueContext] Resume clinic failed:', err);
      }
    },
    [clinics]
  );

  const clearTicket = useCallback(() => {
    setPatientTicket(null);
    sessionStorage.removeItem('sq-ticket');
  }, []);

  const getEstimatedWait = useCallback(
    (clinicId, ticketNumber) => {
      if (patientTicket && patientTicket.clinicId === clinicId && patientTicket.ticketNumber === ticketNumber) {
        if (patientTicket.estimatedWaitMinutes !== undefined && patientTicket.estimatedWaitMinutes !== null) {
          return patientTicket.estimatedWaitMinutes;
        }
      }
      const clinic = clinics.find((c) => c.id === clinicId);
      if (!clinic) return 0;
      const position = ticketNumber - clinic.currentServing;
      return Math.max(0, position * 7); // ~7 min per patient
    },
    [clinics, patientTicket]
  );

  const getPosition = useCallback(
    (clinicId, ticketNumber) => {
      if (patientTicket && patientTicket.clinicId === clinicId && patientTicket.ticketNumber === ticketNumber) {
        if (patientTicket.position !== undefined) {
          return patientTicket.position;
        }
      }
      const clinic = clinics.find((c) => c.id === clinicId);
      if (!clinic) return 0;
      return Math.max(0, ticketNumber - clinic.currentServing);
    },
    [clinics, patientTicket]
  );

  const getQueueState = useCallback(
    (clinicId) => {
      if (patientTicket && patientTicket.clinicId === clinicId) {
        return patientTicket.queueState || 'not-started';
      }
      const clinic = clinics.find((c) => c.id === clinicId);
      return clinic?.queueState || 'not-started';
    },
    [clinics, patientTicket]
  );

  // ─────────────────────────────────────────────
  //  Admin Dashboard Stats
  // ─────────────────────────────────────────────

  const fetchDashboardStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await api.get('/admin/stats');
      setDashboardStats(res.data?.data || null);
    } catch (err) {
      console.error('[QueueContext] Failed to fetch dashboard stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const createClinic = useCallback(async (name, description) => {
    try {
      await api.post('/clinic/create', { name, description });
      await fetchClinics();
    } catch (err) {
      console.error('[QueueContext] Failed to create clinic:', err);
      throw err;
    }
  }, [fetchClinics]);

  // ─────────────────────────────────────────────
  //  Admin Appointment CRUD
  // ─────────────────────────────────────────────

  const fetchAdminAppointments = useCallback(async (clinicId) => {
    setLoadingAdminAppointments(true);
    setErrors((prev) => ({ ...prev, adminAppointments: '' }));
    try {
      const res = await api.get(`/clinic/${clinicId}/appointments`);
      setAdminAppointments(res.data?.data?.appointments || []);
    } catch (err) {
      console.error('[QueueContext] Failed to fetch admin appointments:', err);
      setErrors((prev) => ({
        ...prev,
        adminAppointments: err.response?.data?.message || 'Failed to load appointments.'
      }));
    } finally {
      setLoadingAdminAppointments(false);
    }
  }, []);

  const createAppointment = useCallback(async (clinicId, date, capacity) => {
    setErrors((prev) => ({ ...prev, adminAppointments: '' }));
    try {
      // Validation
      if (!date) throw new Error('Please select a date.');
      const selected = new Date(date);
      if (isNaN(selected.getTime())) throw new Error('Invalid date.');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selected.setHours(0, 0, 0, 0);
      if (selected < today) throw new Error('Cannot create appointments in the past.');
      if (adminAppointments.some(a => a.date === date)) throw new Error('An appointment already exists for this date.');

      await api.post(`/clinic/${clinicId}/appointments`, { date, capacity: Number(capacity) || undefined });
      // Refresh the list after creation
      await fetchAdminAppointments(clinicId);
    } catch (err) {
      console.error('[QueueContext] Failed to create appointment:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to create appointment.';
      setErrors((prev) => ({ ...prev, adminAppointments: msg }));
      throw err;
    }
  }, [adminAppointments, fetchAdminAppointments]);

  const toggleAppointmentStatus = useCallback(async (clinicId, appointmentId, newStatus) => {
    setErrors((prev) => ({ ...prev, adminAppointments: '' }));
    try {
      await api.patch(`/clinic/${clinicId}/appointments/${appointmentId}`, { status: newStatus });
      // Optimistic update
      setAdminAppointments((prev) =>
        prev.map((a) => (a._id === appointmentId ? { ...a, status: newStatus } : a))
      );
    } catch (err) {
      console.error('[QueueContext] Failed to toggle appointment:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to update appointment status.';
      setErrors((prev) => ({ ...prev, adminAppointments: msg }));
      throw err;
    }
  }, []);

  const deleteAppointment = useCallback(async (clinicId, appointmentId) => {
    setErrors((prev) => ({ ...prev, adminAppointments: '' }));
    try {
      await api.delete(`/clinic/${clinicId}/appointments/${appointmentId}`);
      setAdminAppointments((prev) => prev.filter((a) => a._id !== appointmentId));
    } catch (err) {
      console.error('[QueueContext] Failed to delete appointment:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to delete appointment.';
      setErrors((prev) => ({ ...prev, adminAppointments: msg }));
      throw err;
    }
  }, []);

  return (
    <QueueContext.Provider
      value={{
        clinics,
        patientTicket,
        showSuccess,
        setShowSuccess,
        isLoading,
        availableAppointments,
        selectedAppointmentDate,
        setSelectedAppointmentDate,
        loadingAppointments,
        errors,
        fetchAvailableAppointments,
        getClinic,
        bookTicket,
        callNextPatient,
        toggleClinic,
        pauseClinic,
        resumeClinic,
        clearTicket,
        getEstimatedWait,
        getPosition,
        getQueueState,
        refetchClinics: fetchClinics,
        // Dashboard
        dashboardStats,
        loadingStats,
        fetchDashboardStats,
        createClinic,
        // Admin appointment management
        adminAppointments,
        loadingAdminAppointments,
        fetchAdminAppointments,
        createAppointment,
        toggleAppointmentStatus,
        deleteAppointment,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue() {
  const context = useContext(QueueContext);
  if (!context) throw new Error('useQueue must be used within QueueProvider');
  return context;
}
