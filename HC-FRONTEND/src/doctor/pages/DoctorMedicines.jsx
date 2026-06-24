import { useState, useEffect } from "react";
import DoctorLayout from "../layouts/DoctorLayout";
import "../styles/DoctorDashboard.css";
import { PillIcon, AlertIcon, FileTextIcon, ClipboardIcon } from "../../shared/components/Icons";
import api from "../../services/api";

const CATEGORIES = ["All", "Antipsychotic", "Antidepressant", "Mood Stabiliser", "Benzodiazepine", "Hypnotic", "Anti-Dementia"];

const CAT_COLORS = {
    Antipsychotic: "cat-antipsychotic",
    Antidepressant: "cat-antidepressant",
    "Mood Stabiliser": "cat-mood",
    Benzodiazepine: "cat-benzo",
    Hypnotic: "cat-hypnotic",
    "Anti-Dementia": "cat-dementia",
};

// ── Component ──────────────────────────────────────────────────────────────────
export default function DoctorMedicines() {
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeCategory, setActiveCategory] = useState("All");
    const [search, setSearch] = useState("");
    const [showLicensedOnly, setShowLicensedOnly] = useState(false);

    // ── Fetch from backend ──────────────────────────────────────────────────
    useEffect(() => {
        async function fetchMedicines() {
            try {
                setLoading(true);
                const { data } = await api.get("/doctor/medicines");
                setMedicines(data);
                setError(null);
            } catch (err) {
                console.error("Failed to load medicines:", err);
                setError("Failed to load medicines. Please try again later.");
            } finally {
                setLoading(false);
            }
        }
        fetchMedicines();
    }, []);

    // ── Derived counts ──────────────────────────────────────────────────────
    const catCounts = {};
    CATEGORIES.slice(1).forEach(c => { catCounts[c] = medicines.filter(m => m.category === c).length; });

    const filtered = medicines.filter(m => {
        const matchCat = activeCategory === "All" || m.category === activeCategory;
        const matchLicensed = !showLicensedOnly || m.licensed;
        const q = search.toLowerCase();
        const matchSearch =
            !q ||
            m.name.toLowerCase().includes(q) ||
            m.generic.toLowerCase().includes(q) ||
            m.indication.toLowerCase().includes(q) ||
            m.category.toLowerCase().includes(q);
        return matchCat && matchLicensed && matchSearch;
    });

    // ── Loading / error states ──────────────────────────────────────────────
    if (loading) {
        return (
            <DoctorLayout>
                <div className="doctor-dashboard-header">
                    <h2>💊 Medicines &amp; Drug Reference</h2>
                    <p className="doctor-dashboard-subtitle">
                        Specialised &amp; licensed psychiatric medications — for reference and prescribing.
                    </p>
                </div>
                <div className="staff-empty" style={{ marginTop: "2rem" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "8px" }}>⏳</div>
                    <p style={{ fontWeight: 600, color: "#1e293b" }}>Loading medicines…</p>
                </div>
            </DoctorLayout>
        );
    }

    if (error) {
        return (
            <DoctorLayout>
                <div className="doctor-dashboard-header">
                    <h2>💊 Medicines &amp; Drug Reference</h2>
                </div>
                <div className="staff-empty" style={{ marginTop: "2rem" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "8px" }}>⚠️</div>
                    <p style={{ fontWeight: 600, color: "#dc2626" }}>{error}</p>
                </div>
            </DoctorLayout>
        );
    }

    return (
        <DoctorLayout>
            {/* Header */}
            <div className="doctor-dashboard-header">
                <h2>💊 Medicines &amp; Drug Reference</h2>
                <p className="doctor-dashboard-subtitle">
                    Specialised &amp; licensed psychiatric medications — for reference and prescribing.
                </p>
            </div>

            {/* Stats */}
            <div className="med-stats-row">
                <div className="med-stat-pill blue">
                    <span className="med-stat-icon"><PillIcon /></span>
                    <span className="med-stat-num">{medicines.length}</span>
                    <span className="med-stat-lbl">Total Drugs</span>
                </div>
                <div className="med-stat-pill red">
                    <span className="med-stat-icon"><AlertIcon /></span>
                    <span className="med-stat-num">{medicines.filter(m => m.licensed).length}</span>
                    <span className="med-stat-lbl">Requires Special License</span>
                </div>
                <div className="med-stat-pill purple">
                    <span className="med-stat-icon"><FileTextIcon /></span>
                    <span className="med-stat-num">{catCounts["Antipsychotic"] ?? 0}</span>
                    <span className="med-stat-lbl">Antipsychotics</span>
                </div>
                <div className="med-stat-pill green">
                    <span className="med-stat-icon"><ClipboardIcon /></span>
                    <span className="med-stat-num">{catCounts["Antidepressant"] ?? 0}</span>
                    <span className="med-stat-lbl">Antidepressants</span>
                </div>
                <div className="med-stat-pill orange">
                    <span className="med-stat-num">{catCounts["Mood Stabiliser"] ?? 0}</span>
                    <span className="med-stat-lbl">Mood Stabilisers</span>
                </div>
            </div>

            {/* Controls */}
            <div className="med-controls">
                <div className="med-filter-tabs">
                    {CATEGORIES.map(c => (
                        <button
                            key={c}
                            className={`med-tab-btn ${activeCategory === c ? "active" : ""}`}
                            onClick={() => setActiveCategory(c)}
                        >
                            {c}
                            {c !== "All" && (
                                <span className="med-tab-count">{catCounts[c] ?? 0}</span>
                            )}
                        </button>
                    ))}
                </div>
                <div className="med-right-controls">
                    <input
                        className="med-search-input"
                        type="text"
                        placeholder="🔍  Search drug, indication…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <label className="med-licensed-toggle">
                        <input
                            type="checkbox"
                            checked={showLicensedOnly}
                            onChange={e => setShowLicensedOnly(e.target.checked)}
                        />
                        <span>Licensed Only</span>
                    </label>
                </div>
            </div>

            {/* Table */}
            <div className="med-table-wrapper">
                {filtered.length === 0 ? (
                    <div className="staff-empty">
                        <div style={{ fontSize: "2rem", marginBottom: "8px" }}>💊</div>
                        <p style={{ fontWeight: 600, color: "#1e293b" }}>No medicines found</p>
                        <p style={{ color: "#64748b", fontSize: "0.85rem" }}>Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    <table className="med-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Drug Name</th>
                                <th>Generic Name</th>
                                <th>Category</th>
                                <th>Schedule</th>
                                <th>Dosage Range</th>
                                <th>Indication</th>
                                <th>Form</th>
                                <th>Monitoring</th>
                                <th>License</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((med, idx) => (
                                <tr key={med._id} className={med.licensed ? "med-row-licensed" : ""}>
                                    <td className="med-idx" data-label="#">{idx + 1}</td>
                                    <td data-label="Drug Name">
                                        <span className="med-drug-name">{med.name}</span>
                                    </td>
                                    <td className="med-generic" data-label="Generic Name">{med.generic}</td>
                                    <td data-label="Category">
                                        <span className={`med-cat-badge ${CAT_COLORS[med.category]}`}>
                                            {med.category}
                                        </span>
                                    </td>
                                    <td data-label="Schedule">
                                        <span className={`med-schedule-badge ${med.schedule.includes("X") ? "schedule-x" : med.schedule.includes("H1") ? "schedule-h1" : "schedule-h"}`}>
                                            {med.schedule}
                                        </span>
                                    </td>
                                    <td className="med-dosage" data-label="Dosage Range">{med.dosage}</td>
                                    <td className="med-indication" data-label="Indication">{med.indication}</td>
                                    <td className="med-form" data-label="Form">{med.form}</td>
                                    <td className="med-monitor" data-label="Monitoring">{med.monitor}</td>
                                    <td data-label="License">
                                        {med.licensed ? (
                                            <span className="med-licensed-badge">⚠ Licensed</span>
                                        ) : (
                                            <span className="med-standard-badge">Standard</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                <p className="med-disclaimer">
                    ⚕️ This is a reference guide for qualified doctors only. All prescriptions must comply with applicable drug laws and hospital protocols.
                </p>
            </div>
        </DoctorLayout>
    );
}
