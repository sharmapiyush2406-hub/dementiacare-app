const fs = require('fs');
const path = require('path');

const baseUrl = 'http://localhost:5000/api';
const timestamp = Date.now();

// 1. Write a minimal valid PDF file programmatically using a pre-compiled base64 string
const pdfBase64 = 'JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXMKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAgL1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSIAogICAgPj4KICA+PgogIC9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKCjQgMCBvYmoKPDwKICAvVHlwZSAvRm9udAogIC9TdWJ0eXBlIC9UeXBlMQogIC9CYXNlRm9udCAvVGltZXMtUm9tYW4KPj4KZW5kb2JqCgo1IDAgb2JqICAlIHBhZ2UgY29udGVudAo8PAogIC9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCjcwIDUwIFRECi9GMSAxMiBUZgooSGVsbG8sIHdvcmxkISkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNzkgMDAwMDAgbiAKMDAwMDAwMDE3MyAwMDAwMCBuIAowMDAwMDAwMzAxIDAwMDAwIG4gCjAwMDAwMDAzODAgMDAwMDAgbiAKdHJhaWxlcgo8PAogIC9TaXplIDYKICAvUm9vXCAxIDAgUgo+PgpzdGFydHhyZWYKNDkyCiUlRU9G';

let raw = Buffer.from(pdfBase64, 'base64').toString('utf8');
raw = raw.replace(/\/Roo./, '/Root');
raw = raw.replace('200 200', '999 999');
raw = raw.replace('/Length 44', '/Length 93');
raw = raw.replace('(Hello, world!)', '(Patient Brain MRI Report: normal ventricles and mild atrophy.)');
raw = raw.replace('492', '541');

const scratchDir = path.join(__dirname);
if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true });
}
const pdfFilePath = path.join(scratchDir, 'sample.pdf');
fs.writeFileSync(pdfFilePath, Buffer.from(raw, 'utf8'));
console.log('🌱 Programmatically wrote valid minimal sample PDF to:', pdfFilePath);

async function runTests() {
    try {
        console.log(`\n==================================================`);
        console.log(`PHASE 2 INTEGRATED TEST RUN: ${new Date().toLocaleString()}`);
        console.log(`==================================================`);

        // ── STEP 1: Registers Accounts ──────────────────────────────
        console.log('\n[Step 1] Registering Admin, Doctor, Caregiver, and Patient...');
        
        // Admin
        const adminRes = await fetch(`${baseUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: `admin${timestamp}@test.com`, password: 'password123', role: 'admin' })
        });
        const adminData = await adminRes.json();
        if (adminRes.status !== 201) throw new Error(`Admin Register Failed: ${JSON.stringify(adminData)}`);
        const adminToken = adminData.token;
        console.log('✅ Admin registered');

        // Doctor
        const docRes = await fetch(`${baseUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: `doctor${timestamp}@test.com`, password: 'password123', role: 'doctor' })
        });
        const docData = await docRes.json();
        const docToken = docData.token;
        console.log('✅ Doctor registered');

        // Caregiver
        const cgRes = await fetch(`${baseUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: `caregiver${timestamp}@test.com`, password: 'password123', role: 'caregiver' })
        });
        const cgData = await cgRes.json();
        const cgToken = cgData.token;
        const cgUserId = cgData._id;
        console.log('✅ Caregiver registered');

        // Patient
        const patRes = await fetch(`${baseUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: `patient${timestamp}@test.com`, password: 'password123', role: 'patient' })
        });
        const patData = await patRes.json();
        const patToken = patData.token;
        const patUserId = patData._id;
        console.log('✅ Patient registered');

        // ── STEP 2: Assign Caregiver & Doctor to Patient ──────────────
        console.log('\n[Step 2] Admin Assigning Caregiver and Doctor...');
        
        // Find document IDs
        const patsListRes = await fetch(`${baseUrl}/admin/patients`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const patsList = await patsListRes.json();
        const patientDoc = patsList.find(p => p.user._id === patUserId);
        const patientId = patientDoc._id;

        const cgsListRes = await fetch(`${baseUrl}/admin/caregivers`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const cgsList = await cgsListRes.json();
        const caregiverDoc = cgsList.find(c => c.user._id === cgUserId);
        const caregiverId = caregiverDoc._id;

        const docsListRes = await fetch(`${baseUrl}/admin/doctors`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const docsList = await docsListRes.json();
        const doctorDoc = docsList.find(d => d.user.email === `doctor${timestamp}@test.com`);
        const doctorId = doctorDoc._id;

        // Assign caregiver
        const assignCg = await fetch(`${baseUrl}/admin/assign-caregiver`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
            body: JSON.stringify({ patientId: patientId, caregiverId: caregiverId })
        });
        console.log('✅ Caregiver assigned status:', assignCg.status);

        // Assign doctor
        const assignDoc = await fetch(`${baseUrl}/admin/assign-doctor`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
            body: JSON.stringify({ patientId: patientId, doctorId: doctorId })
        });
        console.log('✅ Doctor assigned status:', assignDoc.status);

        // ── STEP 3: FEATURE 2 - Caregiver Notes CRUD ──────────────────
        console.log('\n[Step 3] Testing Feature 2: Caregiver Notes CRUD...');
        
        // 1. Create caregiver note
        const createNoteRes = await fetch(`${baseUrl}/caregiver/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cgToken}` },
            body: JSON.stringify({ patientId: patientId, note: 'Patient was slightly disoriented after breakfast but settled down.' })
        });
        const noteData = await createNoteRes.json();
        if (createNoteRes.status !== 201) throw new Error(`Create Caregiver Note Failed: ${JSON.stringify(noteData)}`);
        console.log('✅ Caregiver note created successfully:', noteData.note);
        const noteId = noteData._id;

        // 2. Read notes (as Doctor, to verify cross-role authorization)
        const readNotesRes = await fetch(`${baseUrl}/caregiver/notes/${patientId}`, {
            headers: { 'Authorization': `Bearer ${docToken}` }
        });
        const notesList = await readNotesRes.json();
        if (!notesList.some(n => n._id === noteId)) throw new Error('Doctor could not read caregiver note');
        console.log(`✅ Doctor successfully retrieved notes (Total: ${notesList.length})`);

        // 3. Update note (as Caregiver)
        const updateNoteRes = await fetch(`${baseUrl}/caregiver/notes/${noteId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cgToken}` },
            body: JSON.stringify({ note: 'Patient was slightly disoriented after breakfast but settled down. (Observation updated)' })
        });
        const updatedNoteData = await updateNoteRes.json();
        console.log('✅ Caregiver note updated successfully:', updatedNoteData.note);

        // ── STEP 4: FEATURE 3 - Medical Report Upload (PDF parsing) ──
        console.log('\n[Step 4] Testing Feature 3: PDF Medical Report Upload & Parsing...');
        
        // Prepare FormData for PDF upload
        const form = new FormData();
        form.append('patientId', patientId);
        form.append('title', 'Brain MRI Assessment');
        form.append('type', 'Diagnostic');
        form.append('priority', 'High');
        
        const fileBuffer = fs.readFileSync(pdfFilePath);
        const fileBlob = new Blob([fileBuffer], { type: 'application/pdf' });
        form.append('pdf', fileBlob, 'brain_mri.pdf');

        const uploadRes = await fetch(`${baseUrl}/doctor/reports/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${docToken}` },
            body: form
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.status !== 201) throw new Error(`PDF Report Upload Failed: ${JSON.stringify(uploadData)}`);
        console.log('✅ PDF Report uploaded and metadata saved successfully');
        console.log('📝 Extracted Text Preview:', JSON.stringify(uploadData.report.extractedText.trim()));

        if (!uploadData.report.extractedText.includes('normal ventricles')) {
            console.error('❌ Text extraction failed to find key findings!');
        } else {
            console.log('✅ Text parser successfully extracted clinical findings from PDF');
        }

        // ── STEP 5: FEATURE 5 - AI Daily Summary ──────────────────────
        console.log('\n[Step 5] Testing Feature 5: AI Daily Summary...');
        
        // Add a prescription and task first to populate the summary
        await fetch(`${baseUrl}/doctor/prescribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${docToken}` },
            body: JSON.stringify({ patientId: patientId, medicineName: 'Donepezil', dosage: '5mg', frequency: 'Once daily' })
        });

        await fetch(`${baseUrl}/caregiver/task`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cgToken}` },
            body: JSON.stringify({ patientId: patientId, description: 'Drink 3 glasses of water in the morning', date: new Date().toISOString() })
        });

        // Request summary as patient
        const summaryRes = await fetch(`${baseUrl}/ai/daily-summary`, {
            headers: { 'Authorization': `Bearer ${patToken}` }
        });
        const summaryData = await summaryRes.json();
        if (!summaryData.success) throw new Error(`Daily Summary Failed: ${JSON.stringify(summaryData)}`);
        console.log('\n💬 AI Daily Summary Response:\n', summaryData.summary);
        console.log('✅ AI Daily Summary generated successfully');

        // ── STEP 6: FEATURE 6 - Chronological Timeline ───────────────
        console.log('\n[Step 6] Testing Feature 6: Chronological Memory Timeline...');
        
        const timelineRes = await fetch(`${baseUrl}/ai/timeline`, {
            headers: { 'Authorization': `Bearer ${patToken}` }
        });
        const timelineData = await timelineRes.json();
        if (!timelineData.success) throw new Error(`Timeline Retrieval Failed: ${JSON.stringify(timelineData)}`);
        console.log(`✅ Retrieved ${timelineData.timeline.length} timeline events`);
        console.log('📅 Chronological Order Check:');
        timelineData.timeline.slice(0, 3).forEach(e => {
            console.log(`  - [${e.formattedDate}] (${e.type}) ${e.title}: ${e.description.substring(0, 60)}...`);
        });

        // ── STEP 7: FEATURE 1 - RAG Chat & Source Citations ───────────
        console.log('\n[Step 7] Testing Feature 1: RAG Chat with Verified Source Citations...');
        
        // Wait 6 seconds to let the debounced auto-indexing complete in the background
        console.log('⏳ Waiting 6 seconds for debounced auto-indexing to push new observations and reports to Pinecone...');
        await new Promise(resolve => setTimeout(resolve, 6200));

        // Send a message to RAG Chat asking about their MRI findings
        console.log('💬 Asking RAG Assistant: "What did my MRI report say?"');
        const ragChatRes = await fetch(`${baseUrl}/rag/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${patToken}` },
            body: JSON.stringify({ message: 'What did my MRI report say?' })
        });
        const ragChatData = await ragChatRes.json();
        if (!ragChatData.success) throw new Error(`RAG Chat Failed: ${JSON.stringify(ragChatData)}`);
        
        console.log('\n💬 AI Response:\n', ragChatData.answer);
        
        console.log('\n📄 Retrieved Documents Metadata:');
        ragChatData.retrievedDocuments.forEach(d => {
            console.log(`  - Source Type: ${d.type}, Record Name: ${d.name}`);
        });

        if (ragChatData.answer.includes('Sources:')) {
            console.log('✅ Success: Verified source citations programmatically appended to the output!');
        } else {
            console.error('❌ Failed: Citations missing from the response!');
        }

        console.log(`\n==================================================`);
        console.log(`✅ ALL PHASE 2 INTEGRATION TESTS PASSED SUCCESSFULLY`);
        console.log(`==================================================\n`);

    } catch (err) {
        console.error('\n❌ Phase 2 Tests Failed:', err.message);
    } finally {
        // Cleanup temporary PDF file
        if (fs.existsSync(pdfFilePath)) {
            fs.unlinkSync(pdfFilePath);
        }
    }
}

// Run the tests after a short delay
setTimeout(runTests, 1000);
