/**
 * seed.js
 * Run with:  node seed.js
 *
 * Creates:
 *   - 1 Doctor user  (doctor@hc.com / doctor123)
 *   - 5 Patient users (patient1@hc.com … patient5@hc.com / patient123)
 *   - Full Patient profiles with medical/emergency data
 *   - Doctor record with all 5 patients assigned
 *   - 25 Psychiatric medicines in the Medicines collection
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

// Gracefully skip seeding in production or Render environments
if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
  console.log('\n⚠️  Seeding is disabled in production/Render environments. Skipping script execution.\n');
  process.exit(0);
}

// Validate that MONGO_URI is defined locally
if (!process.env.MONGO_URI) {
  console.error('\n❌ Error: MONGO_URI is not defined in the environment variables.');
  console.error('Please configure MONGO_URI in your BACKEND/.env file.\n');
  process.exit(1);
}

const User = require('./models/User');
const Patient = require('./models/Patient');
const Doctor = require('./models/Doctor');
const Medicine = require('./models/Medicine');
const Staff = require('./models/Staff');
const Report = require('./models/Report');
const Appointment = require('./models/Appointment');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/backenddb';

/* ─────────────────────────────────────────── seed data ─────────────────────────────────────────── */

const DOCTOR_DATA = {
    email: 'doctor@hc.com',
    password: 'doctor123',
    role: 'doctor',
    firstName: 'Dr. Arjun',
    lastName: 'Sharma',
    phone: '+91-9810001001',
    specialization: 'Geriatric Psychiatry',
    licenseNo: 'MCI-2024-KA-5521',
    department: 'Memory Care & Neurology',
    hospital: 'HealthCare Memory & Brain Institute',
    experience: '14 Years',
    opdTiming: 'Mon-Fri, 9:00 AM – 1:00 PM',
    ward: 'Ward N – Neurology & Memory Care',
    bio: 'Specialist in Geriatric Psychiatry with 14 years of experience treating Alzheimer\'s disease, dementia, and age-related cognitive disorders. Focuses on holistic, patient-centred memory care.',
};

const CAREGIVER_DATA = {
    email: 'caregiver@hc.com',
    password: 'caregiver123',
    role: 'caregiver',
    firstName: 'Sandeep',
    lastName: 'Kumar',
    phone: '+91-9870001001',
};

const PATIENTS_DATA = [
    {
        email: 'patient1@hc.com',
        password: 'patient123',
        role: 'patient',
        profile: {
            firstName: 'Riya',
            lastName: 'Mehta',
            phone: '+91-9820001001',
            dateOfBirth: '1958-04-12',
            gender: 'Female',
            address: '12 MG Road, Bengaluru, KA 560001',
            bloodGroup: 'B+',
            age: '68',
            weight: '61 kg',
            height: '162 cm',
            conditions: 'Stage 1 Alzheimer\'s',
            allergies: 'Penicillin',
            currentMedications: 'Donepezil 5 mg, Memantine 10 mg',
            primaryDoctor: 'Dr. Arjun Sharma',
            lastVisit: '2026-02-10',
            nextAppointment: '2026-02-22',
        },
        emergency: {
            contactName: 'Rajesh Mehta',
            relationship: 'Father',
            contactPhone: '+91-9820001002',
            contactEmail: 'rajesh.mehta@email.com',
            altContactName: 'Sunita Mehta',
            altRelationship: 'Mother',
            altPhone: '+91-9820001003',
        },
    },
    {
        email: 'patient2@hc.com',
        password: 'patient123',
        role: 'patient',
        profile: {
            firstName: 'Karan',
            lastName: 'Verma',
            phone: '+91-9830001001',
            dateOfBirth: '1952-11-22',
            gender: 'Male',
            address: '45 Park Street, Mumbai, MH 400001',
            bloodGroup: 'O+',
            age: '73',
            weight: '72 kg',
            height: '175 cm',
            conditions: 'Stage 2 Alzheimer\'s',
            allergies: 'Aspirin',
            currentMedications: 'Donepezil 10 mg, Risperidone 0.5 mg, Memantine 20 mg',
            primaryDoctor: 'Dr. Arjun Sharma',
            lastVisit: '2026-02-15',
            nextAppointment: '2026-02-22',
        },
        emergency: {
            contactName: 'Preeti Verma',
            relationship: 'Spouse',
            contactPhone: '+91-9830001002',
            contactEmail: 'preeti.verma@email.com',
            altContactName: 'Deepak Verma',
            altRelationship: 'Brother',
            altPhone: '+91-9830001003',
        },
    },
    {
        email: 'patient3@hc.com',
        password: 'patient123',
        role: 'patient',
        profile: {
            firstName: 'Ananya',
            lastName: 'Singh',
            phone: '+91-9840001001',
            dateOfBirth: '1960-07-05',
            gender: 'Female',
            address: '8 Sector 18, Noida, UP 201301',
            bloodGroup: 'A-',
            age: '65',
            weight: '54 kg',
            height: '158 cm',
            conditions: 'Early Dementia',
            allergies: 'Sulfa Drugs',
            currentMedications: 'Donepezil 5 mg, Lorazepam 0.5 mg',
            primaryDoctor: 'Dr. Arjun Sharma',
            lastVisit: '2026-01-20',
            nextAppointment: '2026-03-05',
        },
        emergency: {
            contactName: 'Vivek Singh',
            relationship: 'Father',
            contactPhone: '+91-9840001002',
            contactEmail: 'vivek.singh@email.com',
            altContactName: 'Meena Singh',
            altRelationship: 'Mother',
            altPhone: '+91-9840001003',
        },
    },
    {
        email: 'patient4@hc.com',
        password: 'patient123',
        role: 'patient',
        profile: {
            firstName: 'Rahul',
            lastName: 'Kapoor',
            phone: '+91-9850001001',
            dateOfBirth: '1948-03-30',
            gender: 'Male',
            address: '22 Civil Lines, Jaipur, RJ 302001',
            bloodGroup: 'AB+',
            age: '77',
            weight: '74 kg',
            height: '170 cm',
            conditions: 'Moderate Dementia',
            allergies: 'None known',
            currentMedications: 'Memantine 20 mg, Quetiapine 25 mg, Vitamin E 400 IU',
            primaryDoctor: 'Dr. Arjun Sharma',
            lastVisit: '2026-02-18',
            nextAppointment: '2026-03-10',
        },
        emergency: {
            contactName: 'Pooja Kapoor',
            relationship: 'Spouse',
            contactPhone: '+91-9850001002',
            contactEmail: 'pooja.kapoor@email.com',
            altContactName: 'Arvind Kapoor',
            altRelationship: 'Son',
            altPhone: '+91-9850001003',
        },
    },
    {
        email: 'patient5@hc.com',
        password: 'patient123',
        role: 'patient',
        profile: {
            firstName: 'Sneha',
            lastName: 'Nair',
            phone: '+91-9860001001',
            dateOfBirth: '1965-09-18',
            gender: 'Female',
            address: '3 Marine Drive, Kochi, KL 682011',
            bloodGroup: 'O-',
            age: '60',
            weight: '52 kg',
            height: '155 cm',
            conditions: 'MCI',
            allergies: 'Latex',
            currentMedications: 'Rivastigmine 4.6 mg patch, Omega-3 supplements',
            primaryDoctor: 'Dr. Arjun Sharma',
            lastVisit: '2026-02-20',
            nextAppointment: '2026-04-02',
        },
        emergency: {
            contactName: 'Sujatha Nair',
            relationship: 'Mother',
            contactPhone: '+91-9860001002',
            contactEmail: 'sujatha.nair@email.com',
            altContactName: 'Mohan Nair',
            altRelationship: 'Father',
            altPhone: '+91-9860001003',
        },
    },
];

/* ─────────────────────────────────────── medicines data ─────────────────────────────────────── */

const MEDICINES_DATA = [
    // Antipsychotics
    { name: 'Clozapine', generic: 'Clozapine', category: 'Antipsychotic', schedule: 'Schedule H1', dosage: '12.5 – 900 mg/day', indication: 'Treatment-resistant Schizophrenia', licensed: true, form: 'Tablet', monitor: 'WBC count mandatory' },
    { name: 'Risperidone', generic: 'Risperidone', category: 'Antipsychotic', schedule: 'Schedule H', dosage: '0.5 – 16 mg/day', indication: 'Schizophrenia, Bipolar Disorder', licensed: false, form: 'Tablet / Liquid', monitor: 'Metabolic profile' },
    { name: 'Olanzapine', generic: 'Olanzapine', category: 'Antipsychotic', schedule: 'Schedule H', dosage: '5 – 20 mg/day', indication: 'Schizophrenia, Acute Mania', licensed: false, form: 'Tablet / IM', monitor: 'Blood glucose, lipids' },
    { name: 'Quetiapine', generic: 'Quetiapine Fumarate', category: 'Antipsychotic', schedule: 'Schedule H', dosage: '50 – 800 mg/day', indication: 'Schizophrenia, Bipolar, MDD', licensed: false, form: 'Tablet (IR/XR)', monitor: 'QTc interval' },
    { name: 'Haloperidol', generic: 'Haloperidol', category: 'Antipsychotic', schedule: 'Schedule H', dosage: '0.5 – 20 mg/day', indication: 'Schizophrenia, Acute Agitation', licensed: false, form: 'Tablet / IM / Depot', monitor: 'EPS monitoring' },
    { name: 'Aripiprazole', generic: 'Aripiprazole', category: 'Antipsychotic', schedule: 'Schedule H', dosage: '10 – 30 mg/day', indication: 'Schizophrenia, Bipolar I', licensed: false, form: 'Tablet / IM', monitor: 'Body weight' },
    // Antidepressants
    { name: 'Sertraline', generic: 'Sertraline HCl', category: 'Antidepressant', schedule: 'Schedule H', dosage: '25 – 200 mg/day', indication: 'MDD, OCD, PTSD, Panic Disorder', licensed: false, form: 'Tablet', monitor: 'Suicidality in young adults' },
    { name: 'Escitalopram', generic: 'Escitalopram Oxalate', category: 'Antidepressant', schedule: 'Schedule H', dosage: '5 – 20 mg/day', indication: 'MDD, Generalised Anxiety', licensed: false, form: 'Tablet', monitor: 'QTc interval' },
    { name: 'Fluoxetine', generic: 'Fluoxetine HCl', category: 'Antidepressant', schedule: 'Schedule H', dosage: '10 – 80 mg/day', indication: 'MDD, Bulimia, OCD', licensed: false, form: 'Capsule / Liquid', monitor: 'Drug interactions (CYP2D6)' },
    { name: 'Venlafaxine', generic: 'Venlafaxine HCl', category: 'Antidepressant', schedule: 'Schedule H', dosage: '37.5 – 375 mg/day', indication: 'MDD, GAD, Social Anxiety', licensed: false, form: 'Tablet (XR)', monitor: 'Blood pressure' },
    { name: 'Amitriptyline', generic: 'Amitriptyline HCl', category: 'Antidepressant', schedule: 'Schedule H', dosage: '25 – 150 mg/day', indication: 'MDD, Chronic pain, Migraine', licensed: false, form: 'Tablet', monitor: 'ECG, anticholinergic effects' },
    { name: 'Mirtazapine', generic: 'Mirtazapine', category: 'Antidepressant', schedule: 'Schedule H', dosage: '15 – 45 mg/day', indication: 'MDD with insomnia/weight loss', licensed: false, form: 'Tablet', monitor: 'Weight, sedation' },
    // Mood Stabilisers
    { name: 'Lithium Carbonate', generic: 'Lithium Carbonate', category: 'Mood Stabiliser', schedule: 'Schedule H', dosage: '300 – 1800 mg/day', indication: 'Bipolar Disorder (maintenance)', licensed: false, form: 'Tablet / SR Tablet', monitor: 'Serum lithium, renal, thyroid' },
    { name: 'Valproate', generic: 'Sodium Valproate', category: 'Mood Stabiliser', schedule: 'Schedule H', dosage: '500 – 2500 mg/day', indication: 'Bipolar, Epilepsy', licensed: false, form: 'Tablet / Syrup / IV', monitor: 'LFT, serum levels, CBC' },
    { name: 'Lamotrigine', generic: 'Lamotrigine', category: 'Mood Stabiliser', schedule: 'Schedule H', dosage: '25 – 400 mg/day', indication: 'Bipolar Depression, Epilepsy', licensed: false, form: 'Tablet', monitor: 'Rash (Stevens-Johnson syndrome)' },
    { name: 'Carbamazepine', generic: 'Carbamazepine', category: 'Mood Stabiliser', schedule: 'Schedule H', dosage: '200 – 1200 mg/day', indication: 'Bipolar, Epilepsy, Trigeminal neuralgia', licensed: false, form: 'Tablet / XR Tablet', monitor: 'CBC, serum levels, hepatic function' },
    // Benzodiazepines
    { name: 'Alprazolam', generic: 'Alprazolam', category: 'Benzodiazepine', schedule: 'Schedule X', dosage: '0.25 – 4 mg/day', indication: 'Panic Disorder, GAD', licensed: true, form: 'Tablet', monitor: 'Dependence risk; taper on D/C' },
    { name: 'Clonazepam', generic: 'Clonazepam', category: 'Benzodiazepine', schedule: 'Schedule X', dosage: '0.5 – 20 mg/day', indication: 'Panic, Epilepsy, Akathisia', licensed: true, form: 'Tablet / IM', monitor: 'Sedation, dependence' },
    { name: 'Diazepam', generic: 'Diazepam', category: 'Benzodiazepine', schedule: 'Schedule X', dosage: '2 – 40 mg/day', indication: 'Anxiety, Alcohol withdrawal, Muscle spasm', licensed: true, form: 'Tablet / IM / IV', monitor: 'Respiratory depression' },
    { name: 'Lorazepam', generic: 'Lorazepam', category: 'Benzodiazepine', schedule: 'Schedule X', dosage: '0.5 – 10 mg/day', indication: 'Acute anxiety, Agitation, Status epilepticus', licensed: true, form: 'Tablet / IM / IV', monitor: 'Level of consciousness' },
    // Hypnotics
    { name: 'Zolpidem', generic: 'Zolpidem Tartrate', category: 'Hypnotic', schedule: 'Schedule X', dosage: '5 – 10 mg at bedtime', indication: 'Insomnia (short-term)', licensed: true, form: 'Tablet', monitor: 'Next-day impairment, dependence' },
    { name: 'Melatonin', generic: 'Melatonin', category: 'Hypnotic', schedule: 'OTC / Schedule H', dosage: '0.5 – 10 mg at bedtime', indication: 'Circadian rhythm disorders, Insomnia', licensed: false, form: 'Tablet / Capsule', monitor: 'Drowsiness' },
    // Anti-Dementia
    { name: 'Donepezil', generic: 'Donepezil HCl', category: 'Anti-Dementia', schedule: 'Schedule H', dosage: '5 – 23 mg/day', indication: "Alzheimer's Disease (mild-severe)", licensed: false, form: 'Tablet', monitor: 'GI side effects, cardiac rhythm' },
    { name: 'Memantine', generic: 'Memantine HCl', category: 'Anti-Dementia', schedule: 'Schedule H', dosage: '5 – 20 mg/day', indication: "Moderate-to-severe Alzheimer's Disease", licensed: false, form: 'Tablet / Liquid', monitor: 'Confusion, dizziness' },
    { name: 'Rivastigmine', generic: 'Rivastigmine Tartrate', category: 'Anti-Dementia', schedule: 'Schedule H', dosage: '1.5 – 12 mg/day', indication: "Alzheimer's, Parkinson's Dementia", licensed: false, form: 'Capsule / Patch', monitor: 'Nausea, vomiting, weight loss' },
];

/* ─────────────────────────────────────────── staff data ─────────────────────────────────────────── */

const STAFF_DATA = [
    // Doctors
    { name: 'Dr. Aanya Sharma', role: 'Doctor', designation: 'Senior Psychiatrist', department: 'Inpatient Psychiatry', license: 'MCI-PSY-10234', phone: '+91 98100 11001', email: 'aanya.sharma@hospital.in', experience: '18 yrs', status: 'Active', avatar: '👩‍⚕️' },
    { name: 'Dr. Rohan Mehta', role: 'Doctor', designation: 'Consultant Psychiatrist', department: 'OPD & Outpatient', license: 'MCI-PSY-10891', phone: '+91 98100 22002', email: 'rohan.mehta@hospital.in', experience: '12 yrs', status: 'Active', avatar: '👨‍⚕️' },
    { name: 'Dr. Priya Nair', role: 'Doctor', designation: 'Child & Adolescent Psychiatrist', department: 'Child Psychiatry', license: 'MCI-PSY-11345', phone: '+91 98100 33003', email: 'priya.nair@hospital.in', experience: '9 yrs', status: 'Active', avatar: '👩‍⚕️' },
    { name: 'Dr. Karthik Rajan', role: 'Doctor', designation: 'Geriatric Psychiatrist', department: 'Geriatric Care', license: 'MCI-PSY-12001', phone: '+91 98100 44004', email: 'karthik.rajan@hospital.in', experience: '15 yrs', status: 'On Leave', avatar: '👨‍⚕️' },
    { name: 'Dr. Sneha Patel', role: 'Doctor', designation: 'Addiction Psychiatrist', department: 'De-addiction Unit', license: 'MCI-PSY-13765', phone: '+91 98100 55005', email: 'sneha.patel@hospital.in', experience: '11 yrs', status: 'Active', avatar: '👩‍⚕️' },
    // Nurses
    { name: 'Kavitha Pillai', role: 'Nurse', designation: 'Head Nurse – Psychiatric Ward', department: 'Inpatient Ward A', license: 'NCI-2034-MH', phone: '+91 98200 11001', email: 'kavitha.p@hospital.in', experience: '14 yrs', status: 'Active', avatar: '👩‍⚕️' },
    { name: 'Deepak Verma', role: 'Nurse', designation: 'Staff Nurse – ICU', department: 'Psychiatric ICU', license: 'NCI-2871-MH', phone: '+91 98200 22002', email: 'deepak.v@hospital.in', experience: '7 yrs', status: 'Active', avatar: '👨‍⚕️' },
    { name: 'Sunita Rao', role: 'Nurse', designation: 'Charge Nurse', department: 'Inpatient Ward B', license: 'NCI-3109-MH', phone: '+91 98200 33003', email: 'sunita.r@hospital.in', experience: '10 yrs', status: 'Active', avatar: '👩‍⚕️' },
    { name: 'Arjun Sinha', role: 'Nurse', designation: 'Staff Nurse – OPD', department: 'OPD Clinic', license: 'NCI-3456-MH', phone: '+91 98200 44004', email: 'arjun.s@hospital.in', experience: '5 yrs', status: 'On Leave', avatar: '👨‍⚕️' },
    // Psychologists
    { name: 'Dr. Isha Gupta', role: 'Psychologist', designation: 'Clinical Psychologist', department: 'Therapy Centre', license: 'RCI-CL-20451', phone: '+91 98300 11001', email: 'isha.gupta@hospital.in', experience: '13 yrs', status: 'Active', avatar: '👩‍🔬' },
    { name: 'Rahul Bose', role: 'Psychologist', designation: 'Neuropsychologist', department: 'Neuro-Psych Unit', license: 'RCI-NP-21034', phone: '+91 98300 22002', email: 'rahul.bose@hospital.in', experience: '8 yrs', status: 'Active', avatar: '👨‍🔬' },
    { name: 'Meera Krishnan', role: 'Psychologist', designation: 'Rehabilitation Psychologist', department: 'Rehab Services', license: 'RCI-RH-21999', phone: '+91 98300 33003', email: 'meera.k@hospital.in', experience: '6 yrs', status: 'Active', avatar: '👩‍🔬' },
    { name: 'Amit Deshpande', role: 'Psychologist', designation: 'Child Psychologist', department: 'Child Psychiatry', license: 'RCI-CL-22345', phone: '+91 98300 44004', email: 'amit.d@hospital.in', experience: '4 yrs', status: 'Active', avatar: '👨‍🔬' },
    // Psychiatric Social Workers
    { name: 'Lalitha Nandan', role: 'Psychiatric Social Worker', designation: 'Senior PSW', department: 'Community Mental Health', license: 'NABH-PSW-5001', phone: '+91 98400 11001', email: 'lalitha.n@hospital.in', experience: '16 yrs', status: 'Active', avatar: '👩‍💼' },
    { name: 'Suresh Iyer', role: 'Psychiatric Social Worker', designation: 'PSW – Rehabilitation', department: 'Rehab & Reintegration', license: 'NABH-PSW-5212', phone: '+91 98400 22002', email: 'suresh.i@hospital.in', experience: '11 yrs', status: 'Active', avatar: '👨‍💼' },
    { name: 'Divya Menon', role: 'Psychiatric Social Worker', designation: 'PSW – Family Therapy', department: 'Family Support Unit', license: 'NABH-PSW-5398', phone: '+91 98400 33003', email: 'divya.m@hospital.in', experience: '8 yrs', status: 'On Leave', avatar: '👩‍💼' },
    { name: 'Bikash Das', role: 'Psychiatric Social Worker', designation: 'PSW – Crisis Intervention', department: 'Emergency Psychiatry', license: 'NABH-PSW-5501', phone: '+91 98400 44004', email: 'bikash.d@hospital.in', experience: '5 yrs', status: 'Active', avatar: '👨‍💼' },
];

/* ─────────────────────────────────────────── helpers ─────────────────────────────────────────── */

async function upsertUser(data) {
    const existing = await User.findOne({ email: data.email });
    if (existing) {
        console.log(`  ↩  User already exists: ${data.email}`);
        return existing;
    }
    const user = await User.create(data);
    console.log(`  ✔  Created user: ${data.email}`);
    return user;
}

async function upsertPatient(userId, profileData, emergencyData) {
    let patient = await Patient.findOne({ user: userId });
    if (!patient) {
        patient = new Patient({ user: userId });
    }
    Object.assign(patient, profileData);
    patient.emergency = emergencyData;
    await patient.save();
    console.log(`  ✔  Upserted Patient record for user: ${userId}`);
    return patient;
}

/* ─────────────────────────────────────────── main ─────────────────────────────────────────── */

async function seed() {
    console.log('\n🌱  Connecting to MongoDB …');
    await mongoose.connect(MONGO_URI);
    console.log('✅  Connected.\n');

    /* 1. Create doctor user */
    console.log('--- Creating Doctor ---');
    const doctorUser = await upsertUser(DOCTOR_DATA);

    /* Upsert Doctor document */
    let doctorDoc = await Doctor.findOne({ user: doctorUser._id });
    if (!doctorDoc) {
        doctorDoc = new Doctor({ user: doctorUser._id, assignedPatients: [] });
    }

    /* 1.5. Create caregiver user */
    console.log('\n--- Creating Caregiver ---');
    const caregiverUser = await upsertUser(CAREGIVER_DATA);
    let caregiverDoc = await Caregiver.findOne({ user: caregiverUser._id });
    if (!caregiverDoc) {
        caregiverDoc = await Caregiver.create({ user: caregiverUser._id, assignedPatients: [] });
        console.log(`  ✔  Created Caregiver profile for ${CAREGIVER_DATA.email}`);
    }

    /* 2. Create patient users + profiles */
    console.log('\n--- Creating Patients ---');
    const patientDocs = [];
    for (const pd of PATIENTS_DATA) {
        const { email, password, role, profile, emergency } = pd;
        const patientUser = await upsertUser({ email, password, role });
        const patientDoc = await upsertPatient(patientUser._id, profile, emergency);
        patientDocs.push(patientDoc);
    }

    /* 3. Assign all patients to the doctor */
    console.log('\n--- Linking patients to doctor ---');
    doctorDoc.assignedPatients = patientDocs.map(p => p._id);
    await doctorDoc.save();
    console.log(`  ✔  Assigned ${patientDocs.length} patients to ${DOCTOR_DATA.email}`);

    /* 4. Seed medicines */
    console.log('\n--- Seeding Medicines ---');
    let medicineCount = 0;
    for (const med of MEDICINES_DATA) {
        const exists = await Medicine.findOne({ name: med.name });
        if (!exists) {
            await Medicine.create(med);
            console.log(`  ✔  Added medicine: ${med.name}`);
            medicineCount++;
        } else {
            console.log(`  ↩  Medicine already exists: ${med.name}`);
        }
    }
    console.log(`  ✔  Medicines seeded (${medicineCount} new, ${MEDICINES_DATA.length - medicineCount} skipped).`);

    /* 5. Seed staff */
    console.log('\n--- Seeding Hospital Staff ---');
    let staffCount = 0;
    for (const member of STAFF_DATA) {
        const exists = await Staff.findOne({ email: member.email });
        if (!exists) {
            await Staff.create(member);
            console.log(`  ✔  Added staff: ${member.name}`);
            staffCount++;
        } else {
            console.log(`  ↩  Staff already exists: ${member.name}`);
        }
    }
    console.log(`  ✔  Staff seeded (${staffCount} new, ${STAFF_DATA.length - staffCount} skipped).`);

    /* 7. Seed Reports */
    console.log('\n--- Seeding Medical Reports ---');
    const doctorUser2 = await User.findOne({ email: DOCTOR_DATA.email });
    const allPatients = await Patient.find({}).populate('user', 'email');

    const REPORT_TEMPLATES = [
        { titleFn: (p) => `Cognitive Decline Assessment – ${p}`, type: 'Assessment', priority: 'High', status: 'Completed', daysAgo: 5 },
        { titleFn: (p) => `Medication Efficacy Report – ${p}`, type: 'Medication', priority: 'Medium', status: 'Completed', daysAgo: 8 },
        { titleFn: (p) => `Monthly Progress Review – ${p}`, type: 'Progress', priority: 'Low', status: 'Completed', daysAgo: 11 },
        { titleFn: (p) => `Behavioral Incident Report – ${p}`, type: 'Incident', priority: 'High', status: 'Pending', daysAgo: 3 },
        { titleFn: (p) => `Memory Function Test – ${p}`, type: 'Assessment', priority: 'Medium', status: 'Pending', daysAgo: 2 },
        { titleFn: (p) => `Post-MRI Neurological Evaluation – ${p}`, type: 'Diagnostic', priority: 'High', status: 'In Review', daysAgo: 1 },
        { titleFn: (p) => `Annual Dementia Stage Classification – ${p}`, type: 'Assessment', priority: 'High', status: 'Completed', daysAgo: 23 },
    ];

    let reportCount = 0;
    for (const patient of allPatients) {
        const patientName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || patient.user?.email || 'Patient';
        // Pick 2-3 templates per patient to avoid flooding
        const templates = REPORT_TEMPLATES.slice(0, 3);
        for (const tmpl of templates) {
            const title = tmpl.titleFn(patientName);
            const exists = await Report.findOne({ title, doctor: doctorUser2._id });
            if (!exists) {
                const reportDate = new Date();
                reportDate.setDate(reportDate.getDate() - tmpl.daysAgo);
                await Report.create({
                    title,
                    patient: patient._id,
                    patientName,
                    doctor: doctorUser2._id,
                    type: tmpl.type,
                    priority: tmpl.priority,
                    status: tmpl.status,
                    date: reportDate,
                });
                console.log(`  ✔  Added report: ${title}`);
                reportCount++;
            } else {
                console.log(`  ↩  Report already exists: ${title}`);
            }
        }
    }
    console.log(`  ✔  Reports seeded (${reportCount} new).`);

    /* 8. Seed Appointments */
    console.log('\n--- Seeding Appointments ---');
    let appointmentCount = 0;
    const APPOINTMENT_TEMPLATES = [
        { doctorName: 'Dr. Arjun Sharma', department: 'Geriatric Psychiatry', time: '10:00 AM', status: 'Upcoming', daysOffset: 2 },
        { doctorName: 'Dr. Aanya Sharma', department: 'Inpatient Psychiatry', time: '02:00 PM', status: 'Upcoming', daysOffset: 5 },
        { doctorName: 'Dr. Rohan Mehta', department: 'OPD & Outpatient', time: '11:00 AM', status: 'Cancelled', daysOffset: -2 },
        { doctorName: 'Dr. Priya Nair', department: 'Child Psychiatry', time: '09:30 AM', status: 'Completed', daysOffset: -5 },
    ];

    for (const patient of allPatients) {
        for (const tmpl of APPOINTMENT_TEMPLATES) {
            const appointmentDate = new Date();
            appointmentDate.setDate(appointmentDate.getDate() + tmpl.daysOffset);
            const dateStr = appointmentDate.toISOString().split('T')[0];

            const exists = await Appointment.findOne({
                patient: patient._id,
                doctorName: tmpl.doctorName,
                date: dateStr
            });

            if (!exists) {
                await Appointment.create({
                    patient: patient._id,
                    doctor: doctorUser2._id, // Assign to seeded doctor
                    doctorName: tmpl.doctorName,
                    department: tmpl.department,
                    date: dateStr,
                    time: tmpl.time,
                    status: tmpl.status,
                    notes: 'Seeded appointment',
                });
                appointmentCount++;
            }
        }

        // Sync Patient.nextAppointment for seeded patients
        const nextAppt = await Appointment.findOne({
            patient: patient._id,
            status: 'Upcoming'
        }).sort({ date: 1, time: 1 });
        if (nextAppt) {
            patient.nextAppointment = nextAppt.date;
            await patient.save();
        }
    }
    console.log(`  ✔  Appointments seeded (${appointmentCount} new).`);

    /* 9. Done */
    console.log('\n✅  Seed complete!');
    console.log('\n🔑  Login credentials:');
    console.log('    Doctor  → doctor@hc.com  / doctor123');
    console.log('    Patient → patient1@hc.com … patient5@hc.com  / patient123\n');
    await mongoose.disconnect();
}

seed().catch(err => {
    console.error('❌  Seed failed:', err.message);
    process.exit(1);
});
