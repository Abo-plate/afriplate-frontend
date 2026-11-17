"use client";
import {useEffect, useRef, useState} from 'react';
import Link from 'next/link';
import {MarketplaceHeader, Icon} from '@/components/Marketplace';
import {useSession} from '../../lib/SessionProvider';
import {jobsAPI} from '../../lib/services';
import pageStyles from '../../applications/applications.module.css';
import styles from './job-create.module.css';

const categories = [['typing', 'Typing & admin'], ['design', 'Design'], ['coding', 'Coding & technology'], ['writing', 'Writing'], ['tutoring', 'Tutoring & Lessons'], ['photography', 'Photography'], ['other', 'Other']];
export default function CreateJob() {
  const {status, refresh, user} = useSession();
  const [form, setForm] = useState({title: '', description: '', budget: '', category: 'other', deadline: ''});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [uncertain, setUncertain] = useState(false);
  const [created, setCreated] = useState(null);
  const locked = useRef(false), actor = useRef(user?.id);
  actor.current = user?.id;
  useEffect(() => {
    setForm({title: '', description: '', budget: '', category: 'other', deadline: ''});
    setCreated(null); setError(''); setUncertain(false);
  }, [user?.id]);
  const update = event => setForm(current => ({...current, [event.target.name]: event.target.value}));
  const submit = async event => {
    event.preventDefault();
    if (locked.current || status !== 'authenticated' || created || uncertain) return;
    if (!/^\d{1,8}(\.\d{1,2})?$/.test(form.budget) || Number(form.budget) <= 0) {
      setError('Enter a positive budget with at most two decimal places.'); return;
    }
    if (form.deadline && (!Number.isFinite(Date.parse(form.deadline)) || Date.parse(form.deadline) <= Date.now())) {
      setError('Choose a future deadline.'); return;
    }
    const submittingUser = user.id;
    locked.current = true; setBusy(true); setError('');
    try {
      const {data} = await jobsAPI.create({...form, title: form.title.trim(), description: form.description.trim(), deadline: form.deadline ? new Date(form.deadline).toISOString() : null});
      if (submittingUser !== actor.current) return;
      if (!Number.isSafeInteger(data.job?.id) || data.job.id < 1) throw Error('Job creation was not confirmed');
      setCreated(data.job);
    } catch (problem) {
      if (submittingUser !== actor.current) return;
      const mayHaveSaved = !problem.response || problem.response.status >= 500;
      setUncertain(mayHaveSaved);
      setError(mayHaveSaved ? 'We could not confirm whether your job was posted. Check your posted jobs before trying again to avoid a duplicate.' : problem.response?.data?.message || 'Your job could not be posted. Your draft is retained.');
    } finally { locked.current = false; setBusy(false); }
  };
  return <div className={pageStyles.page}>
    <MarketplaceHeader/>
    <main className={`${pageStyles.container} ${styles.container}`}>
      <Link href="/applications#posted" className={styles.back}>Back to my jobs</Link>
      <header className={pageStyles.pageHeader}><div><p className={pageStyles.eyebrow}>FIND CAMPUS TALENT</p><h1>Post a job</h1><p>Describe the work, set your budget and let students apply.</p></div></header>
      {status === 'checking' ? <p role="status">Checking your account...</p>
        : status === 'guest' ? <div className={pageStyles.feedback}><p>Log in to post a job.</p><Link className={pageStyles.textLink} href="/login?next=%2Fjobs%2Fcreate">Log in</Link></div>
        : status !== 'authenticated' ? <div className={pageStyles.feedback} role="alert"><p>Your account is unavailable.</p><button className={pageStyles.button} onClick={refresh}>Retry account</button></div>
        : created ? <section className={styles.form} role="status"><span className={styles.successIcon}><Icon name="work"/></span><h2>Job posted</h2><p>{created.title}</p><div className={styles.actions}><Link className={`${pageStyles.button} ${pageStyles.primary}`} href={'/jobs/'+created.id}>View job</Link><Link className={pageStyles.button} href="/applications#posted">Manage applications</Link></div></section>
        : <form className={styles.form} onSubmit={submit}>
          <fieldset className={styles.fieldset} disabled={busy || uncertain}>
          <label>Job title<input name="title" required maxLength={100} value={form.title} onChange={update} placeholder="e.g. Tutor for first-year mathematics"/></label>
          <label>Description<textarea name="description" required maxLength={10000} rows={6} value={form.description} onChange={update} placeholder="Describe the work, expected outcome and any relevant experience or scheduling needs."/></label>
          <div className={styles.fields}><label>Budget (NGN)<input name="budget" type="number" inputMode="decimal" min="0.01" max="99999999.99" step="0.01" required value={form.budget} onChange={update}/></label><label>Category<select name="category" value={form.category} onChange={update}>{categories.map(([value, title]) => <option key={value} value={value}>{title}</option>)}</select></label></div>
          <label>Deadline <span className={styles.optional}>(optional, your local time)</span><input name="deadline" type="datetime-local" value={form.deadline} onChange={update}/></label>
          </fieldset>
          {error && <div className={styles.error} role="alert"><p>{error}</p>{uncertain && <><Link className={pageStyles.textLink} href="/applications#posted" target="_blank" rel="noopener noreferrer">Check my posted jobs (new tab)</Link><button type="button" className={pageStyles.button} onClick={() => {setUncertain(false);setError('');}}>I checked; allow another attempt</button></>}</div>}
          <div className={styles.actions}><button className={`${pageStyles.button} ${pageStyles.primary}`} disabled={busy || uncertain}>{busy ? 'Posting...' : 'Post job'}</button><Link className={pageStyles.button} href="/applications#posted">Cancel</Link></div>
        </form>}
    </main>
  </div>;
}
