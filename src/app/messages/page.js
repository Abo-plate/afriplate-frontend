'use client';
import { Suspense } from 'react';
import PrivateMessages from '@/components/PrivateMessages';
export default function MessagesPage(){return <Suspense fallback={<p role="status">Loading messages...</p>}><PrivateMessages /></Suspense>;}
