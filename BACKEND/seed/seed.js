'use strict';
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// ──────────────────────────────────────────────────────────────────────────────
// CRITICAL FIX — Windows DNS Stub Resolver Bug
// Node.js libuv cannot reach Windows's 127.0.0.1 DNS stub via raw UDP.
// Override to Google Public DNS BEFORE any mongoose.connect() call.
// ──────────────────────────────────────────────────────────────────────────────
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

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

const mongoose = require('mongoose');
const { USERS, PATIENT_PROFILES, MEDICINES, STAFF_DATA } = require('./seedData');

const User         = require('../models/User');
const Patient      = require('../models/Patient');
const Doctor       = require('../models/Doctor');
const Caregiver    = require('../models/Caregiver');
const Appointment  = require('../models/Appointment');
const Medicine     = require('../models/Medicine');
const Prescription = require('../models/Prescription');
const Report       = require('../models/Report');
const CaregiverNote= require('../models/CaregiverNote');
const Chat         = require('../models/Chat');
const Staff        = require('../models/Staff');
const Task         = require('../models/Task');
const DailyTask    = require('../models/DailyTask');

const log = (col, n) => console.log(`  ✔  ${col.padEnd(18)} ${n} record(s) seeded`);

function daysFromNow(d) { const dt=new Date(); dt.setDate(dt.getDate()+d); return dt; }
function fmt(d){ return d.toISOString().split('T')[0]; }

async function seedUsers() {
  let created=0;
  const out={};
  for(const u of USERS){
    let doc=await User.findOne({email:u.email});
    if(!doc){
      // Plain password is passed. Mongoose pre-save hook will hash it exactly once.
      doc=await User.create(u);
      created++;
    } else {
      // Overwrite the password and trigger save to re-hash and fix any double-hashed states.
      doc.password = u.password;
      Object.assign(doc, u);
      await doc.save();
    }
    out[u.email]=doc;
  }
  log('Users',created);
  return out;
}

async function seedPatients(users,userMap){
  const patientEmails=['patient.mohan@dementiacare.in','patient.savitri@dementiacare.in','patient.baldev@dementiacare.in','patient.kamala@dementiacare.in','patient.ramesh@dementiacare.in'];
  const cgEmails=['caregiver.lakshmi@dementiacare.in','caregiver.anita@dementiacare.in','caregiver.ravi@dementiacare.in'];
  const drEmails=['dr.arora@dementiacare.in','dr.menon@dementiacare.in'];
  // doctor assignment: 0->dr0,1->dr0,2->dr1,3->dr1,4->dr0
  const drIdx=[0,0,1,1,0];
  const cgIdx=[0,0,1,1,2];
  const patientDocs=[];
  let created=0;
  for(let i=0;i<patientEmails.length;i++){
    const pUser=userMap[patientEmails[i]];
    let doc=await Patient.findOne({user:pUser._id});
    const updateData = {
      user:pUser._id,
      assignedCaregiver:userMap[cgEmails[cgIdx[i]]]._id,
      assignedDoctor:userMap[drEmails[drIdx[i]]]._id,
      ...PATIENT_PROFILES[i]
    };
    if(!doc){
      doc=await Patient.create(updateData);
      created++;
    } else {
      Object.assign(doc, updateData);
      await doc.save();
    }
    patientDocs.push(doc);
  }
  log('Patients',created);
  return {patientDocs,cgEmails,drEmails,cgIdx,drIdx};
}

async function seedDoctorsAndCaregivers(userMap,patientDocs,cgEmails,drEmails,cgIdx,drIdx){
  const drUsers=[userMap[drEmails[0]],userMap[drEmails[1]]];
  let dc=0;
  for(let d=0;d<2;d++){
    const pats=patientDocs.filter((_,i)=>drIdx[i]===d).map(p=>p._id);
    let doc=await Doctor.findOne({user:drUsers[d]._id});
    if(!doc){
      await Doctor.create({user:drUsers[d]._id,assignedPatients:pats});
      dc++;
    } else {
      doc.assignedPatients = pats;
      await doc.save();
    }
  }
  log('Doctors',dc);

  const cgUsers=[userMap[cgEmails[0]],userMap[cgEmails[1]],userMap[cgEmails[2]]];
  let cc=0;
  for(let c=0;c<3;c++){
    const pats=patientDocs.filter((_,i)=>cgIdx[i]===c).map(p=>p._id);
    let doc=await Caregiver.findOne({user:cgUsers[c]._id});
    if(!doc){
      await Caregiver.create({user:cgUsers[c]._id,assignedPatients:pats});
      cc++;
    } else {
      doc.assignedPatients = pats;
      await doc.save();
    }
  }
  log('Caregivers',cc);
  return {drUsers,cgUsers};
}

async function seedMedicines(){
  let created=0;
  const docs=[];
  for(const m of MEDICINES){
    let doc=await Medicine.findOne({generic:m.generic});
    if(!doc){
      doc=await Medicine.create(m);
      created++;
    } else {
      Object.assign(doc, m);
      await doc.save();
    }
    docs.push(doc);
  }
  log('Medicines',created);
  return docs;
}

async function seedAppointments(patientDocs,drUsers,userMap,drEmails){
  let created=0;
  const types=['Cognitive Assessment','Follow-up Consultation','Medication Review','MRI Brain Scan','Neuropsychological Testing','Routine Checkup'];
  const times=['09:00 AM','10:30 AM','11:00 AM','02:00 PM','03:30 PM','04:00 PM'];
  const pairs=[
    [0,0,-30],[0,0,-14],[0,0,15],[1,0,-20],[1,0,12],
    [2,1,-10],[2,1,20],[3,1,-5],[3,1,25],[4,0,8],
  ];

  for(let idx=0; idx<pairs.length; idx++){
    const [pi,di,days] = pairs[idx];
    const date = fmt(daysFromNow(days));
    const time = times[idx % times.length];
    const type = types[idx % types.length];
    const status = days<0?'Completed':(days===8?'Cancelled':'Upcoming');
    const notes = days<0?'Follow-up required. Patient stable.':'';
    const patientId = patientDocs[pi]._id;
    const doctorId = drUsers[di]._id;

    let doc = await Appointment.findOne({ patient: patientId, doctor: doctorId, date, time });
    const updateData = {
      patient: patientId,
      doctor: doctorId,
      doctorName:`Dr. ${drUsers[di].firstName} ${drUsers[di].lastName}`,
      department:drUsers[di].department,
      date,
      time,
      status,
      type,
      notes
    };

    if (!doc) {
      await Appointment.create(updateData);
      created++;
    } else {
      Object.assign(doc, updateData);
      await doc.save();
    }
  }
  log('Appointments',created);
}

async function seedPrescriptions(patientDocs,drUsers,medicineDocs){
  let created=0;
  const rxs=[
    {pi:0,di:0,mi:0,dosage:'10mg',freq:'Once daily at bedtime',instr:'Take with water. Avoid alcohol.'},
    {pi:0,di:0,mi:1,dosage:'10mg',freq:'Twice daily',instr:'Take with meals.'},
    {pi:1,di:0,mi:2,dosage:'6mg',freq:'Twice daily with meals',instr:'Monitor for nausea.'},
    {pi:1,di:0,mi:5,dosage:'5mg',freq:'Once daily',instr:'Check BP weekly.'},
    {pi:2,di:1,mi:2,dosage:'4.5mg',freq:'Twice daily',instr:'Take with food.'},
    {pi:2,di:1,mi:3,dosage:'25mg',freq:'At bedtime',instr:'Monitor for sedation.'},
    {pi:3,di:1,mi:0,dosage:'5mg',freq:'Once daily at bedtime',instr:'Do not crush tablet.'},
    {pi:4,di:0,mi:4,dosage:'50mg',freq:'Once daily with breakfast',instr:'Takes 4-6 weeks for full effect.'},
    {pi:4,di:0,mi:1,dosage:'5mg',freq:'Once daily',instr:'Titrate slowly.'},
  ];

  for (const r of rxs) {
    const patientId = patientDocs[r.pi]._id;
    const doctorId = drUsers[r.di]._id;
    const medicineId = medicineDocs[r.mi]._id;

    let doc = await Prescription.findOne({
      patient: patientId,
      doctor: doctorId,
      medicine: medicineId
    });

    const updateData = {
      medicineName:medicineDocs[r.mi].name,
      medicine:medicineId,
      dosage:r.dosage,
      frequency:r.freq,
      instructions:r.instr,
      patient:patientId,
      doctor:doctorId,
      startDate:daysFromNow(-30),
      endDate:daysFromNow(60),
    };

    if (!doc) {
      await Prescription.create(updateData);
      created++;
    } else {
      Object.assign(doc, updateData);
      await doc.save();
    }
  }
  log('Prescriptions',created);
}

async function seedReports(patientDocs,drUsers){
  let created=0;
  const reportData=[
    {pi:0,di:0,title:'MMSE Cognitive Assessment – June 2026',type:'Assessment',priority:'High',status:'Completed',text:'MMSE score: 16/30. Moderate cognitive decline noted. Visuospatial deficits present.'},
    {pi:0,di:0,title:'Donepezil Medication Review',type:'Medication',priority:'Medium',status:'Completed',text:'Patient tolerating Donepezil 10mg well. No significant side effects. Continue current regimen.'},
    {pi:1,di:0,title:'MRI Brain – Vascular Changes Report',type:'Diagnostic',priority:'High',status:'Completed',text:'Moderate periventricular white matter changes. Consistent with vascular dementia diagnosis.'},
    {pi:1,di:0,title:'Monthly Progress Note – June 2026',type:'Progress',priority:'Medium',status:'In Review',text:'Patient showing slight improvement in orientation. Family reports better sleep patterns.'},
    {pi:2,di:1,title:'Neuropsychological Evaluation',type:'Assessment',priority:'High',status:'Completed',text:'Consistent with Lewy Body Dementia. Visual hallucinations reported twice in past month.'},
    {pi:2,di:1,title:'Fall Incident Report – 15 June 2026',type:'Incident',priority:'High',status:'Completed',text:'Patient fell in bathroom at 06:30. No fractures on X-ray. Bed rails to be installed.'},
    {pi:3,di:1,title:'Initial Dementia Assessment',type:'Assessment',priority:'Medium',status:'Completed',text:'Early Alzheimer\'s confirmed. MoCA score 22/30. Patient cooperative and aware of diagnosis.'},
    {pi:4,di:0,title:'FTD Behaviour Management Plan',type:'Progress',priority:'High',status:'In Review',text:'Disinhibition episodes reduced with Sertraline. Family counselling sessions ongoing.'},
    {pi:4,di:0,title:'EEG Report – May 2026',type:'Diagnostic',priority:'Medium',status:'Completed',text:'Mild diffuse slowing. No epileptiform discharges. Repeat in 6 months recommended.'},
  ];

  for (let idx = 0; idx < reportData.length; idx++) {
    const r = reportData[idx];
    const patientId = patientDocs[r.pi]._id;
    const doctorId = drUsers[r.di]._id;

    let doc = await Report.findOne({
      title: r.title,
      patient: patientId,
      doctor: doctorId
    });

    const updateData = {
      title:r.title,
      patient:patientId,
      patientName:`${patientDocs[r.pi].firstName} ${patientDocs[r.pi].lastName}`,
      doctor:doctorId,
      type:r.type,priority:r.priority,status:r.status,
      date:daysFromNow(-15 - (idx * 2)),
      filePath:`/reports/${r.title.replace(/\s+/g,'_').toLowerCase()}.pdf`,
      extractedText:r.text,
    };

    if (!doc) {
      await Report.create(updateData);
      created++;
    } else {
      Object.assign(doc, updateData);
      await doc.save();
    }
  }
  log('Reports',created);
}

async function seedCaregiverNotes(patientDocs,cgUsers){
  let created=0;
  const notes=[
    {pi:0,ci:0,d:-1,note:'Patient woke at 3AM confused about location. Redirected calmly. Returned to sleep by 3:45AM. Morning routine completed without issues.'},
    {pi:0,ci:0,d:-2,note:'Refused morning medication initially. Offered with juice and gentle encouragement – took all medications by 9AM. Good appetite at lunch.'},
    {pi:1,ci:0,d:-1,note:'Patient participated in memory card activity for 20 minutes. Recognised daughter in photo album. Positive mood throughout the day.'},
    {pi:1,ci:0,d:-3,note:'Mild agitation observed after dinner. Possible sundowning. Played familiar Tamil music which calmed patient within 15 minutes.'},
    {pi:2,ci:1,d:-1,note:'Patient reported seeing "a man in the corner" in the morning – visual hallucination. Noted and reported to Dr. Menon. Kept patient engaged with walking.'},
    {pi:2,ci:1,d:-2,note:'Good day overall. Completed physiotherapy exercises. Ate full meals. Fall prevention rails checked – all secure.'},
    {pi:3,ci:1,d:-1,note:'Patient was cheerful and cooperative. Joined group reminiscence activity via video call with family. BP: 128/82. All normal.'},
    {pi:4,ci:2,d:-1,note:'Mild disinhibition episode at 11AM – used inappropriate language with carer. De-escalated with redirection. Episode lasted ~5 min.'},
    {pi:4,ci:2,d:-2,note:'Patient completed morning walk of 500m independently. Very positive. Took all medications. Family visited in evening – patient very happy.'},
  ];

  for (const n of notes) {
    const patientId = patientDocs[n.pi]._id;
    const caregiverId = cgUsers[n.ci]._id;

    let doc = await CaregiverNote.findOne({
      patient: patientId,
      caregiver: caregiverId,
      note: n.note
    });

    const updateData = {
      patient:patientId,
      caregiver:caregiverId,
      note:n.note,
      date:daysFromNow(n.d),
    };

    if (!doc) {
      await CaregiverNote.create(updateData);
      created++;
    } else {
      Object.assign(doc, updateData);
      await doc.save();
    }
  }
  log('CaregiverNotes',created);
}

async function seedChats(patientDocs){
  let created=0;
  const conversations=[
    {pi:0,msgs:[
      {role:'user',message:'I am feeling very confused today. Where am I?'},
      {role:'assistant',message:'You are at home, in your room in New Delhi. You are safe. This is your Dementia Care assistant speaking. Would you like me to help you with your morning routine?'},
      {role:'user',message:'Yes please. What medicines do I need to take?'},
      {role:'assistant',message:'Good morning, Mohan ji! You need to take Aricept 10mg and Ebixa 10mg with a glass of water. Your caregiver Lakshmi will bring them to you shortly.'},
    ]},
    {pi:1,msgs:[
      {role:'user',message:'Did I eat breakfast today?'},
      {role:'assistant',message:'Yes, Savitri ji! You had idli and sambar for breakfast at 8:30 AM today. Your next meal is lunch at 1:00 PM.'},
      {role:'user',message:'What is today\'s date?'},
      {role:'assistant',message:`Today is ${new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}. You have a doctor\'s appointment coming up soon – I will remind you.`},
    ]},
    {pi:2,msgs:[
      {role:'user',message:'I saw someone in my room. I am scared.'},
      {role:'assistant',message:'I understand that can feel frightening, Baldev ji. I want you to know that you are completely safe. Your caregiver Anita is nearby and can come to you right away. This can sometimes happen and it is part of your condition. Shall I alert your caregiver?'},
      {role:'user',message:'Yes please call her.'},
      {role:'assistant',message:'I have alerted Anita. She will be with you in just a moment. Take slow, deep breaths. You are safe at home.'},
    ]},
  ];

  for(const conv of conversations){
    for(const msg of conv.msgs){
      const patientId = patientDocs[conv.pi]._id;
      let doc = await Chat.findOne({
        patient: patientId,
        role: msg.role,
        message: msg.message
      });

      if (!doc) {
        await Chat.create({
          patient: patientId,
          role: msg.role,
          message: msg.message
        });
        created++;
      }
    }
  }
  log('Chats',created);
}

async function seedStaff(){
  let created=0;
  for(const s of STAFF_DATA){
    let doc=await Staff.findOne({email:s.email});
    if(!doc){
      await Staff.create(s);
      created++;
    } else {
      Object.assign(doc, s);
      await doc.save();
    }
  }
  log('Staff',created);
}

async function seedTasks(patientDocs,cgUsers,cgIdx,userMap,cgEmails){
  let created=0;
  const taskData=[
    {pi:0,ci:0,title:'Administer morning medications',category:'Medication',priority:'High',status:'Completed',desc:'Give Donepezil 10mg and Memantine 10mg with breakfast.',daysOffset:0},
    {pi:0,ci:0,title:'Cognitive stimulation – memory cards',category:'Exercise',priority:'Medium',status:'In Progress',desc:'30-minute memory card matching activity.',daysOffset:1},
    {pi:1,ci:0,title:'Blood pressure monitoring',category:'Other',priority:'High',status:'Pending',desc:'Check BP twice daily and log readings.',daysOffset:0},
    {pi:1,ci:0,title:'Evening walk – 20 minutes',category:'Exercise',priority:'Medium',status:'Pending',desc:'Supervised walk around the garden area.',daysOffset:1},
    {pi:2,ci:1,title:'Physiotherapy exercises – morning',category:'Exercise',priority:'High',status:'Completed',desc:'Balance and strength exercises as per physio plan.',daysOffset:0},
    {pi:2,ci:1,title:'Hallucination episode log',category:'Other',priority:'High',status:'Pending',desc:'Document any visual/auditory hallucinations with time and duration.',daysOffset:0},
    {pi:3,ci:1,title:'Video call with family',category:'Personal',priority:'Low',status:'Completed',desc:'Weekly video call with son Kiran and family.',daysOffset:-1},
    {pi:4,ci:2,title:'Behavioural observation log',category:'Other',priority:'High',status:'In Progress',desc:'Monitor disinhibition episodes and log triggers.',daysOffset:0},
    {pi:4,ci:2,title:'Medication review appointment prep',category:'Appointment',priority:'Medium',status:'Pending',desc:'Prepare medication history notes before doctor visit.',daysOffset:2},
  ];
  
  const cgUserDocs=cgUsers;
  for (const t of taskData) {
    const patientId = patientDocs[t.pi]._id;
    const cgUserDoc = cgUserDocs[t.ci];

    let doc = await Task.findOne({
      title: t.title,
      patient: patientId,
      caregiver: cgUserDoc._id
    });

    const updateData = {
      title:t.title,description:t.desc,
      priority:t.priority,status:t.status,category:t.category,
      dueDate:daysFromNow(t.daysOffset),
      patient:patientId,
      caregiver:cgUserDoc._id,
      createdBy:cgUserDoc._id,
    };

    if (!doc) {
      await Task.create(updateData);
      created++;
    } else {
      Object.assign(doc, updateData);
      await doc.save();
    }
  }
  log('Tasks',created);
}

async function seedDailyTasks(patientDocs,caregiverDocs){
  let created=0;
  const data=[
    {pi:0,ci:0,desc:'Morning medication administration',completed:true,dOff:-1},
    {pi:0,ci:0,desc:'Personal hygiene assistance',completed:true,dOff:-1},
    {pi:0,ci:0,desc:'Breakfast preparation and feeding assistance',completed:false,dOff:0},
    {pi:1,ci:0,desc:'BP monitoring – morning',completed:true,dOff:0},
    {pi:1,ci:0,desc:'Medication – Rivastigmine and Amlodipine',completed:true,dOff:0},
    {pi:2,ci:1,desc:'Fall prevention check – bed rails and floor mats',completed:true,dOff:0},
    {pi:2,ci:1,desc:'Evening medication – Quetiapine 25mg',completed:false,dOff:0},
    {pi:3,ci:1,desc:'Morning memory activity – photo album review',completed:true,dOff:0},
    {pi:4,ci:2,desc:'Behavioural observation and logging',completed:false,dOff:0},
  ];

  for (const d of data) {
    const patientId = patientDocs[d.pi]._id;
    const caregiverId = caregiverDocs[d.ci]._id;

    let doc = await DailyTask.findOne({
      description: d.desc,
      patient: patientId,
      caregiver: caregiverId
    });

    const updateData = {
      description:d.desc,
      patient:patientId,
      caregiver:caregiverId,
      isCompleted:d.completed,
      date:daysFromNow(d.dOff),
    };

    if (!doc) {
      await DailyTask.create(updateData);
      created++;
    } else {
      Object.assign(doc, updateData);
      await doc.save();
    }
  }
  log('DailyTasks',created);
}

async function main(){
  console.log('\n🌱  DementiaCare Seed Script Starting...\n');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅  Connected to MongoDB Atlas\n');
  console.log('──────────────────────────────────────────');
  const userMap=await seedUsers();
  const {patientDocs,cgEmails,drEmails,cgIdx,drIdx}=await seedPatients(null,userMap);
  const {drUsers,cgUsers}=await seedDoctorsAndCaregivers(userMap,patientDocs,cgEmails,drEmails,cgIdx,drIdx);
  const medicineDocs=await seedMedicines();
  const caregiverDocs=await Caregiver.find({user:{$in:cgUsers.map(c=>c._id)}});
  await seedAppointments(patientDocs,drUsers,userMap,drEmails);
  await seedPrescriptions(patientDocs,drUsers,medicineDocs);
  await seedReports(patientDocs,drUsers);
  await seedCaregiverNotes(patientDocs,cgUsers);
  await seedChats(patientDocs);
  await seedStaff();
  await seedTasks(patientDocs,cgUsers,cgIdx,userMap,cgEmails);
  await seedDailyTasks(patientDocs,caregiverDocs);
  console.log('──────────────────────────────────────────');
  console.log('\n✅  Seeding complete! All collections populated.\n');
  console.log('📋  Login Credentials:');
  console.log('    Admin     → admin@dementiacare.in       / Admin@1234');
  console.log('    Doctor 1  → dr.arora@dementiacare.in   / Doctor@1234');
  console.log('    Doctor 2  → dr.menon@dementiacare.in   / Doctor@1234');
  console.log('    Caregiver → caregiver.lakshmi@dementiacare.in / Care@1234');
  console.log('    Patient   → patient.mohan@dementiacare.in / Patient@1234\n');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(e=>{console.error('❌ Seed failed:',e.message);process.exit(1);});