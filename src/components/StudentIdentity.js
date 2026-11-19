"use client";
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {useSession} from '../app/lib/SessionProvider';
import api from '../app/lib/api';
import {createClientId} from '../app/lib/clientId';
import StudentIdentityFields from './StudentIdentityFields';
import './student-identity.css';
const statusText={pending:'Student ID under review',approved:'Verified student',replacement_requested:'Replacement ID requested'};
export default function StudentIdentity(){const {user,status,refresh}=useSession();return status==='authenticated'?<IdentityAccount key={user.id} user={user} refresh={refresh}/>:null;}
function IdentityAccount({user,refresh}){
 const [submission,setSubmission]=useState(null),[form,setForm]=useState({university:user.university||'',university_id:'',matric_number:''}),[file,setFile]=useState(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[attempt,setAttempt]=useState(0);
 const pending=useRef(null),alive=useRef(true),lock=useRef(false);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false}},[]);
 useEffect(()=>{let active=true;setLoading(true);api.get('/auth/student-id').then(({data})=>{if(active){setSubmission(data.submission);if(data.submission)setForm(data.submission);setError('')}}).catch(()=>{if(active)setError('Could not load your student ID status. Please retry.')}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[attempt]);
 const submit=async e=>{e.preventDefault();if(lock.current)return;if(!file){setError('Choose a student ID photo.');return;}lock.current=true;setBusy(true);setError('');setNotice('');
 try{if(!pending.current)pending.current=createClientId();const data=new FormData();for(const key of ['university','university_id','matric_number'])data.append(key,form[key]||'');data.append('client_id',pending.current);data.append('student_id',file);
 const saved=await api.post('/auth/student-id',data,{headers:{'Content-Type':'multipart/form-data'},timeout:30000});if(alive.current){pending.current=null;setNotice(saved.data.student_id_status==='approved'?'Student ID already approved. Email verification is separate.':'Student ID under review. Email verification is separate.');setFile(null);setAttempt(x=>x+1);await refresh();}}
 catch(e){if(alive.current)setError(e.response?.data?.message||'Submission could not be confirmed. Retry with the same details; do not create another account.');}
 finally{lock.current=false;if(alive.current)setBusy(false)}};
 return <section className="student-card"><div className="student-heading"><h2>Student identification</h2>{user.role==='admin'&&<Link href="/admin">Admin review</Link>}</div>
 {loading?<p role="status">Loading student ID status...</p>:<><p className="student-status">{statusText[submission?.status]||'Student ID not submitted'}</p><p className="student-help">Email verification and student identification are separate. Your existing account remains accessible while your ID is reviewed.</p>{submission?.review_reason&&<p className="student-notice">Reviewer note: {submission.review_reason}</p>}
 <details open={!submission||submission.status==='replacement_requested'}><summary>{submission?'Submit updated details for a new review':'Submit your student details'}</summary><form onSubmit={submit}><StudentIdentityFields value={form} file={file} onChange={patch=>{pending.current=null;setForm(s=>({...s,...patch}))}} onFile={f=>{pending.current=null;setFile(f)}} disabled={busy}/>{submission&&<p className="student-help">Submitting updated details replaces your current review status and requires fresh approval.</p>}<button className="student-primary" disabled={busy}>{busy?'Saving private ID...':'Submit for review'}</button></form></details></>}
 {error&&<p role="alert" className="student-error">{error} <button type="button" disabled={busy} onClick={()=>setAttempt(x=>x+1)}>Reload status</button></p>}{notice&&<p role="status" className="student-notice">{notice}</p>}</section>
}
