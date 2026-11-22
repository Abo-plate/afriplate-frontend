"use client";
import Link from 'next/link';
import {useSession} from '../app/lib/SessionProvider';
import {sellingAccess,canUseSellerTools} from '../app/lib/sellingAccess';
import './student-identity.css';
export default function SellerNextStep(){
 const {user,status,refresh}=useSession(),access=sellingAccess(user);
 if(status!=='authenticated')return null;
 const student=user.student_membership==='student',ready=canUseSellerTools(user);
 return <section className="student-card"><div className="student-heading"><h2>Selling on AfriPlate</h2><button type="button" className="student-secondary" onClick={refresh}>Refresh status</button></div><p className="student-status" role="status">{!access?'Selling access unavailable':access.allowed&&!ready?'Open your account settings to start selling.':access.message}</p>{access?.reason&&<p className="student-notice">{access.reason}</p>}<div className="student-review-actions">{ready?<><a className="student-primary" href="/dashboard#sell-product">List a product</a><a className="student-secondary" href="/dashboard#sell-service">List a service</a></>:<Link className="student-secondary" href={student||access?.allowed?'/dashboard#settings':'/sell'}>{student?(access?.next_step==='student_submit'?'Submit your student ID':access?.next_step==='student_replacement'?'Upload a replacement':'View review status'):access?.allowed?'Settings':'View seller application'}</Link>}{user.role==='admin'&&<Link className="student-secondary" href="/admin">Admin</Link>}</div></section>;
}
