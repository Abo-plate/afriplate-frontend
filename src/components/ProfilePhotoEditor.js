"use client";
import {useState} from 'react';
import api from '../app/lib/api';
import {useSession} from '../app/lib/SessionProvider';
export default function ProfilePhotoEditor() {
 const {user,isAuthed,refresh}=useSession();
 const [busy,setBusy]=useState(false),[progress,setProgress]=useState(0),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const upload=async event=>{
  const file=event.target.files?.[0];event.target.value='';if(!file)return;
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5242880){setError('Choose a PNG, JPEG or WebP image up to 5 MB.');return;}
  setBusy(true);setProgress(0);setError('');setNotice('');
  try{const form=new FormData();form.append('file',file);const {data}=await api.post('/auth/profile-photo',form,{headers:{'Content-Type':undefined},timeout:45000,onUploadProgress:event=>setProgress(event.total?Math.round(event.loaded/event.total*100):0)});if(typeof data.avatar!=='string'||!data.avatar)throw Error();await refresh();setNotice('Profile photo saved.');}
  catch(e){setError(e.response?.data?.message||'Could not confirm your profile photo update. Refresh before retrying.');}finally{setBusy(false);}
 };
 const remove=async()=>{setBusy(true);setError('');setNotice('');try{await api.delete('/auth/profile-photo');await refresh();setNotice('Profile photo removed.');}catch(e){setError(e.response?.data?.message||'Could not remove your profile photo.');}finally{setBusy(false);}};
 if(!isAuthed)return null;
 return <section className="profile-photo" aria-label="Profile photo"><h3>Profile photo</h3>{user.avatar?<img src={user.avatar} alt="Your profile photo"/>:<p>No profile photo yet.</p>}<label>{busy?'Uploading...':'Choose a photo'}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={upload}/></label>{busy&&<p role="status">Upload progress: {progress}% <progress max="100" value={progress}/></p>}{user.avatar&&<button type="button" onClick={remove} disabled={busy}>Remove photo</button>}{error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}<style jsx>{`.profile-photo{margin:16px 0 24px;color:var(--ap-text-strong, #243b2c);font:14px/1.6 Inter,sans-serif}h3{font-size:16px;font-weight:700;margin-bottom:10px}img{display:block;width:80px;height:80px;border-radius:50%;object-fit:cover;margin-bottom:12px}label{display:block;font-weight:600}input{display:block;margin:8px 0;max-width:100%}button{padding:8px 12px;border:1px solid var(--ap-border, #bdd3c4);border-radius:8px;background:var(--ap-accent-surface, #edf8f0);color:var(--ap-accent-text, #176d35);cursor:pointer}button:disabled{opacity:.55}p{margin:8px 0;overflow-wrap:anywhere}progress{max-width:100%}`}</style></section>;
}
