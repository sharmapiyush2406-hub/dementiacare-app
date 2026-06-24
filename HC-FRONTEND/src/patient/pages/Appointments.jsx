import { useState, useEffect } from "react";
import PatientLayout from "../layouts/PatientLayout";
import "../../shared/styles/Dashboard.css";
import api from "../../services/api";
import { CalendarIcon, ClockIcon, UserIcon, ActivityIcon } from "../../shared/components/Icons";

function Appointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAppt, setSelectedAppt] = useState(null);
    const [newDate, setNewDate] = useState("");
    const [newTime, setNewTime] = useState("");
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [doctors, setDoctors] = useState([]);
    const [bookingData, setBookingData] = useState({
        doctorId: "",
        date: "",
        time: "",
        type: "Routine Checkup",
        notes: ""
    });

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const { data } = await api.get("/patient/appointments");
            setAppointments(data || []);
        } catch (err) {
            console.error("Failed to load appointments", err);
            setError("Failed to load appointments. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const fetchDoctors = async () => {
        try {
            const { data } = await api.get("/patient/doctors");
            setDoctors(data || []);
        } catch (err) {
            console.error("Failed to load doctors", err);
        }
    };

    useEffect(() => {
        fetchAppointments();
        fetchDoctors();
    }, []);

    const handleCancel = async (id) => {
        try {
            await api.put(`/patient/appointment/${id}/cancel`);
            fetchAppointments();
        } catch (err) {
            alert("Failed to cancel appointment");
        }
    };

    const handleRescheduleClick = (appt) => {
        setSelectedAppt(appt);
        setNewDate(appt.date);
        setNewTime(appt.time);
        setIsModalOpen(true);
    };

    const handleConfirmReschedule = async () => {
        try {
            await api.put(`/patient/appointment/${selectedAppt._id}/reschedule`, {
                date: newDate,
                time: newTime
            });
            setIsModalOpen(false);
            fetchAppointments();
        } catch (err) {
            alert("Failed to reschedule");
        }
    };

    const handleBookAppointment = async () => {
        try {
            const selectedDoc = doctors.find(d => d._id === bookingData.doctorId);
            if (!selectedDoc) {
                alert("Please select a doctor");
                return;
            }

            await api.post("/patient/appointment", {
                ...bookingData,
                doctorName: `Dr. ${selectedDoc.firstName} ${selectedDoc.lastName}`,
                department: selectedDoc.department
            });

            setIsBookingModalOpen(false);
            setBookingData({ doctorId: "", date: "", time: "", type: "Routine Checkup", notes: "" });
            fetchAppointments();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to book appointment");
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Upcoming': return { bg: '#eff6ff', color: '#3b82f6' };
            case 'Cancelled': return { bg: '#fee2e2', color: '#ef4444' };
            case 'Completed': return { bg: '#ecfdf5', color: '#10b981' };
            default: return { bg: '#f1f5f9', color: '#475569' };
        }
    };

    return (
        <PatientLayout>
            <div className="medication-header" style={{ marginBottom: "24px", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: "1.8rem", color: "#1e293b", margin: 0 }}>My Appointments</h2>
                    <p style={{ color: "#64748b", margin: "4px 0 0" }}>Manage your upcoming and past doctor visits.</p>
                </div>
                <button
                    onClick={() => setIsBookingModalOpen(true)}
                    style={{
                        padding: '12px 24px',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                    }}
                >
                    <span style={{ fontSize: '1.2rem' }}>+</span> Book My Appointment
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: "40px" }}>Loading appointments...</div>
            ) : error ? (
                <div style={{ color: "#dc2626", padding: "20px", background: "#fee2e2", borderRadius: "12px" }}>{error}</div>
            ) : appointments.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px", background: "#f8fafc", borderRadius: "16px", border: "1px dashed #e2e8f0" }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>📅</div>
                    <p style={{ fontWeight: 600, color: "#1e293b" }}>No appointments found</p>
                </div>
            ) : (
                <div className="stats-grid">
                    {appointments.map(appt => (
                        <div className="stat-card" key={appt._id} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div style={{ background: '#f8fafc', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                                        <UserIcon />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{appt.doctorName}</h3>
                                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{appt.department}</span>
                                    </div>
                                </div>
                                <span style={{
                                    ...getStatusStyle(appt.status),
                                    padding: '4px 10px',
                                    borderRadius: '999px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600
                                }}>
                                    {appt.status}
                                </span>
                            </div>

                            <div style={{ display: 'flex', gap: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#475569' }}>
                                    <CalendarIcon /> {appt.date}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#475569' }}>
                                    <ClockIcon /> {appt.time}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                                {appt.status === 'Upcoming' && (
                                    <button
                                        onClick={() => handleCancel(appt._id)}
                                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #fee2e2', background: '#fff', color: '#ef4444', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                        Cancel
                                    </button>
                                )}
                                {appt.status === 'Cancelled' && (
                                    <button
                                        onClick={() => handleRescheduleClick(appt)}
                                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                        Reschedule
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ margin: '0 0 8px' }}>Reschedule Appointment</h3>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>Select a new date and time for your visit.</p>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>Date</label>
                            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>Time</label>
                            <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleConfirmReschedule} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            {isBookingModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <h3 style={{ margin: 0 }}>Book My Appointment</h3>
                            <button onClick={() => setIsBookingModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
                        </div>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px' }}>Select your preferred doctor and schedule a visit.</p>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>Select Doctor</label>
                            <select
                                value={bookingData.doctorId}
                                onChange={e => setBookingData({ ...bookingData, doctorId: e.target.value })}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff' }}
                            >
                                <option value="">Choose a doctor...</option>
                                {doctors.map(doc => (
                                    <option key={doc._id} value={doc._id}>
                                        Dr. {doc.firstName} {doc.lastName} ({doc.specialization} - {doc.department})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>Date</label>
                                <input
                                    type="date"
                                    value={bookingData.date}
                                    onChange={e => setBookingData({ ...bookingData, date: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>Time</label>
                                <input
                                    type="time"
                                    value={bookingData.time}
                                    onChange={e => setBookingData({ ...bookingData, time: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>Appointment Type</label>
                            <select
                                value={bookingData.type}
                                onChange={e => setBookingData({ ...bookingData, type: e.target.value })}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff' }}
                            >
                                <option value="Routine Checkup">Routine Checkup</option>
                                <option value="First Consultation">First Consultation</option>
                                <option value="Follow-up">Follow-up</option>
                                <option value="Diagnostic Result">Diagnostic Result</option>
                                <option value="Emergency">Emergency</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>Notes (Optional)</label>
                            <textarea
                                value={bookingData.notes}
                                onChange={e => setBookingData({ ...bookingData, notes: e.target.value })}
                                placeholder="Describe your symptoms or reason for visit..."
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: '80px', fontFamily: 'inherit' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => setIsBookingModalOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                            <button
                                onClick={handleBookAppointment}
                                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                            >
                                Confirm Booking
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PatientLayout>
    );
}

export default Appointments;
