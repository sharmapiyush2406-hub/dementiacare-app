const baseUrl = 'http://localhost:5000/api';
const timestamp = Date.now();

async function test() {
    try {
        console.log(`--- Test Run ${timestamp} ---`);

        // 1. Register Admin
        console.log('\n1. Registering Admin...');
        const adminRes = await fetch(`${baseUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Admin User',
                email: `admin${timestamp}@test.com`,
                password: 'password',
                role: 'admin'
            })
        });
        const adminData = await adminRes.json();
        if (adminRes.status !== 201) throw new Error(`Admin Register Failed: ${JSON.stringify(adminData)}`);
        console.log('✅ Admin Registered');
        const adminToken = adminData.token;

        // 2. Register Caregiver
        console.log('\n2. Registering Caregiver...');
        const cgRes = await fetch(`${baseUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Caregiver User',
                email: `caregiver${timestamp}@test.com`,
                password: 'password',
                role: 'caregiver'
            })
        });
        const cgData = await cgRes.json();
        if (cgRes.status !== 201) throw new Error(`Caregiver Register Failed: ${JSON.stringify(cgData)}`);
        console.log('✅ Caregiver Registered');
        const cgUserOneId = cgData._id;

        // 3. Register Patient
        console.log('\n3. Registering Patient...');
        const patRes = await fetch(`${baseUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Patient User',
                email: `patient${timestamp}@test.com`,
                password: 'password',
                role: 'patient'
            })
        });
        const patData = await patRes.json();
        if (patRes.status !== 201) throw new Error(`Patient Register Failed: ${JSON.stringify(patData)}`);
        console.log('✅ Patient Registered');
        const patUserOneId = patData._id;

        // 4. Admin: Get Lists to Find Document IDs
        console.log('\n4. Admin Fetching Lists...');

        // Get Caregivers
        const cgsListRes = await fetch(`${baseUrl}/admin/caregivers`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const cgsList = await cgsListRes.json();
        const caregiverDoc = cgsList.find(c => c.user._id === cgUserOneId);
        if (!caregiverDoc) throw new Error('Caregiver Document not found in list');
        console.log('✅ Found Caregiver Document ID:', caregiverDoc._id);

        // Get Patients
        const patsListRes = await fetch(`${baseUrl}/admin/patients`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const patsList = await patsListRes.json();
        const patientDoc = patsList.find(p => p.user._id === patUserOneId);
        if (!patientDoc) throw new Error('Patient Document not found in list');
        console.log('✅ Found Patient Document ID:', patientDoc._id);

        // 5. Admin: Assign Caregiver to Patient
        console.log('\n5. Assigning Caregiver to Patient...');
        const assignRes = await fetch(`${baseUrl}/admin/assign-caregiver`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ patientId: patientDoc._id, caregiverId: caregiverDoc._id })
        });
        const assignData = await assignRes.json();
        if (assignRes.status !== 200) throw new Error(`Assignment Failed: ${JSON.stringify(assignData)}`);
        console.log('✅ Assignment Successful');

        // 6. Verification: Check Patient's assigned caregiver
        // We need to login as patient first
        console.log('\n6. Verifying as Patient...');
        const patLoginRes = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: `patient${timestamp}@test.com`, password: 'password', role: 'patient' })
        });
        const patLoginData = await patLoginRes.json();
        const patToken = patLoginData.token;

        const myCaregiverRes = await fetch(`${baseUrl}/patient/my-caregiver`, {
            headers: { 'Authorization': `Bearer ${patToken}` }
        });
        const myCaregiver = await myCaregiverRes.json();
        console.log('Pat My Caregiver:', myCaregiver ? myCaregiver.name : 'None');
        if (myCaregiver && myCaregiver._id === cgUserOneId) {
            console.log('✅ Patient correctly sees assigned caregiver');
        } else {
            console.error('❌ Patient does NOT see correct caregiver');
        }

        // 7. Caregiver: Assign Daily Task
        console.log('\n7. Caregiver Assigning Daily Task...');
        // Login as Caregiver first to get token
        const cgLoginRes = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: `caregiver${timestamp}@test.com`, password: 'password', role: 'caregiver' })
        });
        const cgLoginData = await cgLoginRes.json();
        const cgToken = cgLoginData.token;

        const taskRes = await fetch(`${baseUrl}/caregiver/task`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${cgToken}`
            },
            body: JSON.stringify({
                patientId: patientDoc._id,
                description: 'Take morning walk',
                date: new Date().toISOString()
            })
        });
        const taskData = await taskRes.json();
        if (taskRes.status !== 201) throw new Error(`Task Assignment Failed: ${JSON.stringify(taskData)}`);
        console.log('✅ Daily Task Assigned');
        const taskId = taskData._id;

        // 8. Caregiver: Assign Prescription
        console.log('\n8. Caregiver Assigning Prescription...');
        const prescRes = await fetch(`${baseUrl}/caregiver/prescription`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${cgToken}`
            },
            body: JSON.stringify({
                patientId: patientDoc._id,
                medicineName: 'Aspirin',
                dosage: '100mg',
                frequency: 'Once a day'
            })
        });
        const prescData = await prescRes.json();
        if (prescRes.status !== 201) throw new Error(`Prescription Assignment Failed: ${JSON.stringify(prescData)}`);
        console.log('✅ Prescription Assigned');

        // 9. Patient: View Tasks and Prescriptions
        console.log('\n9. Patient Viewing Tasks & Prescriptions...');

        // View Tasks
        const patTasksRes = await fetch(`${baseUrl}/patient/my-tasks`, {
            headers: { 'Authorization': `Bearer ${patToken}` }
        });
        const patTasks = await patTasksRes.json();
        if (!patTasks.find(t => t._id === taskId)) throw new Error('Patient cannot see assigned task');
        console.log('✅ Patient sees assigned task');

        // View Prescriptions
        const patPrescRes = await fetch(`${baseUrl}/patient/prescriptions`, {
            headers: { 'Authorization': `Bearer ${patToken}` }
        });
        const patPresc = await patPrescRes.json();
        if (patPresc.length === 0) throw new Error('Patient cannot see assigned prescription');
        console.log('✅ Patient sees assigned prescription');

        // 10. Patient: Complete Task
        console.log('\n10. Patient Completing Task...');
        const completeRes = await fetch(`${baseUrl}/patient/task/${taskId}/complete`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${patToken}` }
        });
        const completeData = await completeRes.json();
        if (!completeData.isCompleted) throw new Error('Task completion failed');
        console.log('✅ Task Marked as Complete');

        console.log('\n--- Test Completed Successfully ---');

        // 11. Admin: Assign Caregiver using USER IDs (Test Enhancement)
        console.log('\n11. Assigning Caregiver using USER IDs...');
        // First, let's create a new dummy patient and caregiver to test this
        const dummyPatRes = await fetch(`${baseUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Dummy Patient',
                email: `dummypat${timestamp}@test.com`,
                password: 'password',
                role: 'patient'
            })
        });
        const dummyPatData = await dummyPatRes.json();
        const dummyPatUserId = dummyPatData._id;

        const dummyCgRes = await fetch(`${baseUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Dummy Caregiver',
                email: `dummycg${timestamp}@test.com`,
                password: 'password',
                role: 'caregiver'
            })
        });
        const dummyCgData = await dummyCgRes.json();
        const dummyCgUserId = dummyCgData._id;

        const assignUserRes = await fetch(`${baseUrl}/admin/assign-caregiver`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ patientId: dummyPatUserId, caregiverId: dummyCgUserId })
        });
        if (assignUserRes.status !== 200) {
            const errData = await assignUserRes.json();
            throw new Error(`Assignment using User IDs Failed: ${JSON.stringify(errData)}`);
        }
        console.log('✅ Assignment using User IDs Successful');

        // 12. Admin: Delete User
        console.log('\n12. Admin Deleting User...');
        const deleteRes = await fetch(`${baseUrl}/admin/users/${dummyPatUserId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        if (deleteRes.status !== 200) throw new Error('Delete User Failed');
        console.log('✅ User Deleted');

        // Verify Deletion
        const checkRes = await fetch(`${baseUrl}/admin/patients`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const checkList = await checkRes.json();
        if (checkList.find(p => p.user && p.user._id === dummyPatUserId)) throw new Error('Deleted User still exists in list');
        console.log('✅ Verified User is gone');

        console.log('\n--- Test Completed Successfully ---');

    } catch (err) {
        console.error('\n❌ Test Failed:', err.message);
    }
}

test();
