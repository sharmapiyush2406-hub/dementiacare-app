import { useState, useEffect } from "react";
import DoctorLayout from "../layouts/DoctorLayout";
import "../styles/DoctorDashboard.css";
import api from "../../services/api";

function DoctorSettings() {
    const [notifications, setNotifications] = useState({
        appointmentReminders: true,
        patientAlerts: true,
        reportUpdates: true,
        systemAnnouncements: false,
        emailDigest: true,
    });

    const [profile, setProfile] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        specialization: "",
        department: "",
        hospital: "",
        experience: "",
        opdTiming: "",
        ward: "",
        licenseNo: "",
        bio: "",
    });

    const [saveStatus, setSaveStatus] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/doctor/profile")
            .then((res) => {
                const p = res.data.profile || {};
                const n = res.data.notifications || {};
                setProfile({
                    firstName: p.firstName || "",
                    lastName: p.lastName || "",
                    email: p.email || "",
                    phone: p.phone || "",
                    specialization: p.specialization || "",
                    department: p.department || "",
                    hospital: p.hospital || "",
                    experience: p.experience || "",
                    opdTiming: p.opdTiming || "",
                    ward: p.ward || "",
                    licenseNo: p.licenseNo || "",
                    bio: p.bio || "",
                });
                setNotifications({
                    appointmentReminders: n.appointmentReminders ?? true,
                    patientAlerts: n.patientAlerts ?? true,
                    reportUpdates: n.reportUpdates ?? true,
                    systemAnnouncements: n.systemUpdates ?? false,
                    emailDigest: n.emailDigest ?? true,
                });
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const handleNotificationToggle = (key) => {
        setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSaveProfile = async () => {
        try {
            setSaveStatus("saving");
            await api.put("/doctor/profile", {
                profile: {
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    phone: profile.phone,
                    specialization: profile.specialization,
                    department: profile.department,
                    hospital: profile.hospital,
                    experience: profile.experience,
                    opdTiming: profile.opdTiming,
                    ward: profile.ward,
                    licenseNo: profile.licenseNo,
                    bio: profile.bio,
                },
                notifications: {
                    appointmentReminders: notifications.appointmentReminders,
                    patientAlerts: notifications.patientAlerts,
                    reportUpdates: notifications.reportUpdates,
                    systemUpdates: notifications.systemAnnouncements,
                    emailDigest: notifications.emailDigest,
                },
            });

            // Also update localStorage so Dashboard shows the right name
            const stored = localStorage.getItem("user");
            if (stored) {
                const parsed = JSON.parse(stored);
                parsed.firstName = profile.firstName;
                parsed.lastName = profile.lastName;
                localStorage.setItem("user", JSON.stringify(parsed));
            }

            setSaveStatus("saved");
            setTimeout(() => setSaveStatus(""), 3000);
        } catch (err) {
            setSaveStatus("error");
            setTimeout(() => setSaveStatus(""), 3000);
        }
    };

    return (
        <DoctorLayout>
            <h2>Settings</h2>

            {loading && <p style={{ color: "#64748b" }}>Loading settings…</p>}

            <div className="doctor-settings-grid">
                {/* Profile Settings */}
                <div className="doctor-settings-card">
                    <h4 className="doctor-section-title">👤 Account Settings</h4>
                    <div className="doctor-settings-form">
                        <div className="doctor-form-group">
                            <label>First Name</label>
                            <input
                                type="text"
                                value={profile.firstName}
                                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                                className="doctor-input"
                            />
                        </div>
                        <div className="doctor-form-group">
                            <label>Last Name</label>
                            <input
                                type="text"
                                value={profile.lastName}
                                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                                className="doctor-input"
                            />
                        </div>
                        <div className="doctor-form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={profile.email}
                                disabled
                                className="doctor-input"
                                style={{ opacity: 0.6, cursor: "not-allowed" }}
                            />
                        </div>
                        <div className="doctor-form-group">
                            <label>Phone Number</label>
                            <input
                                type="tel"
                                value={profile.phone}
                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                className="doctor-input"
                            />
                        </div>
                        <div className="doctor-form-group">
                            <label>Specialization</label>
                            <input
                                type="text"
                                value={profile.specialization}
                                onChange={(e) => setProfile({ ...profile, specialization: e.target.value })}
                                className="doctor-input"
                            />
                        </div>
                        <div className="doctor-form-group">
                            <label>License No</label>
                            <input
                                type="text"
                                value={profile.licenseNo}
                                onChange={(e) => setProfile({ ...profile, licenseNo: e.target.value })}
                                className="doctor-input"
                            />
                        </div>
                        <div className="doctor-form-group">
                            <label>Department</label>
                            <input
                                type="text"
                                value={profile.department}
                                onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                                className="doctor-input"
                            />
                        </div>
                        <div className="doctor-form-group">
                            <label>Hospital</label>
                            <input
                                type="text"
                                value={profile.hospital}
                                onChange={(e) => setProfile({ ...profile, hospital: e.target.value })}
                                className="doctor-input"
                            />
                        </div>
                        <div className="doctor-form-group">
                            <label>Experience (years)</label>
                            <input
                                type="text"
                                value={profile.experience}
                                onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                                className="doctor-input"
                            />
                        </div>
                        <div className="doctor-form-group">
                            <label>OPD Timing</label>
                            <input
                                type="text"
                                value={profile.opdTiming}
                                onChange={(e) => setProfile({ ...profile, opdTiming: e.target.value })}
                                className="doctor-input"
                            />
                        </div>
                        <div className="doctor-form-group">
                            <label>Ward</label>
                            <input
                                type="text"
                                value={profile.ward}
                                onChange={(e) => setProfile({ ...profile, ward: e.target.value })}
                                className="doctor-input"
                            />
                        </div>
                        <div className="doctor-form-group">
                            <label>Bio</label>
                            <textarea
                                value={profile.bio}
                                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                className="doctor-input"
                                rows={3}
                                style={{ resize: "vertical" }}
                            />
                        </div>

                        <button
                            className="doctor-save-btn"
                            onClick={handleSaveProfile}
                            disabled={saveStatus === "saving"}
                        >
                            {saveStatus === "saving"
                                ? "Saving…"
                                : saveStatus === "saved"
                                    ? "✓ Saved!"
                                    : saveStatus === "error"
                                        ? "Save Failed"
                                        : "Save Changes"}
                        </button>
                    </div>
                </div>

                {/* Password Change */}
                <div className="doctor-settings-card">
                    <h4 className="doctor-section-title">🔒 Change Password</h4>
                    <div className="doctor-settings-form">
                        <div className="doctor-form-group">
                            <label>Current Password</label>
                            <input type="password" placeholder="••••••••" className="doctor-input" />
                        </div>
                        <div className="doctor-form-group">
                            <label>New Password</label>
                            <input type="password" placeholder="••••••••" className="doctor-input" />
                        </div>
                        <div className="doctor-form-group">
                            <label>Confirm New Password</label>
                            <input type="password" placeholder="••••••••" className="doctor-input" />
                        </div>
                        <button className="doctor-save-btn">Update Password</button>
                    </div>
                </div>

                {/* Notification Preferences */}
                <div className="doctor-settings-card doctor-settings-full-width">
                    <h4 className="doctor-section-title">🔔 Notification Preferences</h4>
                    <div className="doctor-toggle-list">
                        {[
                            { key: "appointmentReminders", label: "Appointment Reminders", desc: "Get notified before each patient appointment" },
                            { key: "patientAlerts", label: "Patient Alerts", desc: "Critical alerts for your assigned patients" },
                            { key: "reportUpdates", label: "Report Updates", desc: "Notifications when reports are ready for review" },
                            { key: "systemAnnouncements", label: "System Announcements", desc: "Platform updates and maintenance notices" },
                            { key: "emailDigest", label: "Weekly Email Digest", desc: "Weekly summary of activity and patient updates" },
                        ].map(({ key, label, desc }) => (
                            <div className="doctor-toggle-row" key={key}>
                                <div className="doctor-toggle-info">
                                    <span className="doctor-toggle-label">{label}</span>
                                    <span className="doctor-toggle-desc">{desc}</span>
                                </div>
                                <div
                                    className={`doctor-toggle-switch ${notifications[key] ? "on" : "off"}`}
                                    onClick={() => handleNotificationToggle(key)}
                                >
                                    <div className="doctor-toggle-knob"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        className="doctor-save-btn"
                        style={{ marginTop: "20px" }}
                        onClick={handleSaveProfile}
                        disabled={saveStatus === "saving"}
                    >
                        {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "✓ Saved!" : "Save Preferences"}
                    </button>
                </div>
            </div>
        </DoctorLayout>
    );
}

export default DoctorSettings;
