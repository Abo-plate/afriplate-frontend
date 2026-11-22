"use client";
import {useCallback,useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {useSession} from '../app/lib/SessionProvider';
import api from '../app/lib/api';
import {createClientId} from '../app/lib/clientId';
import './student-identity.css';
import StudentIdentity from './StudentIdentity';
import SellerNextStep from './SellerNextStep';
import {canUseSellerTools} from '../app/lib/sellingAccess';
const labels={not_applied:'Apply to sell on AfriPlate',pending:'Application under review',approved:'Approved to sell',declined:'Application declined'};
export default function VendorApplication(){
 const {user,status,refresh}=useSession();
 if(status==='checking')return <p role="status">Checking your account...</p>;
 if(status==='guest')return <p><Link href="/login?next=%2Fsell">Sign in</Link> to apply.</p>;
 if(status!=='authenticated')return <p role="alert">Your account could not be checked. <button className="student-secondary" onClick={refresh}>Retry</button></p>;
 if(user.student_membership==='student'&&!canUseSellerTools(user))return <><h1>Sell on AfriPlate</h1><StudentIdentity/></>;
 if(user.student_membership!=='non_student')return <SellerNextStep/>;
 return <ApplicationForm key={user.id} user={user} refreshSession={refresh}/>;
}
function ApplicationForm({user,refreshSession}){
 const [data,setData]=useState(null),[form,setForm]=useState({business_name:'',description:''}),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState(''),[uncertain,setUncertain]=useState(false);
 const active=useRef(true),lock=useRef(false),attempt=useRef(null),dirty=useRef(false),controller=useRef(null),version=useRef(0);
 useEffect(()=>{active.current=true;return()=>{active.current=false;version.current++;controller.current?.abort();lock.current=false;};},[]);
 const read=useCallback(async(signal)=>{const result=await api.get('/auth/vendor-application',{signal});if(result.data.account_id!==user.id)throw Error('Account changed');return result.data;},[user.id]);
 const apply=useCallback(saved=>{const pending=attempt.current,row=saved.application;const recovered=pending&&(saved.vendor_status==='approved'||row&&(row.client_id===pending.client_id||row.status==='pending'&&row.business_name===pending.business_name&&row.description===pending.description));if(recovered){dirty.current=false;attempt.current=null;setUncertain(false);}setData(saved);if(!dirty.current&&row)setForm({business_name:row.business_name,description:row.description});},[]);
 const reload=useCallback(async()=>{if(lock.current)return;lock.current=true;const ticket=++version.current;const abort=new AbortController();controller.current=abort;setLoading(true);setError('');try{const saved=await read(abort.signal);if(active.current&&ticket===version.current)apply(saved);}catch(problem){if(active.current&&ticket===version.current)setError(problem.response?.data?.message||'Could not check your application. Retry.');}finally{if(ticket===version.current){lock.current=false;if(active.current)setLoading(false);}}},[read,apply]);
 useEffect(()=>{reload();},[reload]);
 useEffect(()=>{const focus=()=>{if(!document.hidden&&!dirty.current&&!lock.current)reload();};window.addEventListener('focus',focus);return()=>window.removeEventListener('focus',focus);},[reload]);
 const confirmed=(saved,pending)=>saved.vendor_status==='approved'||saved.application&&(saved.application.client_id===pending.client_id||saved.application.status==='pending'&&saved.application.business_name===pending.business_name&&saved.application.description===pending.description);
 const accept=saved=>{dirty.current=false;attempt.current=null;setUncertain(false);setError('');apply(saved);setNotice(saved.vendor_status==='approved'?'Approved to sell.':'Application saved.');};
 const submit=async event=>{event.preventDefault();if(lock.current||!data)return;
  if(!attempt.current){const name=form.business_name.trim(),description=form.description.trim();if(name.length<2||name.length>100||description.length<10||description.length>3000){setError('Enter a name and at least 10 characters about what you would like to sell.');return;}try{attempt.current={client_id:createClientId(),business_name:name,description,expected_user_id:user.id};}catch{setError('Open AfriPlate in an updated browser and retry.');return;}}
  const pending=attempt.current;lock.current=true;setBusy(true);setError('');setNotice('');const abort=new AbortController();controller.current=abort;
  try{
   if(uncertain){const saved=await read(abort.signal);if(!active.current)return;if(confirmed(saved,pending)){accept(saved);return;}if(saved.application?.status==='pending'){apply(saved);setError('An application is already under review. Refresh before changing it.');return;}}
   const result=await api.post('/auth/vendor-application',pending,{signal:abort.signal});if(!active.current)return;
   if(result.data.account_id!==user.id||!result.data.application)throw Error('Unconfirmed application');accept(result.data);
  }catch(problem){
   if(!active.current)return;
   if(!problem.response||problem.response.status>=500){setUncertain(true);try{const saved=await read(abort.signal);if(!active.current)return;if(confirmed(saved,pending)){accept(saved);return;}}catch{}if(active.current)setError('Could not confirm the application. Check saved status before retrying.');}
   else{attempt.current=null;setUncertain(false);setError(problem.response.status===401?'Your session expired. Sign in again.':problem.response.data?.message||'Could not save the application. Retry.');}
  }finally{lock.current=false;if(active.current)setBusy(false);}
 };
 const change=(field,value)=>{if(lock.current||uncertain)return;dirty.current=true;attempt.current=null;setForm(p=>({...p,[field]:value}));setError('');setNotice('');};
 const state=data?.vendor_status,application=data?.application;
 return <section className="student-card vendor-application"><div className="student-heading"><h1>Apply to sell on AfriPlate</h1><button type="button" className="student-secondary" disabled={busy||loading} onClick={reload}>Refresh status</button></div>
 {loading&&!data?<p role="status">Loading your application...</p>:data&&<><p className="student-status" role="status">{labels[state]||'Status unavailable'}</p>{application?.review_reason&&<p className="student-notice">{application.review_reason}</p>}
 {state==='approved'?<><p>You can now list products and services.</p><button className="student-primary" disabled={busy} onClick={async()=>{await refreshSession();if(active.current)window.location.href='/dashboard#sell-product';}}>Open seller dashboard</button></>:state==='pending'?<><h2>{application?.business_name}</h2><p className="vendor-description">{application?.description}</p><p className="student-help">Submitted {application?.created_at?new Date(application.created_at).toLocaleString():'Date unavailable'}</p></>:<form onSubmit={submit}><p className="student-help">Only you and authorised AfriPlate staff can see this application.</p><fieldset className="student-fields" disabled={busy||loading||uncertain}><label htmlFor="vendor-name">Business or trading name</label><input id="vendor-name" value={form.business_name} maxLength={100} required onChange={e=>change('business_name',e.target.value)}/><label htmlFor="vendor-description">What would you like to sell?</label><textarea id="vendor-description" rows={5} value={form.description} minLength={10} maxLength={3000} required onChange={e=>change('description',e.target.value)}/></fieldset><button className="student-primary" disabled={busy||loading}>{busy?'Saving...':uncertain?'Check and retry':state==='declined'?'Apply again':'Submit application'}</button></form>}
 {application?.reviewed_at&&<p className="student-help">Decision {new Date(application.reviewed_at).toLocaleString()}</p>}</>}
 {error&&<p role="alert" className="student-error">{error} {!data&&<button className="student-secondary" disabled={loading} onClick={reload}>Retry</button>}</p>}{notice&&<p role="status">{notice}</p>}
 </section>;
}
