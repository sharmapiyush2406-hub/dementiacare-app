const baseUrl = 'http://localhost:5000/api';
const timestamp = Date.now();

async function diagnose() {
    try {
        console.log(`--- Diagnosis Run ${timestamp} ---`);

        // 1. Register/Login Admin
        console.log('\n1. Login/Register Admin...');
        let adminToken;

        // Try login first
        const loginRes = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@test.com', // Assuming this exists or we create it
                password: 'password',
                role: 'admin'
            })
        });

        if (loginRes.ok) {
            const data = await loginRes.json();
            adminToken = data.token;
            console.log('✅ Admin Logged In');
        } else {
            // Register if login fails
            console.log('Login failed, trying to register...');
            const regRes = await fetch(`${baseUrl}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Admin User',
                    email: `admin${timestamp}@test.com`,
                    password: 'password',
                    role: 'admin'
                })
            });
            const regData = await regRes.json();
            if (!regRes.ok) throw new Error(`Admin Register Failed: ${JSON.stringify(regData)}`);
            adminToken = regData.token;
            console.log('✅ Admin Registered');
        }

        // 2. Fetch Patients
        console.log('\n2. Fetching Patients...');
        const patientsRes = await fetch(`${baseUrl}/admin/patients`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (patientsRes.ok) {
            const patients = await patientsRes.json();
            console.log(`✅ Patients fetched: ${patients.length}`);
            // console.log(JSON.stringify(patients, null, 2));
        } else {
            const err = await patientsRes.text();
            console.error(`❌ Fetch Patients Failed: ${patientsRes.status} ${patientsRes.statusText}`);
            console.error(err);
        }

        // 3. Fetch Caregivers
        console.log('\n3. Fetching Caregivers...');
        const caregiversRes = await fetch(`${baseUrl}/admin/caregivers`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (caregiversRes.ok) {
            const caregivers = await caregiversRes.json();
            console.log(`✅ Caregivers fetched: ${caregivers.length}`);
            // console.log(JSON.stringify(caregivers, null, 2));
        } else {
            const err = await caregiversRes.text();
            console.error(`❌ Fetch Caregivers Failed: ${caregiversRes.status} ${caregiversRes.statusText}`);
            console.error(err);
        }

    } catch (err) {
        console.error('\n❌ Diagnosis Failed:', err.message);
    }
}

diagnose();
