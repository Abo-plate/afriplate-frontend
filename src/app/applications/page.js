"use client";
import {useCallback, useEffect, useRef, useState} from 'react';
import Link from 'next/link';
import api from '../lib/api';
import {useSession} from '../lib/SessionProvider';
import {useWorkflowCommand} from '../lib/useWorkflowCommand';
import {statusLabel} from '../lib/statusLabel';
import {Icon, MarketplaceHeader} from '@/components/Marketplace';
import {PortfolioReferences} from '@/components/JobApplicationsPanel';
import styles from './applications.module.css';

const tabs = ['sent', 'posted'];
const applicationStatus = {applied: 'Application sent', withdrawn: 'Withdrawn', rejected: 'Not selected', hired: 'Selected'};
const formatDate = value => {
  if (!value || !Number.isFinite(Date.parse(value))) return null;
  return new Date(value).toLocaleDateString('en-NG', {day: 'numeric', month: 'short', year: 'numeric'});
};
const postedStatus = job => job.is_filled === true ? 'Position filled' : job.is_active === false ? 'Closed'
  : job.deadline && Date.parse(job.deadline) <= Date.now() ? 'Deadline passed' : job.is_active === true ? 'Open' : 'Status unavailable';

export default function MyApplications() {
  const {status, refresh, user} = useSession();
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [tab, setTab] = useState('sent');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loadedUser, setLoadedUser] = useState(null);
  const {command, busy} = useWorkflowCommand();
  const version = useRef(0);

  const load = useCallback(async () => {
    if (status !== 'authenticated') return;
    const request = ++version.current;
    setLoading(true);
    try {
      const [sent, posted] = await Promise.all([
        api.get('/jobs/applications/mine'), api.get('/jobs/posted/mine'),
      ]);
      if (!Array.isArray(sent.data.applications) || !Array.isArray(posted.data.jobs)) throw Error('Invalid application response');
      if (request !== version.current) return;
      setLoadedUser(user.id);
      setApplications(sent.data.applications);
      setJobs(posted.data.jobs);
      setError('');
    } catch (problem) {
      if (request === version.current) setError(problem.response?.data?.message || 'Could not load your applications and jobs. Please retry.');
    } finally {
      if (request === version.current) setLoading(false);
    }
  }, [status, user?.id]);

  useEffect(() => {
    setApplications([]); setJobs([]); setLoadedUser(null); setNotice(''); setError('');
    load();
    return () => { version.current++; };
  }, [load]);
  useEffect(() => {
    const sync = () => setTab(window.location.hash === '#posted' ? 'posted' : 'sent');
    sync(); window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const selectTab = next => {
    setTab(next);
    window.history.replaceState(null, '', '#'+next);
  };
  const navigateTabs = event => {
    const next = event.key === 'ArrowRight' || event.key === 'ArrowLeft' ? tabs[1-tabs.indexOf(tab)]
      : event.key === 'Home' ? 'sent' : event.key === 'End' ? 'posted' : null;
    if (!next) return;
    event.preventDefault(); selectTab(next);
    document.getElementById('applications-'+next+'-tab')?.focus();
  };
  const withdraw = async application => {
    setError(''); setNotice('');
    try {
      await command('/jobs/'+application.job_id+'/applications/withdraw', {application_id: application.id});
      setNotice('Application withdrawn.');
      await load();
    } catch (problem) {
      setError(problem.response?.data?.message || problem.message || 'Withdrawal was not confirmed. Please retry.');
    }
  };
  const ready = status === 'authenticated' && loadedUser === user?.id && !loading && !error;
  const ownName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'You';

  return <div className={styles.page}>
    <MarketplaceHeader/>
    <main className={styles.container}>
      <header className={styles.pageHeader}>
        <div><p className={styles.eyebrow}>YOUR OPPORTUNITIES</p><h1>My applications</h1><p>Keep up with jobs you applied for and manage the jobs you posted.</p></div>
        {status === 'authenticated' && <button type="button" className={styles.button} disabled={loading || busy} onClick={load}>{loading ? 'Refreshing...' : 'Refresh'}</button>}
      </header>
      {status === 'checking' ? <p className={styles.feedback} role="status">Checking your account...</p>
        : status === 'guest' ? <div className={styles.feedback}><p>Log in to view your private applications and posted jobs.</p><Link className={styles.textLink} href="/login?next=%2Fapplications">Log in</Link></div>
        : status !== 'authenticated' ? <div className={styles.feedback} role="alert"><p>Your account is unavailable.</p><button className={styles.button} onClick={refresh}>Retry account</button></div>
        : <>
          <div className={styles.tabs} role="tablist" aria-label="Applications and jobs" onKeyDown={navigateTabs}>
            {tabs.map((key, index) => <button key={key} type="button" role="tab" id={'applications-'+key+'-tab'} aria-controls={'applications-'+key+'-panel'} aria-selected={tab === key} tabIndex={tab === key ? 0 : -1} onClick={() => selectTab(key)}>
              {index === 0 ? 'Applications sent' : 'Jobs posted'}{ready && <span className={styles.count}>{index === 0 ? applications.length : jobs.length}</span>}
            </button>)}
          </div>
          {notice && <p className={styles.notice} role="status">{notice}</p>}
          {error && <div className={styles.feedback} role="alert"><p>{error}</p><button className={styles.button} disabled={busy || loading} onClick={load}>Retry</button></div>}
          {loading && <p className={styles.feedback} role="status">Loading {tab === 'sent' ? 'your applications' : 'your posted jobs'}...</p>}
          <section className={styles.panel} role="tabpanel" id={'applications-'+tab+'-panel'} aria-labelledby={'applications-'+tab+'-tab'} tabIndex={0} aria-busy={loading}>
            {ready && (tab === 'sent' ? applications.length === 0
              ? <EmptyState icon="search" title="You haven’t applied for a job yet" description="Find an opportunity that matches your skills and send your first application." href="/jobs" action="Browse jobs"/>
              : <div className={styles.list}>{applications.map(application => {
                const sentDate = formatDate(application.created_at);
                return <article className={styles.card} key={application.id}>
                  <div className={styles.cardHeading}><div><h2><Link href={'/jobs/'+application.job_id}>{application.job_title}</Link></h2><p className={styles.meta}>{application.company || application.poster_name || 'Job poster #'+application.poster_id}{sentDate && <> <span aria-hidden="true">&middot;</span> Applied {sentDate}</>}</p></div><span className={styles.status} data-success={application.status === 'hired'}>{applicationStatus[application.status] || statusLabel(application.status)}</span></div>
                  <div className={styles.actions}>
                    <Link className={`${styles.button} ${styles.primary}`} href={application.order_id ? '/orders/'+application.order_id : '/jobs/'+application.job_id}>{application.order_id ? 'Open order workspace' : 'View job'}<Icon name="arrow"/></Link>
                    {application.status === 'applied' && <button className={styles.textButton} disabled={busy} onClick={() => withdraw(application)}>Withdraw application</button>}
                  </div>
                  <details className={styles.details}><summary>View your proposal and portfolio references</summary><p className={styles.proposal}>{application.proposal}</p><PortfolioReferences items={application.portfolio_snapshot}/></details>
                </article>;
              })}</div>
              : jobs.length === 0
                ? <EmptyState icon="work" title="You haven’t posted a job yet" description="Share what you need help with and find someone with the right skills." href="/jobs/create" action="Post a job"/>
                : <div className={styles.list}>{jobs.map(job => {
                  const postedDate = formatDate(job.created_at);
                  const count = Number.isSafeInteger(job.application_count) && job.application_count >= 0 ? job.application_count : null;
                  return <article className={styles.card} key={job.id}>
                    <div className={styles.cardHeading}><div><h2><Link href={'/jobs/'+job.id}>{job.title}</Link></h2><p className={styles.meta}>Posted by {ownName}{postedDate && <> <span aria-hidden="true">&middot;</span> {postedDate}</>}</p></div><span className={styles.status}>{postedStatus(job)}</span></div>
                    <div className={styles.cardFooter}>{count !== null && <p className={styles.applicationCount}>{count} application{count === 1 ? '' : 's'}</p>}<Link className={`${styles.button} ${styles.primary}`} href={'/jobs/'+job.id}>Review applications<Icon name="arrow"/></Link></div>
                  </article>;
                })}</div>)}
          </section>
        </>}
    </main>
  </div>;
}
function EmptyState({icon, title, description, href, action}) {
  return <div className={styles.empty}><span className={styles.emptyIcon}><Icon name={icon} width="26" height="26"/></span><h2>{title}</h2><p>{description}</p><Link className={`${styles.button} ${styles.primary}`} href={href}>{action}<Icon name="arrow"/></Link></div>;
}
