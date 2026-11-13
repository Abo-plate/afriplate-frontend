import { redirect } from 'next/navigation';

export default async function UniversityPage({ params }) {
  const { name } = await params;
  redirect(`/products?university=${encodeURIComponent(name)}`);
}
