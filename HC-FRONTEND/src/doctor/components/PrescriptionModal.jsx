import { useState, useEffect } from "react";
import api from "../../services/api";
import { PillIcon } from "../../shared/components/Icons";

export default function PrescriptionModal({ patient, initialData, onClose, onSuccess }) {
    const [medicines, setMedicines] = useState([]);
    const [loadingMeds, setLoadingMeds] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        medicineName: initialData?.medicineName || "",
        medicineId: initialData?.medicineId || initialData?.medicine || "",
        dosage: initialData?.dosage || "",
        frequency: initialData?.frequency || "",
        instructions: initialData?.instructions || "",
        startDate: initialData?.startDate
            ? new Date(initialData.startDate).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
        endDate: initialData?.endDate
            ? new Date(initialData.endDate).toISOString().split("T")[0]
            : "",
    });

    useEffect(() => {
        async function fetchMedicines() {
            try {
                setLoadingMeds(true);
                const { data } = await api.get("/doctor/medicines");
                setMedicines(data);
            } catch (err) {
                console.error("Failed to fetch medicines", err);
            } finally {
                setLoadingMeds(false);
            }
        }
        fetchMedicines();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (name === "medicineName") {
            const med = medicines.find((m) => m.name === value);
            if (med) {
                setFormData((prev) => ({ ...prev, medicineId: med._id }));
            } else {
                setFormData((prev) => ({ ...prev, medicineId: "" }));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            if (initialData?._id) {
                // Edit mode
                await api.put(`/doctor/prescription/${initialData._id}`, formData);
            } else {
                // Create mode
                await api.post("/doctor/prescribe", {
                    patientId: patient.id,
                    ...formData,
                });
            }
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to assign prescription.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!patient) return null;

    return (
        <div className="presc-modal-overlay">
            <div className="presc-modal-card">
                <div className="presc-modal-header">
                    <div className="presc-modal-title">
                        <PillIcon />
                        <h3>{initialData ? "Edit Prescription" : "Assign Prescription"}</h3>
                    </div>
                    <button className="presc-close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="presc-patient-bar">
                    <span className="presc-label">Patient:</span>
                    <span className="presc-value">{patient.name}</span>
                </div>

                <form onSubmit={handleSubmit} className="presc-form">
                    {error && <div className="presc-error">{error}</div>}

                    <div className="presc-form-group">
                        <label>Medicine Name</label>
                        <input
                            list="medicine-list"
                            name="medicineName"
                            className="presc-input"
                            placeholder="Type or select medicine..."
                            value={formData.medicineName}
                            onChange={handleChange}
                            required
                        />
                        <datalist id="medicine-list">
                            {medicines.map((m) => (
                                <option key={m._id} value={m.name}>
                                    {m.category}
                                </option>
                            ))}
                        </datalist>
                    </div>

                    <div className="presc-form-row">
                        <div className="presc-form-group">
                            <label>Dosage</label>
                            <input
                                name="dosage"
                                className="presc-input"
                                placeholder="e.g. 5mg, 1 tablet"
                                value={formData.dosage}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="presc-form-group">
                            <label>Frequency</label>
                            <input
                                name="frequency"
                                className="presc-input"
                                placeholder="e.g. Twice a day"
                                value={formData.frequency}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="presc-form-row">
                        <div className="presc-form-group">
                            <label>Start Date</label>
                            <input
                                type="date"
                                name="startDate"
                                className="presc-input"
                                value={formData.startDate}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="presc-form-group">
                            <label>End Date (Optional)</label>
                            <input
                                type="date"
                                name="endDate"
                                className="presc-input"
                                value={formData.endDate}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="presc-form-group">
                        <label>Instructions</label>
                        <textarea
                            name="instructions"
                            className="presc-input"
                            placeholder="e.g. Take after meals"
                            rows="3"
                            value={formData.instructions}
                            onChange={handleChange}
                        ></textarea>
                    </div>

                    <div className="presc-modal-footer">
                        <button type="button" className="presc-btn-cancel" onClick={onClose} disabled={submitting}>
                            Cancel
                        </button>
                        <button type="submit" className="presc-btn-submit" disabled={submitting}>
                            {submitting ? "Updating..." : initialData ? "Update Prescription" : "Assign Prescription"}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                .presc-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .presc-modal-card {
                    background: #fff;
                    width: 100%;
                    max-width: 500px;
                    border-radius: 16px;
                    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
                    overflow: hidden;
                    animation: prescModalIn 0.3s ease-out;
                }
                @keyframes prescModalIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .presc-modal-header {
                    padding: 20px 24px;
                    border-bottom: 1px solid #f1f5f9;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .presc-modal-title {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: #3b82f6;
                }
                .presc-modal-title h3 {
                    margin: 0;
                    color: #1e293b;
                    font-size: 1.25rem;
                }
                .presc-close-btn {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    color: #94a3b8;
                    cursor: pointer;
                    line-height: 1;
                }
                .presc-patient-bar {
                    background: #f8fafc;
                    padding: 12px 24px;
                    display: flex;
                    gap: 8px;
                    font-size: 0.9rem;
                    border-bottom: 1px solid #f1f5f9;
                }
                .presc-label { color: #64748b; font-weight: 500; }
                .presc-value { color: #1e293b; font-weight: 600; }
                .presc-form { padding: 24px; }
                .presc-form-group { margin-bottom: 16px; display: flex; flex-direction: column; gap: 6px; }
                .presc-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
                .presc-form-row .presc-form-group { margin-bottom: 0; }
                .presc-form label { font-size: 0.8rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.03em; }
                .presc-input {
                    padding: 10px 14px;
                    border: 1px solid #e2e8f0;
                    border-radius: 10px;
                    font-size: 0.9rem;
                    color: #1e293b;
                    background: #f8fafc;
                    transition: all 0.2s;
                    box-sizing: border-box;
                    width: 100%;
                }
                .presc-input:focus { outline: none; border-color: #3b82f6; background: #fff; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
                .presc-error { background: #fee2e2; color: #dc2626; padding: 10px 14px; border-radius: 8px; font-size: 0.85rem; margin-bottom: 16px; }
                .presc-modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
                .presc-btn-cancel { background: #f1f5f9; color: #475569; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 600; cursor: pointer; }
                .presc-btn-submit { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #fff; border: none; padding: 10px 24px; border-radius: 10px; font-weight: 600; cursor: pointer; }
                .presc-btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }
            `}</style>
        </div>
    );
}
