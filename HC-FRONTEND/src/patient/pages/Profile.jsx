import { useState, useRef, useEffect } from "react";
import PatientLayout from "../layouts/PatientLayout";
import "../styles/PatientProfile.css";
import api from "../../services/api";

function Profile() {
    const fileInputRef = useRef(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [activeTab, setActiveTab] = useState("personal");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [statusMsg, setStatusMsg] = useState(null); // { type: 'success'|'error', text }

    const [personal, setPersonal] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        gender: "Male",
        address: "",
        patientId: "",
        joinDate: "",
    });

    const [medical, setMedical] = useState({
        bloodGroup: "",
        age: "",
        weight: "",
        height: "",
        conditions: "",
        allergies: "",
        currentMedications: "",
        primaryDoctor: "",
        lastVisit: "",
        nextAppointment: "",
    });

    const [emergency, setEmergency] = useState({
        contactName: "",
        relationship: "",
        contactPhone: "",
        contactEmail: "",
        altContactName: "",
        altRelationship: "",
        altPhone: "",
        assignedCaregiver: "",
        caregiverPhone: "",
    });

    const [preferences, setPreferences] = useState({
        medicationReminders: true,
        appointmentAlerts: true,
        emailNotifications: false,
        smsNotifications: true,
        language: "English",
        timezone: "UTC-5 (Eastern)",
    });

    // ── Load profile on mount ─────────────────────────────────
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await api.get("/patient/profile");

                setPersonal(prev => ({
                    ...prev,
                    firstName: data.personal?.firstName ?? "",
                    lastName: data.personal?.lastName ?? "",
                    email: data.email ?? "",
                    phone: data.personal?.phone ?? "",
                    dateOfBirth: data.personal?.dateOfBirth ?? "",
                    gender: data.personal?.gender ?? "Male",
                    address: data.personal?.address ?? "",
                }));

                if (data.medical) setMedical(prev => ({ ...prev, ...data.medical }));

                if (data.emergency) {
                    setEmergency(prev => ({
                        ...prev,
                        contactName: data.emergency.contactName ?? "",
                        relationship: data.emergency.relationship ?? "",
                        contactPhone: data.emergency.contactPhone ?? "",
                        contactEmail: data.emergency.contactEmail ?? "",
                        altContactName: data.emergency.altContactName ?? "",
                        altRelationship: data.emergency.altRelationship ?? "",
                        altPhone: data.emergency.altPhone ?? "",
                    }));
                }

                if (data.preferences) setPreferences(prev => ({ ...prev, ...data.preferences }));
            } catch (err) {
                console.error("Failed to load profile:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    // ── Photo handler ─────────────────────────────────────────
    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPhotoPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    // ── Save handler ──────────────────────────────────────────
    const handleSave = async () => {
        setSaving(true);
        setStatusMsg(null);
        try {
            await api.put("/patient/profile", {
                personal: {
                    firstName: personal.firstName,
                    lastName: personal.lastName,
                    phone: personal.phone,
                    dateOfBirth: personal.dateOfBirth,
                    gender: personal.gender,
                    address: personal.address,
                },
                medical: {
                    bloodGroup: medical.bloodGroup,
                    age: medical.age,
                    weight: medical.weight,
                    height: medical.height,
                    conditions: medical.conditions,
                    allergies: medical.allergies,
                    currentMedications: medical.currentMedications,
                    primaryDoctor: medical.primaryDoctor,
                    lastVisit: medical.lastVisit,
                    nextAppointment: medical.nextAppointment,
                },
                emergency: {
                    contactName: emergency.contactName,
                    relationship: emergency.relationship,
                    contactPhone: emergency.contactPhone,
                    contactEmail: emergency.contactEmail,
                    altContactName: emergency.altContactName,
                    altRelationship: emergency.altRelationship,
                    altPhone: emergency.altPhone,
                },
                preferences: {
                    medicationReminders: preferences.medicationReminders,
                    appointmentAlerts: preferences.appointmentAlerts,
                    emailNotifications: preferences.emailNotifications,
                    smsNotifications: preferences.smsNotifications,
                    language: preferences.language,
                    timezone: preferences.timezone,
                },
            });
            setStatusMsg({ type: "success", text: "✅ Profile saved successfully!" });
        } catch (err) {
            console.error("Failed to save profile:", err);
            setStatusMsg({ type: "error", text: "❌ Failed to save profile. Please try again." });
        } finally {
            setSaving(false);
            setTimeout(() => setStatusMsg(null), 4000);
        }
    };

    const tabs = [
        { id: "personal", label: "Personal Info", icon: "👤" },
        { id: "medical", label: "Medical Info", icon: "🩺" },
        { id: "emergency", label: "Emergency", icon: "🚨" },
        { id: "preferences", label: "Preferences", icon: "⚙️" },
    ];

    if (loading) {
        return (
            <PatientLayout>
                <div className="pat-settings-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
                    <p style={{ color: "#64748b", fontSize: "1.1rem" }}>⏳ Loading your profile…</p>
                </div>
            </PatientLayout>
        );
    }

    return (
        <PatientLayout>
            <div className="pat-settings-page">

                {/* Status Banner */}
                {statusMsg && (
                    <div style={{
                        padding: "12px 20px",
                        marginBottom: "16px",
                        borderRadius: "10px",
                        fontWeight: 600,
                        background: statusMsg.type === "success" ? "#f0fdf4" : "#fef2f2",
                        color: statusMsg.type === "success" ? "#16a34a" : "#dc2626",
                        border: `1px solid ${statusMsg.type === "success" ? "#bbf7d0" : "#fecaca"}`,
                    }}>
                        {statusMsg.text}
                    </div>
                )}

                {/* Page Header */}
                <div className="pat-settings-header">
                    <div>
                        <h2 className="pat-settings-title">My Profile</h2>
                        <p className="pat-settings-subtitle">View and manage your health profile information</p>
                    </div>
                    <button className="pat-save-btn-header" onClick={handleSave} disabled={saving}>
                        <span>💾</span> {saving ? "Saving…" : "Save Changes"}
                    </button>
                </div>

                <div className="pat-settings-layout">

                    {/* ===== LEFT SIDEBAR ===== */}
                    <div className="pat-profile-sidebar">

                        {/* Avatar Card */}
                        <div className="pat-avatar-card">
                            <div className="pat-avatar-wrapper">
                                <div className="pat-avatar-circle">
                                    {photoPreview ? (
                                        <img src={photoPreview} alt="Profile" className="pat-avatar-img" />
                                    ) : (
                                        <span className="pat-avatar-initials">
                                            {(personal.firstName[0] || "?")}{(personal.lastName[0] || "")}
                                        </span>
                                    )}
                                </div>
                                <button
                                    className="pat-avatar-edit-btn"
                                    onClick={() => fileInputRef.current.click()}
                                    title="Change Photo"
                                >
                                    📷
                                </button>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={handlePhotoChange}
                            />
                            <h3 className="pat-avatar-name">{personal.firstName} {personal.lastName}</h3>
                            <span className="pat-avatar-role">Patient</span>
                            {medical.conditions && (
                                <div className="pat-health-badge">🩺 {medical.conditions.split("–")[0].trim()}</div>
                            )}
                            <button
                                className="pat-change-photo-btn"
                                onClick={() => fileInputRef.current.click()}
                            >
                                📁 Change Photo
                            </button>
                        </div>

                        {/* Quick Info Card */}
                        <div className="pat-quick-info-card">
                            <h4 className="pat-quick-info-title">Quick Info</h4>
                            <div className="pat-qi-item">
                                <span>🩸</span>
                                <div>
                                    <p className="pat-qi-label">Blood Group</p>
                                    <p className="pat-qi-value">{medical.bloodGroup || "—"}</p>
                                </div>
                            </div>
                            <div className="pat-qi-item">
                                <span>👨‍⚕️</span>
                                <div>
                                    <p className="pat-qi-label">Primary Doctor</p>
                                    <p className="pat-qi-value">{medical.primaryDoctor || "—"}</p>
                                </div>
                            </div>
                            <div className="pat-qi-item">
                                <span>📅</span>
                                <div>
                                    <p className="pat-qi-label">Next Appointment</p>
                                    <p className="pat-qi-value">{medical.nextAppointment || "—"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Tab Nav */}
                        <div className="pat-settings-nav">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    className={`pat-settings-nav-btn ${activeTab === tab.id ? "active" : ""}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <span>{tab.icon}</span> {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ===== RIGHT CONTENT ===== */}
                    <div className="pat-settings-content">

                        {/* Personal Info Tab */}
                        {activeTab === "personal" && (
                            <div className="pat-settings-section">
                                <div className="pat-section-header">
                                    <h3>Personal Information</h3>
                                    <p>Your basic contact and personal details</p>
                                </div>
                                <div className="pat-form-grid">
                                    <div className="pat-form-group">
                                        <label>First Name</label>
                                        <input className="pat-settings-input" value={personal.firstName}
                                            onChange={e => setPersonal({ ...personal, firstName: e.target.value })} />
                                    </div>
                                    <div className="pat-form-group">
                                        <label>Last Name</label>
                                        <input className="pat-settings-input" value={personal.lastName}
                                            onChange={e => setPersonal({ ...personal, lastName: e.target.value })} />
                                    </div>
                                    <div className="pat-form-group">
                                        <label>Email Address</label>
                                        <input type="email" className="pat-settings-input" value={personal.email} readOnly
                                            style={{ background: "#f8fafc", cursor: "not-allowed" }} />
                                    </div>
                                    <div className="pat-form-group">
                                        <label>Phone Number</label>
                                        <input type="tel" className="pat-settings-input" value={personal.phone}
                                            onChange={e => setPersonal({ ...personal, phone: e.target.value })} />
                                    </div>
                                    <div className="pat-form-group">
                                        <label>Date of Birth</label>
                                        <input type="date" className="pat-settings-input" value={personal.dateOfBirth}
                                            onChange={e => setPersonal({ ...personal, dateOfBirth: e.target.value })} />
                                    </div>
                                    <div className="pat-form-group">
                                        <label>Gender</label>
                                        <select className="pat-settings-input" value={personal.gender}
                                            onChange={e => setPersonal({ ...personal, gender: e.target.value })}>
                                            <option>Male</option>
                                            <option>Female</option>
                                            <option>Other</option>
                                            <option>Prefer not to say</option>
                                        </select>
                                    </div>
                                    <div className="pat-form-group full-width">
                                        <label>Home Address</label>
                                        <input className="pat-settings-input" value={personal.address}
                                            onChange={e => setPersonal({ ...personal, address: e.target.value })} />
                                    </div>
                                </div>
                                <div className="pat-form-actions">
                                    <button className="pat-btn-secondary" onClick={() => window.location.reload()}>Cancel</button>
                                    <button className="pat-btn-primary" onClick={handleSave} disabled={saving}>
                                        {saving ? "Saving…" : "Save Info"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Medical Info Tab */}
                        {activeTab === "medical" && (
                            <div className="pat-settings-section">
                                <div className="pat-section-header">
                                    <h3>Medical Information</h3>
                                    <p>Your health details and medical history</p>
                                </div>

                                {medical.conditions && (
                                    <div className="pat-health-alert">
                                        🩺 Condition: <strong>{medical.conditions}</strong>
                                    </div>
                                )}

                                <div className="pat-form-grid">
                                    <div className="pat-form-group">
                                        <label>Blood Group</label>
                                        <input className="pat-settings-input" value={medical.bloodGroup}
                                            onChange={e => setMedical({ ...medical, bloodGroup: e.target.value })} />
                                    </div>
                                    <div className="pat-form-group">
                                        <label>Age</label>
                                        <input className="pat-settings-input" value={medical.age}
                                            onChange={e => setMedical({ ...medical, age: e.target.value })} />
                                    </div>
                                    <div className="pat-form-group">
                                        <label>Weight</label>
                                        <input className="pat-settings-input" value={medical.weight}
                                            onChange={e => setMedical({ ...medical, weight: e.target.value })} />
                                    </div>
                                    <div className="pat-form-group">
                                        <label>Height</label>
                                        <input className="pat-settings-input" value={medical.height}
                                            onChange={e => setMedical({ ...medical, height: e.target.value })} />
                                    </div>
                                    <div className="pat-form-group">
                                        <label>Primary Doctor</label>
                                        <input className="pat-settings-input" value={medical.primaryDoctor}
                                            onChange={e => setMedical({ ...medical, primaryDoctor: e.target.value })} />
                                    </div>
                                    <div className="pat-form-group">
                                        <label>Last Visit</label>
                                        <input className="pat-settings-input" value={medical.lastVisit}
                                            onChange={e => setMedical({ ...medical, lastVisit: e.target.value })} />
                                    </div>
                                    <div className="pat-form-group">
                                        <label>Next Appointment</label>
                                        <input className="pat-settings-input" value={medical.nextAppointment}
                                            onChange={e => setMedical({ ...medical, nextAppointment: e.target.value })} />
                                    </div>
                                    <div className="pat-form-group full-width">
                                        <label>Diagnosed Conditions</label>
                                        <input className="pat-settings-input" value={medical.conditions}
                                            onChange={e => setMedical({ ...medical, conditions: e.target.value })} />
                                    </div>
                                    <div className="pat-form-group full-width">
                                        <label>Known Allergies</label>
                                        <input className="pat-settings-input" value={medical.allergies}
                                            onChange={e => setMedical({ ...medical, allergies: e.target.value })} />
                                    </div>
                                    <div className="pat-form-group full-width">
                                        <label>Current Medications</label>
                                        <textarea className="pat-settings-input pat-settings-textarea"
                                            value={medical.currentMedications} rows={3}
                                            onChange={e => setMedical({ ...medical, currentMedications: e.target.value })} />
                                    </div>
                                </div>
                                <div className="pat-form-actions">
                                    <button className="pat-btn-secondary" onClick={() => window.location.reload()}>Cancel</button>
                                    <button className="pat-btn-primary" onClick={handleSave} disabled={saving}>
                                        {saving ? "Saving…" : "Save Medical Info"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Emergency Tab */}
                        {activeTab === "emergency" && (
                            <div className="pat-settings-section">
                                <div className="pat-section-header">
                                    <h3>Emergency Contacts</h3>
                                    <p>People to contact in case of an emergency</p>
                                </div>

                                <div className="pat-notif-group-label">Primary Contact</div>
                                <div className="pat-form-grid">
                                    <div className="pat-form-group">
                                        <label>Full Name</label>
                                        <input className="pat-settings-input" value={emergency.contactName}
                                            onChange={e => setEmergency({ ...emergency, contactName: e.target.value })} />
                                    </div>
                                    <div className="pat-form-group">
                                        <label>Relationship</label>
                                        <input className="pat-settings-input" value={emergency.relationship}
                                            onChange={e => setEmergency({ ...emergency, relationship: e.target.value })} />
                                    </div>
                                    <div className="pat-form-group">
                                        <label>Phone</label>
                                        <input className="pat-settings-input" value={emergency.contactPhone}
                                            onChange={e => setEmergency({ ...emergency, contactPhone: e.target.value })} />
                                    </div>
                                    <div className="pat-form-group">
                                        <label>Email</label>
                                        <input type="email" className="pat-settings-input" value={emergency.contactEmail}
                                            onChange={e => setEmergency({ ...emergency, contactEmail: e.target.value })} />
                                    </div>
                                </div>

                                <div className="pat-notif-group-label" style={{ marginTop: "24px" }}>Alternate Contact</div>
                                <div className="pat-form-grid">
                                    <div className="pat-form-group">
                                        <label>Full Name</label>
                                        <input className="pat-settings-input" value={emergency.altContactName}
                                            onChange={e => setEmergency({ ...emergency, altContactName: e.target.value })} />
                                    </div>
                                    <div className="pat-form-group">
                                        <label>Relationship</label>
                                        <input className="pat-settings-input" value={emergency.altRelationship}
                                            onChange={e => setEmergency({ ...emergency, altRelationship: e.target.value })} />
                                    </div>
                                    <div className="pat-form-group full-width">
                                        <label>Phone</label>
                                        <input className="pat-settings-input" value={emergency.altPhone}
                                            onChange={e => setEmergency({ ...emergency, altPhone: e.target.value })} />
                                    </div>
                                </div>

                                {emergency.assignedCaregiver && (
                                    <>
                                        <div className="pat-notif-group-label" style={{ marginTop: "24px" }}>Assigned Caregiver</div>
                                        <div className="pat-toggle-list">
                                            <div className="pat-toggle-item">
                                                <div>
                                                    <p className="pat-toggle-label">{emergency.assignedCaregiver}</p>
                                                    <p className="pat-toggle-description">{emergency.caregiverPhone}</p>
                                                </div>
                                                <span style={{ background: "#f0fdf4", color: "#16a34a", padding: "4px 14px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700 }}>
                                                    Active
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="pat-form-actions">
                                    <button className="pat-btn-secondary" onClick={() => window.location.reload()}>Cancel</button>
                                    <button className="pat-btn-primary" onClick={handleSave} disabled={saving}>
                                        {saving ? "Saving…" : "Save Contacts"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Preferences Tab */}
                        {activeTab === "preferences" && (
                            <div className="pat-settings-section">
                                <div className="pat-section-header">
                                    <h3>Preferences</h3>
                                    <p>Manage reminders, alerts, and display preferences</p>
                                </div>

                                <div className="pat-notif-group-label">Health Reminders</div>
                                <div className="pat-toggle-list">
                                    {[
                                        { key: "medicationReminders", label: "Medication Reminders", desc: "Get notified when it's time to take your medicine" },
                                        { key: "appointmentAlerts", label: "Appointment Alerts", desc: "Reminders before upcoming appointments" },
                                    ].map(item => (
                                        <div className="pat-toggle-item" key={item.key}>
                                            <div>
                                                <p className="pat-toggle-label">{item.label}</p>
                                                <p className="pat-toggle-description">{item.desc}</p>
                                            </div>
                                            <label className="pat-toggle-switch">
                                                <input type="checkbox" checked={preferences[item.key]}
                                                    onChange={e => setPreferences({ ...preferences, [item.key]: e.target.checked })} />
                                                <span className="pat-toggle-slider"></span>
                                            </label>
                                        </div>
                                    ))}
                                </div>

                                <div className="pat-notif-group-label" style={{ marginTop: "24px" }}>Notification Channels</div>
                                <div className="pat-toggle-list">
                                    {[
                                        { key: "emailNotifications", label: "Email Notifications", desc: "Receive updates and reminders via email" },
                                        { key: "smsNotifications", label: "SMS Notifications", desc: "Receive alerts via text message" },
                                    ].map(item => (
                                        <div className="pat-toggle-item" key={item.key}>
                                            <div>
                                                <p className="pat-toggle-label">{item.label}</p>
                                                <p className="pat-toggle-description">{item.desc}</p>
                                            </div>
                                            <label className="pat-toggle-switch">
                                                <input type="checkbox" checked={preferences[item.key]}
                                                    onChange={e => setPreferences({ ...preferences, [item.key]: e.target.checked })} />
                                                <span className="pat-toggle-slider"></span>
                                            </label>
                                        </div>
                                    ))}
                                </div>

                                <div className="pat-form-grid" style={{ marginTop: "24px" }}>
                                    <div className="pat-form-group">
                                        <label>Language</label>
                                        <select className="pat-settings-input" value={preferences.language}
                                            onChange={e => setPreferences({ ...preferences, language: e.target.value })}>
                                            <option>English</option>
                                            <option>Spanish</option>
                                            <option>French</option>
                                            <option>Hindi</option>
                                        </select>
                                    </div>
                                    <div className="pat-form-group">
                                        <label>Timezone</label>
                                        <select className="pat-settings-input" value={preferences.timezone}
                                            onChange={e => setPreferences({ ...preferences, timezone: e.target.value })}>
                                            <option>UTC-8 (Pacific)</option>
                                            <option>UTC-5 (Eastern)</option>
                                            <option>UTC+5:30 (IST)</option>
                                            <option>UTC+0 (GMT)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pat-form-actions">
                                    <button className="pat-btn-secondary" onClick={() => window.location.reload()}>Reset Defaults</button>
                                    <button className="pat-btn-primary" onClick={handleSave} disabled={saving}>
                                        {saving ? "Saving…" : "Save Preferences"}
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </PatientLayout>
    );
}

export default Profile;
