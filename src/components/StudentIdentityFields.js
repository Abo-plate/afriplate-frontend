"use client";
import {useEffect,useRef,useState} from 'react';
import {API_BASE} from '../app/lib/endpoints';
import './student-identity.css';
const alias=value=>String(value||'').trim().toLowerCase().replace(/[(),.]/g,'').replace(/\s+/g,' ');
export default function StudentIdentityFields({value,onChange,file,onFile,disabled=false}){
 const [universities,setUniversities]=useState([]),[catalogError,setCatalogError]=useState(''),[photoError,setPhotoError]=useState(''),[attempt,setAttempt]=useState(0),[loading,setLoading]=useState(true);
 const photoInput=useRef(null);
 useEffect(()=>{if(!file&&photoInput.current)photoInput.current.value='';},[file]);
 useEffect(()=>{let active=true;const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);setLoading(true);fetch(API_BASE+'/auth/student-universities',{signal:controller.signal}).then(async response=>{if(!response.ok)throw Error();const data=await response.json();if(!Array.isArray(data.universities))throw Error();if(active){setUniversities(data.universities);setCatalogError('');}}).catch(()=>{if(active)setCatalogError('University options could not load. Retry.');}).finally(()=>{clearTimeout(timer);if(active)setLoading(false);});return()=>{active=false;controller.abort();clearTimeout(timer);};},[attempt]);
 const matched=universities.find(u=>u.id===value.university_id)||universities.find(u=>[u.id,u.name,u.name.replace(/\s*\([^)]*\)/g,'')].some(name=>alias(name)===alias(value.university)));
 const selected=matched?.id||(value.university_id==='other'||value.university?'other':'');
 const choose=event=>{const university=universities.find(u=>u.id===event.target.value);onChange(university?{university_id:university.id,university:university.name}:{university_id:event.target.value,university:event.target.value==='other'?'Other':''});};
 const photo=event=>{
  const next=event.target.files?.[0];if(!next)return;
  let message='';if(next.size>5242880)message='Choose a photo of 5 MB or smaller.';else if(!next.size||!['image/jpeg','image/png'].includes(next.type))message='Choose a JPG or PNG student ID photo.';
  if(message){setPhotoError(message);onFile(null);event.target.value='';return;}
  setPhotoError('');onFile(next);
 };
 return <fieldset className="student-fields" disabled={disabled}><legend>Student identification</legend>
 <p className="student-help" id="student-id-privacy">Your matric number and ID photo are private. Only you and authorised AfriPlate administrators can view them for student verification.</p>
 <label htmlFor="student-university">University</label><select id="student-university" value={selected} onChange={choose} required disabled={loading||!!catalogError&&universities.length===0}><option value="">{loading?'Loading universities...':'Choose your university'}</option>{universities.map(u=><option value={u.id} key={u.id}>{u.name}</option>)}<option value="other">Other university</option></select>
 {selected==='other'&&<><label htmlFor="student-university-other">Full university name</label><input id="student-university-other" value={value.university==='Other'?'':value.university||''} maxLength={100} onChange={event=>onChange({university_id:'other',university:event.target.value})} required/></>}
 <label htmlFor="student-matric">Matric number</label><input id="student-matric" value={value.matric_number||''} maxLength={100} autoComplete="off" spellCheck={false} onChange={event=>onChange({matric_number:event.target.value})} required/><small>Enter it exactly as issued, including punctuation and leading zeros.</small>
 <label htmlFor="student-id-photo">Student ID photo</label><input ref={photoInput} id="student-id-photo" type="file" accept="image/jpeg,image/png" onChange={photo} required={!file} aria-describedby="student-id-privacy student-photo-help"/><small id="student-photo-help">JPG or PNG, up to 5 MB.{file&&' Selected: '+file.name}</small>
 {catalogError&&<p role="alert">{catalogError} <button type="button" onClick={()=>setAttempt(n=>n+1)}>Retry options</button></p>}{photoError&&<p role="alert">{photoError}</p>}
 </fieldset>;
}
