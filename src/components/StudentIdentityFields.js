"use client";
import {useEffect,useState} from 'react';
import {API_BASE} from '../app/lib/endpoints';
import './student-identity.css';
export default function StudentIdentityFields({value,onChange,file,onFile,disabled=false}) {
 const [universities,setUniversities]=useState([]),[error,setError]=useState(''),[attempt,setAttempt]=useState(0),[loading,setLoading]=useState(true);
 useEffect(()=>{let active=true;setLoading(true);fetch(API_BASE+'/auth/student-universities').then(async r=>{if(!r.ok)throw Error();const d=await r.json();if(!Array.isArray(d.universities))throw Error();if(active){setUniversities(d.universities);setError('');}}).catch(()=>{if(active)setError('University options could not load. Please retry.');}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[attempt]);
 const matched=universities.find(u=>u.id===value.university_id||u.name===value.university);
 const selected=matched?.id||(value.university_id==='other'||value.university?'other':'');
 const choose=e=>{const u=universities.find(x=>x.id===e.target.value);onChange(u?{university_id:u.id,university:u.name}:{university_id:e.target.value,university:e.target.value==='other'?'Other':''});};
 const photo=e=>{const f=e.target.files?.[0];if(f&&(!['image/jpeg','image/png'].includes(f.type)||f.size>5242880||!f.size)){setError('Choose a JPEG or PNG photo up to 5 MB.');onFile(null);e.target.value='';return;}setError('');onFile(f||null)};
 return <fieldset className="student-fields" disabled={disabled}><legend>Student identification</legend>
 <p className="student-help" id="student-id-privacy">Your matric number and ID photo are private. Only you and authorised AfriPlate administrators can access them to review your student status. They are not shown on listings or your public profile.</p>
 <label htmlFor="student-university">University</label><select id="student-university" value={selected} onChange={choose} required disabled={loading||!!error&&universities.length===0}><option value="">{loading?'Loading universities...':'Choose your university'}</option>{universities.map(u=><option value={u.id} key={u.id}>{u.name}</option>)}<option value="other">Other university</option></select>
 {selected==='other'&&<><label htmlFor="student-university-other">Full university name</label><input id="student-university-other" value={value.university==='Other'?'':value.university||''} maxLength={100} onChange={e=>onChange({university_id:'other',university:e.target.value})} required/></>}
 <label htmlFor="student-matric">Matric number</label><input id="student-matric" value={value.matric_number||''} maxLength={100} autoComplete="off" spellCheck={false} onChange={e=>onChange({matric_number:e.target.value})} required/><small>Include letters, punctuation and leading zeros exactly as issued. Letter case and spacing do not create a different identity.</small>
 <label htmlFor="student-id-photo">Student ID photo</label><input id="student-id-photo" type="file" accept="image/jpeg,image/png" onChange={photo} required aria-describedby="student-id-privacy student-photo-help"/><small id="student-photo-help">One clear JPEG or PNG photo, up to 5 MB. {file&&'Selected: '+file.name}</small>
 {error&&<p role="alert">{error} {!universities.length&&<button type="button" onClick={()=>setAttempt(x=>x+1)}>Retry options</button>}</p>}
 </fieldset>
}
