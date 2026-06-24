import { useState, useRef, useEffect } from "react";
import AdminLayout from "../layouts/AdminLayout";
import "../styles/AdminDashboard.css";
import "../styles/Settings.css";
import api from "../../services/api";

function Settings() {
    const fileInputRef = useRef(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [activeTab, setActiveTab] = useState("profile");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [statusMsg, setStatusMsg] = useState(null); // { type: 'success'|'error', text }

    const [profile, setProfile] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        role: "System Administrator",
        department: "Healthcare Management",
        location: "",
        bio: "",
        joinDate: "",
        employeeId: "",
    });

    const [security, setSecurity] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        twoFactor: true,
        sessionTimeout: "30",
    });

    const [notifications, setNotifications] = useState({
        emailAlerts: true,
        smsAlerts: false,
        newPatientAlert: true,
        caregiverAssignment: true,
        systemUpdates: false,
        weeklyReport: true,
    });

    const [preferences, setPreferences] = useState({
        darkMode: false,
        language: "English",
        timezone: "UTC-5 (Eastern)",
        dateFormat: "MM/DD/YYYY",
    });

    // ── Load admin profile on mount ───────────────────────────
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await api.get("/admin/profile");

                if (data.profile) setProfile(prev => ({ ...prev, ...data.profile }));
                if (data.notifications) setNotifications(prev => ({ ...prev, ...data.notifications }));
                if (data.preferences) setPreferences(prev => ({ ...prev, ...data.preferences }));
            } catch (err) {
                console.error("Failed to load admin profile:", err);
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

    const handleProfileChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    // ── Save handler ──────────────────────────────────────────
    const handleSave = async () => {
        setSaving(true);
        setStatusMsg(null);
        try {
            await api.put("/admin/profile", {
                profile: {
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    phone: profile.phone,
                    department: profile.department,
                    location: profile.location,
                    bio: profile.bio,
                },
                notifications,
                preferences,
            });
            setStatusMsg({ type: "success", text: "✅ Settings saved successfully!" });
        } catch (err) {
            console.error("Failed to save settings:", err);
            setStatusMsg({ type: "error", text: "❌ Failed to save settings. Please try again." });
        } finally {
            setSaving(false);
            setTimeout(() => setStatusMsg(null), 4000);
        }
    };

    const tabs = [
        { id: "profile", label: "Profile", icon: "👤" },
        { id: "security", label: "Security", icon: "🔒" },
        { id: "notifications", label: "Notifications", icon: "🔔" },
        { id: "preferences", label: "Preferences", icon: "⚙️" },
    ];

    if (loading) {
        return (
            <AdminLayout>
                <div className="settings-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
                    <p style={{ color: "#64748b", fontSize: "1.1rem" }}>⏳ Loading settings…</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="settings-page">

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
                <div className="settings-header">
                    <div>
                        <h2 className="settings-title">Account Settings</h2>
                        <p className="settings-subtitle">Manage your profile, security, and preferences</p>
                    </div>
                    <button className="save-btn-header" onClick={handleSave} disabled={saving}>
                        <span>💾</span> {saving ? "Saving…" : "Save Changes"}
                    </button>
                </div>

                <div className="settings-layout">
                    {/* Left Panel - Profile Card */}
                    <div className="profile-sidebar">
                        {/* Avatar Section */}
                        <div className="avatar-card">
                            <div className="avatar-wrapper">
                                <div className="avatar-circle">
                                    {photoPreview ? (
                                        <img src={photoPreview} alt="Profile" className="avatar-img" />
                                    ) : (
                                        <span className="avatar-initials">
                                            {(profile.firstName[0] || "?")}{(profile.lastName[0] || "")}
                                        </span>
                                    )}
                                </div>
                                <button
                                    className="avatar-edit-btn"
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
                            <h3 className="avatar-name">{profile.firstName} {profile.lastName}</h3>
                            <span className="avatar-role">{profile.role}</span>
                            <button
                                className="change-photo-btn"
                                onClick={() => fileInputRef.current.click()}
                            >
                                📁 Change Photo
                            </button>
                        </div>

                        {/* Quick Info Card */}
                        <div className="quick-info-card">
                            <h4 className="quick-info-title">Quick Info</h4>
                            <div className="quick-info-item">
                                <span className="qi-icon">🏢</span>
                                <div>
                                    <p className="qi-label">Department</p>
                                    <p className="qi-value">{profile.department || "—"}</p>
                                </div>
                            </div>
                            <div className="quick-info-item">
                                <span className="qi-icon">📍</span>
                                <div>
                                    <p className="qi-label">Location</p>
                                    <p className="qi-value">{profile.location || "—"}</p>
                                </div>
                            </div>
                            <div className="quick-info-item">
                                <span className="qi-icon">🗓️</span>
                                <div>
                                    <p className="qi-label">Member Since</p>
                                    <p className="qi-value">{profile.joinDate || "—"}</p>
                                </div>
                            </div>
                            <div className="quick-info-item">
                                <span className="qi-icon">🪪</span>
                                <div>
                                    <p className="qi-label">Employee ID</p>
                                    <p className="qi-value">{profile.employeeId || "—"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Tab Navigation */}
                        <div className="settings-nav">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    className={`settings-nav-btn ${activeTab === tab.id ? "active" : ""}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <span>{tab.icon}</span> {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right Panel - Settings Content */}
                    <div className="settings-content">

                        {/* Profile Tab */}
                        {activeTab === "profile" && (
                            <div className="settings-section">
                                <div className="section-header">
                                    <h3>Personal Information</h3>
                                    <p>Update your personal details and professional information</p>
                                </div>

                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>First Name</label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={profile.firstName}
                                            onChange={handleProfileChange}
                                            className="settings-input"
                                            placeholder="First Name"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Last Name</label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            value={profile.lastName}
                                            onChange={handleProfileChange}
                                            className="settings-input"
                                            placeholder="Last Name"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Email Address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={profile.email}
                                            className="settings-input"
                                            placeholder="Email Address"
                                            readOnly
                                            style={{ background: "#f8fafc", cursor: "not-allowed" }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone Number</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={profile.phone}
                                            onChange={handleProfileChange}
                                            className="settings-input"
                                            placeholder="Phone Number"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Role</label>
                                        <input
                                            type="text"
                                            name="role"
                                            value={profile.role}
                                            className="settings-input"
                                            readOnly
                                            style={{ background: "#f8fafc", cursor: "not-allowed" }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Department</label>
                                        <input
                                            type="text"
                                            name="department"
                                            value={profile.department}
                                            onChange={handleProfileChange}
                                            className="settings-input"
                                            placeholder="Department"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Location</label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={profile.location}
                                            onChange={handleProfileChange}
                                            className="settings-input"
                                            placeholder="City, Country"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Employee ID</label>
                                        <input
                                            type="text"
                                            name="employeeId"
                                            value={profile.employeeId}
                                            className="settings-input"
                                            readOnly
                                            style={{ background: "#f8fafc", cursor: "not-allowed" }}
                                        />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Bio / About</label>
                                        <textarea
                                            name="bio"
                                            value={profile.bio}
                                            onChange={handleProfileChange}
                                            className="settings-input settings-textarea"
                                            placeholder="Write a short bio..."
                                            rows={3}
                                        />
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button className="btn-secondary" onClick={() => window.location.reload()}>Cancel</button>
                                    <button className="btn-primary" onClick={handleSave} disabled={saving}>
                                        {saving ? "Saving…" : "Save Profile"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Security Tab */}
                        {activeTab === "security" && (
                            <div className="settings-section">
                                <div className="section-header">
                                    <h3>Security Settings</h3>
                                    <p>Manage your password and account security options</p>
                                </div>

                                <div className="security-alert">
                                    🔐 Your account is secured with strong encryption
                                </div>

                                <div className="form-grid">
                                    <div className="form-group full-width">
                                        <label>Current Password</label>
                                        <input
                                            type="password"
                                            className="settings-input"
                                            placeholder="Enter current password"
                                            value={security.currentPassword}
                                            onChange={e => setSecurity({ ...security, currentPassword: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>New Password</label>
                                        <input
                                            type="password"
                                            className="settings-input"
                                            placeholder="Enter new password"
                                            value={security.newPassword}
                                            onChange={e => setSecurity({ ...security, newPassword: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Confirm New Password</label>
                                        <input
                                            type="password"
                                            className="settings-input"
                                            placeholder="Confirm new password"
                                            value={security.confirmPassword}
                                            onChange={e => setSecurity({ ...security, confirmPassword: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="toggle-list">
                                    <div className="toggle-item">
                                        <div>
                                            <p className="toggle-label">Two-Factor Authentication</p>
                                            <p className="toggle-description">Add an extra layer of security to your account</p>
                                        </div>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={security.twoFactor}
                                                onChange={e => setSecurity({ ...security, twoFactor: e.target.checked })}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                    <div className="toggle-item">
                                        <div>
                                            <p className="toggle-label">Session Timeout</p>
                                            <p className="toggle-description">Auto logout after inactivity</p>
                                        </div>
                                        <select
                                            className="settings-select"
                                            value={security.sessionTimeout}
                                            onChange={e => setSecurity({ ...security, sessionTimeout: e.target.value })}
                                        >
                                            <option value="15">15 minutes</option>
                                            <option value="30">30 minutes</option>
                                            <option value="60">1 hour</option>
                                            <option value="120">2 hours</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button className="btn-secondary" onClick={() => window.location.reload()}>Cancel</button>
                                    <button className="btn-primary" onClick={handleSave} disabled={saving}>
                                        {saving ? "Saving…" : "Update Security"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Notifications Tab */}
                        {activeTab === "notifications" && (
                            <div className="settings-section">
                                <div className="section-header">
                                    <h3>Notification Preferences</h3>
                                    <p>Control how and when you receive alerts and updates</p>
                                </div>

                                <div className="notif-group-label">Alert Channels</div>
                                <div className="toggle-list">
                                    {[
                                        { key: "emailAlerts", label: "Email Notifications", desc: "Receive alerts and reports via email" },
                                        { key: "smsAlerts", label: "SMS Notifications", desc: "Receive critical alerts via SMS" },
                                    ].map(item => (
                                        <div className="toggle-item" key={item.key}>
                                            <div>
                                                <p className="toggle-label">{item.label}</p>
                                                <p className="toggle-description">{item.desc}</p>
                                            </div>
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={notifications[item.key]}
                                                    onChange={e => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                                                />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>
                                    ))}
                                </div>

                                <div className="notif-group-label" style={{ marginTop: "24px" }}>Event Triggers</div>
                                <div className="toggle-list">
                                    {[
                                        { key: "newPatientAlert", label: "New Patient Registered", desc: "Alert when a new patient is added to the system" },
                                        { key: "caregiverAssignment", label: "Caregiver Assignment", desc: "Alert when a caregiver is assigned to a patient" },
                                        { key: "systemUpdates", label: "System Updates", desc: "Notify about platform updates and maintenance" },
                                        { key: "weeklyReport", label: "Weekly Report", desc: "Receive a weekly summary every Monday" },
                                    ].map(item => (
                                        <div className="toggle-item" key={item.key}>
                                            <div>
                                                <p className="toggle-label">{item.label}</p>
                                                <p className="toggle-description">{item.desc}</p>
                                            </div>
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={notifications[item.key]}
                                                    onChange={e => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                                                />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>
                                    ))}
                                </div>

                                <div className="form-actions">
                                    <button className="btn-secondary" onClick={() => window.location.reload()}>Reset Defaults</button>
                                    <button className="btn-primary" onClick={handleSave} disabled={saving}>
                                        {saving ? "Saving…" : "Save Notifications"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Preferences Tab */}
                        {activeTab === "preferences" && (
                            <div className="settings-section">
                                <div className="section-header">
                                    <h3>System Preferences</h3>
                                    <p>Customize your dashboard experience and display settings</p>
                                </div>

                                <div className="toggle-list">
                                    <div className="toggle-item">
                                        <div>
                                            <p className="toggle-label">Dark Mode</p>
                                            <p className="toggle-description">Enable dark theme across the dashboard</p>
                                        </div>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={preferences.darkMode}
                                                onChange={e => setPreferences({ ...preferences, darkMode: e.target.checked })}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                </div>

                                <div className="form-grid" style={{ marginTop: "24px" }}>
                                    <div className="form-group">
                                        <label>Language</label>
                                        <select
                                            className="settings-input"
                                            value={preferences.language}
                                            onChange={e => setPreferences({ ...preferences, language: e.target.value })}
                                        >
                                            <option>English</option>
                                            <option>Spanish</option>
                                            <option>French</option>
                                            <option>German</option>
                                            <option>Hindi</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Timezone</label>
                                        <select
                                            className="settings-input"
                                            value={preferences.timezone}
                                            onChange={e => setPreferences({ ...preferences, timezone: e.target.value })}
                                        >
                                            <option>UTC-8 (Pacific)</option>
                                            <option>UTC-7 (Mountain)</option>
                                            <option>UTC-6 (Central)</option>
                                            <option>UTC-5 (Eastern)</option>
                                            <option>UTC+5:30 (IST)</option>
                                            <option>UTC+0 (GMT)</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Date Format</label>
                                        <select
                                            className="settings-input"
                                            value={preferences.dateFormat}
                                            onChange={e => setPreferences({ ...preferences, dateFormat: e.target.value })}
                                        >
                                            <option>MM/DD/YYYY</option>
                                            <option>DD/MM/YYYY</option>
                                            <option>YYYY-MM-DD</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button className="btn-secondary" onClick={() => window.location.reload()}>Reset to Default</button>
                                    <button className="btn-primary" onClick={handleSave} disabled={saving}>
                                        {saving ? "Saving…" : "Save Preferences"}
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

export default Settings;

