import { useEffect, useState } from "react";
import DoctorLayout from "../layouts/DoctorLayout";
import "../styles/DoctorDashboard.css";
import api from "../../services/api";

function DoctorProfile() {
    const [profile, setProfile] = useState(null);
    const [patientCount, setPatientCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [profileError, setProfileError] = useState("");

    useEffect(() => {
        const load = async () => {
            // ── 1. Always try localStorage first as instant fallback ──
            const stored = localStorage.getItem("user");
            let localUser = null;
            if (stored) {
                try { localUser = JSON.parse(stored); } catch (_) { }
            }

            // ── 2. Fetch profile from backend (non-fatal if it fails) ──
            try {
                const res = await api.get("/doctor/profile");
                setProfile(res.data.profile);
            } catch (err) {
                console.warn("Profile API error:", err.response?.status, err.message);
                if (localUser) {
                    // Build a profile object from localStorage data
                    setProfile({
                        firstName: localUser.firstName || "",
                        lastName: localUser.lastName || "",
                        email: localUser.email || "",
                        phone: "",
                        specialization: "",
                        licenseNo: "",
                        department: "",
                        hospital: "",
                        experience: "",
                        opdTiming: "",
                        ward: "",
                        bio: "",
                        joinDate: "",
                        patientCount: 0,
                    });
                    setProfileError(
                        err.response?.status === 404
                            ? "Your doctor profile has not been fully set up yet. Fill in your details in Settings."
                            : "Could not reach the server. Showing cached data."
                    );
                } else {
                    setProfileError("Failed to load profile. Make sure the backend is running and you are logged in.");
                }
            }

            // ── 3. Fetch assigned patients (non-fatal) ──
            try {
                const pRes = await api.get("/doctor/my-patients");
                setPatientCount((pRes.data || []).length);
            } catch (_) {
                // Silently ignore — not critical for profile display
            }

            setLoading(false);
        };

        load();
    }, []);

    if (loading) {
        return (
            <DoctorLayout>
                <h2>My Profile</h2>
                <div style={{ textAlign: "center", padding: "48px", color: "#64748b" }}>Loading profile…</div>
            </DoctorLayout>
        );
    }

    // If we have no profile at all (not even localStorage)
    if (!profile) {
        return (
            <DoctorLayout>
                <h2>My Profile</h2>
                <div style={{ padding: "20px 24px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", color: "#ef4444", marginTop: "16px" }}>
                    ⚠️ {profileError || "Could not load profile. Make sure you are logged in and the backend is running."}
                </div>
            </DoctorLayout>
        );
    }

    const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.email;
    const displayName = fullName ? `Dr. ${fullName}` : "Doctor";

    return (
        <DoctorLayout>
            <h2>My Profile</h2>

            {/* Soft warning banner if profile is incomplete */}
            {profileError && (
                <div style={{
                    padding: "12px 20px",
                    background: "#fffbeb",
                    border: "1px solid #fde68a",
                    borderRadius: "10px",
                    color: "#92400e",
                    fontSize: "0.85rem",
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                }}>
                    ⚠️ {profileError}
                </div>
            )}

            <div className="doctor-profile-grid">
                {/* Doctor Info Card */}
                <div className="doctor-profile-card doctor-profile-main">
                    <div className="doctor-avatar-section">
                        <div className="doctor-avatar-circle">
                            <span style={{ fontSize: "3rem" }}>👨‍⚕️</span>
                        </div>
                        <div className="doctor-avatar-info">
                            <h3>{displayName}</h3>
                            <p className="doctor-specialty-badge">
                                {profile.specialization || "Specialist"}
                            </p>
                            {profile.licenseNo && (
                                <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "4px" }}>
                                    License No: {profile.licenseNo}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="doctor-info-grid">
                        <div className="doctor-info-item">
                            <span className="doctor-info-label">Email</span>
                            <span className="doctor-info-value">{profile.email || "—"}</span>
                        </div>
                        <div className="doctor-info-item">
                            <span className="doctor-info-label">Phone</span>
                            <span className="doctor-info-value">{profile.phone || "—"}</span>
                        </div>
                        <div className="doctor-info-item">
                            <span className="doctor-info-label">Specialization</span>
                            <span className="doctor-info-value">{profile.specialization || "—"}</span>
                        </div>
                        <div className="doctor-info-item">
                            <span className="doctor-info-label">Experience</span>
                            <span className="doctor-info-value">
                                {profile.experience ? `${profile.experience} Years` : "—"}
                            </span>
                        </div>
                        <div className="doctor-info-item">
                            <span className="doctor-info-label">Department</span>
                            <span className="doctor-info-value">{profile.department || "—"}</span>
                        </div>
                        <div className="doctor-info-item">
                            <span className="doctor-info-label">Joined</span>
                            <span className="doctor-info-value">{profile.joinDate || "—"}</span>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="doctor-profile-stats">
                    <div className="doctor-stat-card blue">
                        <div className="doctor-stat-icon">👥</div>
                        <div className="doctor-stat-number">{patientCount}</div>
                        <div className="doctor-stat-label">Assigned Patients</div>
                    </div>
                    <div className="doctor-stat-card green">
                        <div className="doctor-stat-icon">✅</div>
                        <div className="doctor-stat-number">—</div>
                        <div className="doctor-stat-label">Total Consultations</div>
                    </div>
                    <div className="doctor-stat-card purple">
                        <div className="doctor-stat-icon">📋</div>
                        <div className="doctor-stat-number">—</div>
                        <div className="doctor-stat-label">Reports Filed</div>
                    </div>
                    <div className="doctor-stat-card orange">
                        <div className="doctor-stat-icon">⭐</div>
                        <div className="doctor-stat-number">—</div>
                        <div className="doctor-stat-label">Patient Rating</div>
                    </div>
                </div>
            </div>

            {/* Clinic & Contact Info */}
            <div className="doctor-profile-section-grid">
                <div className="doctor-info-section-card">
                    <h4 className="doctor-section-title">🏥 Clinic Information</h4>
                    <div className="doctor-info-grid">
                        <div className="doctor-info-item">
                            <span className="doctor-info-label">Hospital</span>
                            <span className="doctor-info-value">{profile.hospital || "—"}</span>
                        </div>
                        <div className="doctor-info-item">
                            <span className="doctor-info-label">Ward</span>
                            <span className="doctor-info-value">{profile.ward || "—"}</span>
                        </div>
                        <div className="doctor-info-item">
                            <span className="doctor-info-label">OPD Timing</span>
                            <span className="doctor-info-value">{profile.opdTiming || "—"}</span>
                        </div>
                        <div className="doctor-info-item">
                            <span className="doctor-info-label">Location</span>
                            <span className="doctor-info-value">{profile.location || "—"}</span>
                        </div>
                    </div>
                </div>

                {profile.bio && (
                    <div className="doctor-info-section-card">
                        <h4 className="doctor-section-title">📝 About</h4>
                        <p style={{ color: "#475569", fontSize: "0.9rem", lineHeight: 1.6 }}>
                            {profile.bio}
                        </p>
                    </div>
                )}
            </div>
        </DoctorLayout>
    );
}

export default DoctorProfile;
