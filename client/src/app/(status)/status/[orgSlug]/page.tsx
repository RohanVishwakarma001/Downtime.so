import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { StatusClient } from './StatusClient';

interface Props {
  params: { orgSlug: string };
}

async function fetchOrgStatus(orgSlug: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  try {
    const res = await fetch(`${API_URL}/api/v1/public/${orgSlug}/services`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await fetchOrgStatus(params.orgSlug);
  if (!data) return { title: 'Status Page Not Found' };

  return {
    title: `${data.org.name} Status`,
    description: `Live status page for ${data.org.name}. Check service status and incident updates.`,
  };
}

export default async function StatusPage({ params }: Props) {
  const data = await fetchOrgStatus(params.orgSlug);

  if (!data) {
    notFound();
  }

  return (
    <StatusClient
      initialOrg={data.org}
      initialServices={data.services}
      initialOverallStatus={data.overallStatus}
      orgSlug={params.orgSlug}
    />
  );
}
