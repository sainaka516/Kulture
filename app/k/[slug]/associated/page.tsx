import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import AssociatedKulturesClient from './associated-kultures-client'

interface AssociatedKulturesPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: AssociatedKulturesPageProps): Promise<Metadata> {
  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    select: {
      name: true,
    },
  })

  if (!community) return {}

  return {
    title: `Associated Kultures - ${community.name} - Kulture`,
    description: `Browse all associated kultures for ${community.name}`,
  }
}

export default async function AssociatedKulturesPage({ params }: AssociatedKulturesPageProps) {
  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    include: {
      children: {
        include: {
          _count: {
            select: {
              members: true,
              takes: true,
              children: true,
            },
          },
          members: true,
          takes: true,
          children: true,
        },
        orderBy: {
          name: 'asc',
        },
      },
    },
  })

  if (!community) {
    notFound()
  }

  return <AssociatedKulturesClient community={community} />
} 