import CaregiverLayout from "../layouts/CaregiverLayout";
import "../../shared/styles/Dashboard.css";
import Table from "../../shared/components/Table";

function Patients() {
    const patients = [
        { id: 1, name: "John Doe", age: 72, condition: "Alzheimer's - Stage 1", status: "Stable" },
        { id: 2, name: "Jane Smith", age: 65, condition: "Dementia - Stage 2", status: "Critical" },
        { id: 3, name: "Robert Brown", age: 80, condition: "Alzheimer's - Stage 3", status: "Stable" },
    ];

    return (
        <CaregiverLayout>
            <div className="table-container-wrapper">
                <Table
                    title="Assigned Patients"
                    columns={[
                        { header: "Name", accessor: "name" },
                        { header: "Age", accessor: "age" },
                        { header: "Condition", accessor: "condition" },
                        {
                            header: "Status",
                            accessor: "status",
                            render: (row) => (
                                <span className={`status-badge ${row.status === "Stable" ? "active" : "inactive"}`}>
                                    {row.status}
                                </span>
                            )
                        },
                        {
                            header: "Actions",
                            accessor: "actions",
                            render: () => (
                                <button className="action-btn edit">View Details</button>
                            )
                        }
                    ]}
                    data={patients}
                />
            </div>
        </CaregiverLayout>
    );
}

export default Patients;
