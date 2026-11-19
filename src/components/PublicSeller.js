"use client";
import {useState} from 'react';
import Link from 'next/link';
import './public-seller.css';
export function PublicAvatar({name='',src='',size=36}) {
 const [failed,setFailed]=useState('');
 const initials=name.trim().split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase()||'?';
 let url='';try{const parsed=new URL(src);if(parsed.protocol==='https:'&&!parsed.username&&!parsed.password)url=parsed.href;}catch{}
 return <span className="public-avatar" style={{width:size,height:size,fontSize:Math.max(11,size*.34)}}>{url&&failed!==url?<img src={url} alt="" loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(url)}/>:initials}</span>;
}
export default function PublicSeller({seller,compact=false}) {
 const content=<><PublicAvatar name={seller.name} src={seller.avatar} size={compact?32:40}/><span className="public-seller-copy"><strong>{seller.name}</strong><small>{seller.campus||'Campus not provided'}</small></span></>;
 return seller.id?<Link href={'/sellers/'+seller.id} className={'public-seller '+(compact?'compact':'')} aria-label={'View '+seller.name+' profile'}>{content}</Link>:<span className="public-seller">{content}</span>;
}
export function ServiceRating({count,average}) {const n=Number(count),rating=Number(average);return Number.isSafeInteger(n)&&n>0&&Number.isFinite(rating)&&rating>=1&&rating<=5?<span className="public-service-rating" aria-label={rating.toFixed(1)+' out of 5 from '+n+' purchase reviews'}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/></svg>{rating.toFixed(1)} <span>({n} {n===1?'review':'reviews'})</span></span>:null;}
