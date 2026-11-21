"use client";
import {useCallback,useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {useSession} from '../app/lib/SessionProvider';
import {createClientId} from '../app/lib/clientId';
import {readStudentIdentity,uploadStudentIdentity,identityErrorMessage,identityErrorStatus,uncertainIdentityUpload} from '../app/lib/studentIdentityRequests';
import StudentIdentityFields from './StudentIdentityFields';
import './student-identity.css';
const statusText={pending:'Student ID under review',approved:'Verified student',replacement_requested:'Replacement ID requested'};
const fields=value=>({university_id:value?.university_id||'',university:value?.university||'',matric_number:value?.matric_number||''});
export default function StudentIdentity(){const {user,status}=useSession();return status==='authenticated'?<IdentityAccount key={user.id} user={user}/>:null;}
function IdentityAccount({user}){
 const [submission,setSubmission]=useState(null),[currentStatus,setCurrentStatus]=useState(user.student_id_status||'not_submitted');
 const [form,setForm]=useState(()=>fields({university:user.university})),[file,setFile]=useState(null);
 const [loaded,setLoaded]=useState(false),[checking,setChecking]=useState(true),[busy,setBusy]=useState(false),[uncertain,setUncertain]=useState(false),[editing,setEditing]=useState(true);
 const [error,setError]=useState(''),[warning,setWarning]=useState(''),[notice,setNotice]=useState(''),[expired,setExpired]=useState(false),[progress,setProgress]=useState(null),[phase,setPhase]=useState('');
 const attempt=useRef(null),alive=useRef(true),locked=useRef(false),dirty=useRef(false),version=useRef(0),request=useRef(null),feedback=useRef(null),hadStatus=useRef(false);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;version.current++;request.current?.abort();locked.current=false;};},[]);
 useEffect(()=>{if(error){feedback.current?.focus({preventScroll:true});feedback.current?.scrollIntoView({block:'nearest'});}},[error]);
 const applyStatus=useCallback((data,preserveDraft=false)=>{
  setSubmission(data.submission);setCurrentStatus(data.submission?.status||data.student_id_status||'not_submitted');setLoaded(true);hadStatus.current=true;
  if(!preserveDraft&&!dirty.current){setForm(fields(data.submission||data.identity_details||{university:user.university}));setEditing(!data.submission||data.submission.status==='replacement_requested');}
 },[user.university]);
 const confirmSaved=useCallback((data,pending,acknowledged=false)=>{
  const matched=data.attempt?.client_id===pending.id||data.submission?.client_id===pending.id;
  if(!matched&&!acknowledged)return false;
  const saved=data.submission||(acknowledged?{...pending.details,id:data.submission_id,client_id:pending.id,status:data.student_id_status}:null);
  const next=saved?.status||data.student_id_status||'pending';
  setSubmission(saved);setCurrentStatus(next);setLoaded(true);hadStatus.current=true;
  setForm(fields(saved||data.identity_details||pending.details));setFile(null);attempt.current=null;dirty.current=false;setUncertain(false);setError('');setWarning('');setExpired(false);
  setNotice(statusText[next]||(next==='not_submitted'?'Upload saved.':'Status updated.'));setEditing(next==='replacement_requested');
  return true;
 },[]);
 const reload=useCallback(async()=>{
  if(locked.current)return;locked.current=true;const ticket=++version.current;request.current?.abort();const controller=new AbortController();request.current=controller;setChecking(true);
  try{
   const pending=attempt.current,data=await readStudentIdentity(pending?.id,controller.signal,user.id);if(!alive.current||ticket!==version.current)return;
   if(pending&&confirmSaved(data,pending))return;
   applyStatus(data,!!pending);setExpired(false);setWarning('');setError('');
   if(pending)setError('No saved upload confirmed. Retry the same photo.');
  }catch(problem){if(alive.current&&ticket===version.current){setExpired(identityErrorStatus(problem)===401);if(hadStatus.current)setWarning(identityErrorMessage(problem));else setError(identityErrorMessage(problem));}}
  finally{if(ticket===version.current){locked.current=false;if(alive.current)setChecking(false);}}
 },[applyStatus,confirmSaved,user.id]);
 useEffect(()=>{reload();},[reload]);
 // Focus refresh never overwrites unsent details or unmounts the photo input.
 useEffect(()=>{const update=()=>{if(!document.hidden&&!locked.current&&!editing)reload();};window.addEventListener('focus',update);return()=>window.removeEventListener('focus',update);},[reload,editing]);
 const submit=async event=>{
  event.preventDefault();if(locked.current)return;
  if(!attempt.current){
   if(!file){setError('Choose a JPG or PNG student ID photo.');return;}
   if(file.size>5242880){setError('Choose a photo of 5 MB or smaller.');return;}
   if(!['image/jpeg','image/png'].includes(file.type)||!file.size){setError('Choose a JPG or PNG student ID photo.');return;}
   if(!form.university.trim()||!form.matric_number.trim()){setError('Confirm your university and enter your matric number.');return;}
   try{attempt.current={id:createClientId(),details:fields(form),file,userId:user.id};}catch(problem){setError(identityErrorMessage(problem));return;}
  }
  const pending=attempt.current,ticket=++version.current;locked.current=true;setBusy(true);setError('');setWarning('');setNotice('');setProgress(null);request.current?.abort();const controller=new AbortController();request.current=controller;
  let postStarted=false;
  try{
   if(uncertain){
    setPhase('Checking saved status...');const saved=await readStudentIdentity(pending.id,controller.signal,user.id);if(!alive.current||ticket!==version.current)return;
    if(confirmSaved(saved,pending))return;applyStatus(saved,true);
   }
   postStarted=true;setPhase('Uploading photo...');
   const saved=await uploadStudentIdentity(pending,controller.signal,event=>{if(alive.current&&ticket===version.current&&event.total)setProgress(Math.min(100,Math.round(event.loaded/event.total*100)));});
   if(!alive.current||ticket!==version.current)return;
   confirmSaved(saved,pending,true);
   // A saved upload is already confirmed. Do not couple it to session/status refresh.
  }catch(problem){
   if(!alive.current||ticket!==version.current)return;
   setExpired(identityErrorStatus(problem)===401);
   if(uncertain&&!postStarted){setError(identityErrorMessage(problem));return;}
   if(uncertainIdentityUpload(problem)){
    setUncertain(true);setPhase('Checking saved status...');
    try{
     const saved=await readStudentIdentity(pending.id,controller.signal,user.id);if(!alive.current||ticket!==version.current)return;
     if(confirmSaved(saved,pending))return;applyStatus(saved,true);setError('No saved upload confirmed. Retry the same photo.');
    }catch(checkError){if(alive.current&&ticket===version.current){setExpired(identityErrorStatus(checkError)===401);setError(identityErrorMessage(checkError));}}
   }else{attempt.current=null;setUncertain(false);setError(identityErrorMessage(problem));}
  }finally{if(ticket===version.current){locked.current=false;if(alive.current){setBusy(false);setChecking(false);setPhase('');}}}
 };
 const change=patch=>{if(locked.current||uncertain)return;dirty.current=true;attempt.current=null;setForm(value=>({...value,...patch}));setError('');setNotice('');};
 const choosePhoto=value=>{if(locked.current||uncertain)return;dirty.current=true;attempt.current=null;setFile(value);setError('');setNotice('');};
 const disabled=busy||checking||uncertain;
 return <section className="student-card"><div className="student-heading"><h2>Student identification</h2><div>{user.role==='admin'&&<Link href="/admin">Admin review</Link>} <button type="button" className="student-secondary" disabled={busy||checking} onClick={reload}>Refresh status</button></div></div>
 <p className="student-status" role="status">{loaded?(statusText[currentStatus]||'Student ID not submitted'):checking?'Checking student ID status...':'Status unavailable'}</p>
 {submission?.review_reason&&<p className="student-notice">Reviewer note: {submission.review_reason}</p>}
 <details open={editing} onToggle={event=>setEditing(event.currentTarget.open)}><summary>{submission?'Update student ID':'Submit your student details'}</summary><form onSubmit={submit}>
 <StudentIdentityFields value={form} file={file} onChange={change} onFile={choosePhoto} disabled={disabled}/>
 {submission&&<p className="student-help">Updated details need a new review.</p>}
 <button className="student-primary" disabled={busy||checking||!loaded}>
 {busy?(phase==='Uploading photo...'&&progress!==null&&progress<100?'Uploading '+progress+'%':phase==='Uploading photo...'?'Saving ID...':phase):uncertain?'Check and retry upload':'Submit for review'}
 </button>{busy&&progress!==null&&<progress max="100" value={progress} aria-label="Photo upload progress"/>}
 </form></details>
 {uncertain&&!busy&&<p className="student-help">Keep this form open. Your details and photo are retained.</p>}
 {error&&<p ref={feedback} tabIndex={-1} role="alert" className="student-error">{error}</p>}
 {warning&&<p role="status" className="student-notice">{warning}</p>}
 {notice&&<p role="status" className="student-notice">{notice}</p>}
 {expired&&<a className="student-secondary" href="/login?next=%2Fdashboard%23settings" target="_blank" rel="noopener noreferrer">Sign in again</a>}
 </section>;
}
