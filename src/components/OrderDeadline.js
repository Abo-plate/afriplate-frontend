"use client";
import {useEffect,useState} from 'react';
import './order-deadline.css';

const duration=value=>{
  const seconds=Math.max(0,Math.floor(Math.abs(value)/1000));
  const days=Math.floor(seconds/86400),hours=Math.floor(seconds%86400/3600),minutes=Math.floor(seconds%3600/60);
  return (days?days+'d ':'')+String(hours).padStart(2,'0')+'h '+String(minutes).padStart(2,'0')+'m '+String(seconds%60).padStart(2,'0')+'s';
};
export default function OrderDeadline({order,clock}){
  const [tick,setTick]=useState(null);
  const running=order.payment_verified===true&&order.status==='processing'&&['in_progress','revision_requested'].includes(order.workspace_state);
  useEffect(()=>{
    if(!running){setTick(null);return;}
    const update=()=>setTick(performance.now());update();
    const timer=setInterval(update,1000);window.addEventListener('focus',update);document.addEventListener('visibilitychange',update);
    return()=>{clearInterval(timer);window.removeEventListener('focus',update);document.removeEventListener('visibilitychange',update);};
  },[running,order.id,order.workspace_deadline]);
  const deadline=order.workspace_deadline?Date.parse(order.workspace_deadline):NaN;
  const anchored=Number.isFinite(clock?.serverMs)&&Number.isFinite(clock?.receivedTick)&&tick!==null;
  const left=Number.isFinite(deadline)&&anchored?deadline-clock.serverMs-(tick-clock.receivedTick):null;
  const completed=order.status==='completed'||order.workspace_state==='accepted';
  const cancelled=['cancelled','refunded'].includes(order.status);
  const delivered=order.workspace_state==='delivered';
  let value='Not started',heading='Delivery time';
  if(completed)value='Completed';
  else if(cancelled)value='Order closed';
  else if(delivered)value='Delivery submitted';
  else if(!order.payment_verified||order.status!=='processing')value='Awaiting payment';
  else if(!running)value=order.workspace_state==='ready'?'Ready to start':order.workspace_state==='awaiting_requirements'?'Awaiting requirements':'Awaiting agreement';
  else if(!Number.isFinite(deadline))value='Deadline not set';
  else if(!Number.isFinite(clock?.serverMs))value='Countdown unavailable';
  else if(left===null)value='Updating timer...';
  else {heading=left<0?'Overdue by':'Time remaining';value=Math.abs(left)<1000?'Due now':duration(left);}
  const late=running&&left!==null&&left<0;
  return <section className={'order-deadline'+(late?' late':'')} aria-label="Delivery deadline"><div><p className="order-deadline-label">{heading}</p><p className="order-deadline-value" role="timer" aria-live="off">{value}</p></div><div className="order-deadline-date">{Number.isInteger(order.delivery_days)&&order.delivery_days>0&&<strong>{order.delivery_days}-day delivery</strong>}{Number.isFinite(deadline)?<><span>Agreed deadline</span><time dateTime={order.workspace_deadline}>{new Date(deadline).toLocaleString()}</time></>:<span>{Number.isInteger(order.delivery_days)&&order.delivery_days>0?'Starts when work begins':'Delivery time not recorded'}</span>}</div></section>;
}
