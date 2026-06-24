import { useState, useEffect, useCallback } from "react";
import CaregiverLayout from "../layouts/CaregiverLayout";
import "../../shared/styles/Dashboard.css";
import api from "../../services/api";
import StatsCard from "../../shared/components/StatsCard";
import { ClipboardIcon, CalendarIcon, ActivityIcon, CheckCircleIcon } from "../../shared/components/Icons";

function Tasks() {
    const [tasks, setTasks] = useState([]);
    const [patients, setPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState(""); // Filter/Assignment patient selection
    
    const [stats, setStats] = useState({
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        missedTasks: 0,
        completionRate: 0
    });

    // Loading, error states
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [error, setError] = useState("");
    
    // Form & Modal states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    
    // Filters & Search
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterPriority, setFilterPriority] = useState("");
    const [filterCategory, setFilterCategory] = useState("");

    // Form State for Create/Edit
    const [formData, setFormData] = useState({
        patientId: "",
        title: "",
        description: "",
        priority: "Medium",
        category: "Medication",
        dueDate: ""
    });

    // Fetch assigned patients
    const fetchPatients = async () => {
        try {
            const { data } = await api.get("/caregiver/my-patients");
            setPatients(data || []);
        } catch (err) {
            console.error("Failed to load patients", err);
        }
    };

    // Fetch stats
    const fetchStats = useCallback(async () => {
        try {
            setStatsLoading(true);
            const params = {};
            if (selectedPatientId) params.patientId = selectedPatientId;
            const { data } = await api.get("/tasks/stats", { params });
            setStats(data);
        } catch (err) {
            console.error("Failed to load task stats", err);
        } finally {
            setStatsLoading(false);
        }
    }, [selectedPatientId]);

    // Fetch tasks list (memoized to prevent infinite renders)
    const fetchTasks = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            
            // Build query params
            const params = {};
            if (selectedPatientId) params.patientId = selectedPatientId;
            if (search) params.search = search;
            if (filterStatus) params.status = filterStatus;
            if (filterPriority) params.priority = filterPriority;
            if (filterCategory) params.category = filterCategory;
            
            const { data } = await api.get("/tasks", { params });
            setTasks(data || []);
        } catch (err) {
            console.error("Failed to load tasks", err);
            setError("Failed to load tasks. Please try again later.");
        } finally {
            setLoading(false);
        }
    }, [selectedPatientId, search, filterStatus, filterPriority, filterCategory]);

    // Hook to load initial data
    useEffect(() => {
        fetchPatients();
    }, []);

    // Fetch when selections change
    useEffect(() => {
        fetchTasks();
        fetchStats();
    }, [fetchTasks, fetchStats]);

    // Open create modal
    const openCreateModal = () => {
        const date = new Date();
        date.setHours(date.getHours() + 2); // default due in 2 hours
        const formattedDate = date.toISOString().slice(0, 16);
        
        setFormData({
            patientId: selectedPatientId || (patients[0]?._id || ""),
            title: "",
            description: "",
            priority: "Medium",
            category: "Medication",
            dueDate: formattedDate
        });
        setIsCreateOpen(true);
    };

    // Submit new task
    const submitCreateTask = async (e) => {
        e.preventDefault();
        try {
            await api.post("/tasks", formData);
            setIsCreateOpen(false);
            fetchTasks();
            fetchStats();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to assign task");
        }
    };

    // Open edit modal
    const openEditModal = (task) => {
        setSelectedTask(task);
        const localDueDate = new Date(task.dueDate).toISOString().slice(0, 16);
        setFormData({
            patientId: task.patient?._id || "",
            title: task.title,
            description: task.description,
            priority: task.priority,
            category: task.category,
            dueDate: localDueDate,
            status: task.status
        });
        setIsEditOpen(true);
    };

    // Submit updated task
    const submitEditTask = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/tasks/${selectedTask._id}`, formData);
            setIsEditOpen(false);
            fetchTasks();
            fetchStats();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update task");
        }
    };

    // Open delete modal
    const openDeleteModal = (task) => {
        setSelectedTask(task);
        setIsDeleteOpen(true);
    };

    // Delete task execution
    const confirmDeleteTask = async () => {
        try {
            await api.delete(`/tasks/${selectedTask._id}`);
            setIsDeleteOpen(false);
            fetchTasks();
            fetchStats();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to delete task");
        }
    };

    // Reset filters
    const clearFilters = () => {
        setSearch("");
        setFilterStatus("");
        setFilterPriority("");
        setFilterCategory("");
    };

    // Category emoji helper
    const getCategoryEmoji = (category) => {
        switch (category) {
            case "Medication": return "💊";
            case "Appointment": return "📅";
            case "Exercise": return "🏃‍♂️";
            case "Personal": return "👤";
            default: return "📝";
        }
    };

    // Styling helpers
    const getPriorityStyle = (priority) => {
        switch (priority) {
            case "High": return { bg: "#fef2f2", color: "#ef4444", border: "1px solid #fee2e2" };
            case "Medium": return { bg: "#fff7ed", color: "#f97316", border: "1px solid #ffedd5" };
            default: return { bg: "#eff6ff", color: "#3b82f6", border: "1px solid #dbeafe" }; // Low
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case "Completed": return { bg: "#f0fdf4", color: "#166534", border: "1px solid #dcfce7" };
            case "In Progress": return { bg: "#eff6ff", color: "#1d4ed8", border: "1px solid #dbeafe" };
            case "Missed": return { bg: "#fef2f2", color: "#991b1b", border: "1px solid #fee2e2" };
            default: return { bg: "#fefce8", color: "#854d0e", border: "1px solid #fef08a" }; // Pending
        }
    };

    return (
        <CaregiverLayout>
            {/* Header Area */}
            <div className="medication-header" style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                <div>
                    <h2 style={{ fontSize: "1.8rem", color: "#1e293b", margin: 0 }}>Assign & Manage Tasks</h2>
                    <p style={{ color: "#64748b", margin: "4px 0 0" }}>Schedule daily patient tasks, checkups, medication reminders, or therapeutic exercises.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    style={{
                        padding: "12px 20px",
                        background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                        color: "white",
                        border: "none",
                        borderRadius: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        boxShadow: "0 4px 6px -1px rgba(59, 130, 246, 0.3)",
                        transition: "all 0.2s"
                    }}
                >
                    <span style={{ fontSize: "1.2rem" }}>+</span> Assign New Task
                </button>
            </div>

            {/* Patients Filter Select Row */}
            <div style={{ marginBottom: "20px", display: "flex", gap: "12px", alignItems: "center" }}>
                <span style={{ fontWeight: 600, color: "#475569" }}>Select Patient Dashboard:</span>
                <select
                    value={selectedPatientId}
                    onChange={e => setSelectedPatientId(e.target.value)}
                    style={{
                        padding: "10px 16px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        outline: "none",
                        fontSize: "0.95rem",
                        color: "#1e293b",
                        background: "white",
                        minWidth: "220px",
                        fontWeight: 500
                    }}
                >
                    <option value="">All Assigned Patients</option>
                    {patients.map(p => (
                        <option key={p._id} value={p._id}>
                            {p.firstName} {p.lastName}
                        </option>
                    ))}
                </select>
            </div>

            {/* Task Statistics */}
            <div className="stats-grid">
                <StatsCard
                    title="Assigned Tasks"
                    value={statsLoading ? "..." : stats.totalTasks}
                    icon={<ClipboardIcon />}
                    color="blue"
                />
                <StatsCard
                    title="Completed"
                    value={statsLoading ? "..." : stats.completedTasks}
                    icon={<CheckCircleIcon />}
                    color="green"
                />
                <StatsCard
                    title="Pending"
                    value={statsLoading ? "..." : stats.pendingTasks}
                    icon={<ActivityIcon />}
                    color="orange"
                />
                <StatsCard
                    title="Completion Rate"
                    value={statsLoading ? "..." : `${stats.completionRate}%`}
                    icon={<CalendarIcon />}
                    color="purple"
                />
            </div>

            {/* Filters Row */}
            <div style={{ background: "white", padding: "16px", borderRadius: "16px", border: "1px solid #e2e8f0", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
                    
                    {/* Search Field */}
                    <div style={{ flex: "1 1 240px", position: "relative" }}>
                        <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>🔍</span>
                        <input
                            type="text"
                            placeholder="Search tasks by patient name or task details..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px 12px 10px 38px",
                                border: "1px solid #e2e8f0",
                                borderRadius: "10px",
                                outline: "none",
                                fontSize: "0.9rem",
                                color: "#1e293b",
                                background: "#f8fafc"
                            }}
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        style={{ padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: "10px", outline: "none", fontSize: "0.9rem", color: "#475569", background: "white" }}
                    >
                        <option value="">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Missed">Missed</option>
                    </select>

                    {/* Priority Filter */}
                    <select
                        value={filterPriority}
                        onChange={e => setFilterPriority(e.target.value)}
                        style={{ padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: "10px", outline: "none", fontSize: "0.9rem", color: "#475569", background: "white" }}
                    >
                        <option value="">All Priorities</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                    </select>

                    {/* Category Filter */}
                    <select
                        value={filterCategory}
                        onChange={e => setFilterCategory(e.target.value)}
                        style={{ padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: "10px", outline: "none", fontSize: "0.9rem", color: "#475569", background: "white" }}
                    >
                        <option value="">All Categories</option>
                        <option value="Medication">Medication</option>
                        <option value="Appointment">Appointment</option>
                        <option value="Exercise">Exercise</option>
                        <option value="Personal">Personal</option>
                        <option value="Other">Other</option>
                    </select>

                    {/* Clear Filters Button */}
                    {(search || filterStatus || filterPriority || filterCategory) && (
                        <button
                            onClick={clearFilters}
                            style={{
                                padding: "10px 16px",
                                background: "#f1f5f9",
                                color: "#475569",
                                border: "none",
                                borderRadius: "10px",
                                fontWeight: 500,
                                cursor: "pointer"
                            }}
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Task list / Table */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "60px", background: "white", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                    <div style={{ color: "#3b82f6", fontWeight: 500, fontSize: "1.1rem" }}>Loading task list...</div>
                </div>
            ) : error ? (
                <div style={{ color: "#dc2626", padding: "20px", background: "#fee2e2", borderRadius: "12px", border: "1px solid #fecaca" }}>
                    {error}
                </div>
            ) : tasks.length === 0 ? (
                <div style={{ textAlign: "center", padding: "80px 40px", background: "white", borderRadius: "16px", border: "1px dashed #cbd5e1" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📋</div>
                    <h3 style={{ fontWeight: 600, color: "#1e293b", margin: "0 0 8px" }}>No tasks assigned</h3>
                    <p style={{ color: "#64748b", maxWidth: "400px", margin: "0 auto 20px", fontSize: "0.95rem" }}>
                        There are no tasks assigned to your patient(s) matching your filters.
                    </p>
                    <button
                        onClick={openCreateModal}
                        style={{ padding: "10px 20px", background: "#3b82f6", border: "none", borderRadius: "10px", fontWeight: 600, color: "white", cursor: "pointer" }}
                    >
                        Assign a Task
                    </button>
                </div>
            ) : (
                <div className="table-container-wrapper" style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", background: "white", borderRadius: "16px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                        <thead>
                            <tr style={{ background: "#f8fafc" }}>
                                <th style={{ padding: "16px", textAlign: "left", color: "#64748b", fontWeight: 600 }}>Patient</th>
                                <th style={{ padding: "16px", textAlign: "left", color: "#64748b", fontWeight: 600 }}>Task</th>
                                <th style={{ padding: "16px", textAlign: "left", color: "#64748b", fontWeight: 600 }}>Category</th>
                                <th style={{ padding: "16px", textAlign: "left", color: "#64748b", fontWeight: 600 }}>Priority</th>
                                <th style={{ padding: "16px", textAlign: "left", color: "#64748b", fontWeight: 600 }}>Due Date</th>
                                <th style={{ padding: "16px", textAlign: "left", color: "#64748b", fontWeight: 600 }}>Status</th>
                                <th style={{ padding: "16px", textAlign: "left", color: "#64748b", fontWeight: 600 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map(task => (
                                <tr key={task._id} style={{ borderTop: "1px solid #f1f5f9" }}>
                                    
                                    {/* Patient Name */}
                                    <td style={{ padding: "16px" }}>
                                        <div style={{ fontWeight: 600, color: "#1e293b" }}>
                                            {task.patient?.firstName} {task.patient?.lastName}
                                        </div>
                                        <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>
                                            {task.patient?.user?.email}
                                        </div>
                                    </td>
                                    
                                    {/* Task Title / Description */}
                                    <td style={{ padding: "16px", maxWidth: "250px" }}>
                                        <div style={{ fontWeight: 600, color: "#334155", fontSize: "0.95rem" }}>{task.title}</div>
                                        {task.description && (
                                            <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={task.description}>
                                                {task.description}
                                            </div>
                                        )}
                                    </td>

                                    {/* Category */}
                                    <td style={{ padding: "16px" }}>
                                        <span style={{ fontSize: "0.9rem", color: "#334155" }}>
                                            {getCategoryEmoji(task.category)} {task.category}
                                        </span>
                                    </td>

                                    {/* Priority */}
                                    <td style={{ padding: "16px" }}>
                                        <span style={{
                                            ...getPriorityStyle(task.priority),
                                            padding: "4px 8px",
                                            borderRadius: "6px",
                                            fontSize: "0.8rem",
                                            fontWeight: 600,
                                            display: "inline-block"
                                        }}>
                                            {task.priority}
                                        </span>
                                    </td>

                                    {/* Due Date */}
                                    <td style={{ padding: "16px" }}>
                                        <div style={{ fontSize: "0.85rem", color: "#475569", fontWeight: 500 }}>
                                            {new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                        </div>
                                        <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>
                                            {new Date(task.dueDate).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                                        </div>
                                    </td>

                                    {/* Status Badge */}
                                    <td style={{ padding: "16px" }}>
                                        <span style={{
                                            ...getStatusStyle(task.status),
                                            padding: "6px 12px",
                                            borderRadius: "20px",
                                            fontSize: "0.8rem",
                                            fontWeight: 600,
                                            display: "inline-block"
                                        }}>
                                            {task.status}
                                        </span>
                                    </td>

                                    {/* Actions */}
                                    <td style={{ padding: "16px" }}>
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <button
                                                onClick={() => openEditModal(task)}
                                                style={{ background: "#f1f5f9", border: "none", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", color: "#475569" }}
                                                title="Edit Task"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => openDeleteModal(task)}
                                                style={{ background: "#fef2f2", border: "none", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", color: "#ef4444" }}
                                                title="Delete Task"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>

                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Task Modal Overlay */}
            {isCreateOpen && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
                    <div style={{ background: "#fff", padding: "24px", borderRadius: "16px", width: "100%", maxWidth: "500px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>Assign Task</h3>
                            <button onClick={() => setIsCreateOpen(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#94a3b8" }}>&times;</button>
                        </div>
                        <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "20px" }}>Assign a new checkup, medication reminder, or exercise to a patient.</p>

                        <form onSubmit={submitCreateTask}>
                            <div style={{ marginBottom: "14px" }}>
                                <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>Assign to Patient *</label>
                                <select
                                    required
                                    value={formData.patientId}
                                    onChange={e => setFormData({ ...formData, patientId: e.target.value })}
                                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "white", fontSize: "0.9rem" }}
                                >
                                    <option value="" disabled>Choose a patient...</option>
                                    {patients.map(p => (
                                        <option key={p._id} value={p._id}>
                                            {p.firstName} {p.lastName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginBottom: "14px" }}>
                                <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>Task Title *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Check Blood Pressure"
                                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.9rem" }}
                                />
                            </div>

                            <div style={{ marginBottom: "14px" }}>
                                <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="e.g. Take measurements before breakfast and note down..."
                                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.9rem", minHeight: "60px", fontFamily: "inherit" }}
                                />
                            </div>

                            <div style={{ display: "flex", gap: "12px", marginBottom: "14px" }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "white", fontSize: "0.9rem" }}
                                    >
                                        <option value="Medication">Medication</option>
                                        <option value="Appointment">Appointment</option>
                                        <option value="Exercise">Exercise</option>
                                        <option value="Personal">Personal</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>Priority</label>
                                    <select
                                        value={formData.priority}
                                        onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "white", fontSize: "0.9rem" }}
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: "20px" }}>
                                <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>Due Date & Time *</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={formData.dueDate}
                                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.9rem" }}
                                />
                            </div>

                            <div style={{ display: "flex", gap: "10px" }}>
                                <button type="button" onClick={() => setIsCreateOpen(false)} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#fff", fontWeight: 600, cursor: "pointer", color: "#475569" }}>Cancel</button>
                                <button type="submit" style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: "#3b82f6", color: "#fff", fontWeight: 600, cursor: "pointer" }}>Assign Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Task Modal Overlay */}
            {isEditOpen && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
                    <div style={{ background: "#fff", padding: "24px", borderRadius: "16px", width: "100%", maxWidth: "500px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>Edit Task Details</h3>
                            <button onClick={() => setIsEditOpen(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#94a3b8" }}>&times;</button>
                        </div>
                        <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "20px" }}>Update task assignment parameters or status.</p>

                        <form onSubmit={submitEditTask}>
                            <div style={{ marginBottom: "14px" }}>
                                <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>Task Title *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.9rem" }}
                                />
                            </div>

                            <div style={{ marginBottom: "14px" }}>
                                <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.9rem", minHeight: "60px", fontFamily: "inherit" }}
                                />
                            </div>

                            <div style={{ display: "flex", gap: "12px", marginBottom: "14px" }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "white", fontSize: "0.9rem" }}
                                    >
                                        <option value="Medication">Medication</option>
                                        <option value="Appointment">Appointment</option>
                                        <option value="Exercise">Exercise</option>
                                        <option value="Personal">Personal</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>Priority</label>
                                    <select
                                        value={formData.priority}
                                        onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "white", fontSize: "0.9rem" }}
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "12px", marginBottom: "14px" }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>Due Date & Time *</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={formData.dueDate}
                                        onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.9rem" }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "white", fontSize: "0.9rem" }}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Missed">Missed</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "10px" }}>
                                <button type="button" onClick={() => setIsEditOpen(false)} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#fff", fontWeight: 600, cursor: "pointer", color: "#475569" }}>Cancel</button>
                                <button type="submit" style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: "#3b82f6", color: "#fff", fontWeight: 600, cursor: "pointer" }}>Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Soft-Delete Confirmation Modal */}
            {isDeleteOpen && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
                    <div style={{ background: "#fff", padding: "24px", borderRadius: "16px", width: "100%", maxWidth: "400px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", textAlign: "center" }}>
                        <div style={{ fontSize: "3rem", marginBottom: "12px" }}>⚠️</div>
                        <h3 style={{ margin: "0 0 8px", fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>Remove Task Assignment</h3>
                        <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "24px" }}>
                            Are you sure you want to delete <strong>"{selectedTask?.title}"</strong> assigned to <strong>{selectedTask?.patient?.firstName}</strong>? This task will be removed from their list.
                        </p>

                        <div style={{ display: "flex", gap: "12px" }}>
                            <button onClick={() => setIsDeleteOpen(false)} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#fff", fontWeight: 600, cursor: "pointer", color: "#475569" }}>Cancel</button>
                            <button onClick={confirmDeleteTask} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: "#ef4444", color: "#fff", fontWeight: 600, cursor: "pointer" }}>Remove Assignment</button>
                        </div>
                    </div>
                </div>
            )}
        </CaregiverLayout>
    );
}

export default Tasks;
