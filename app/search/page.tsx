export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import SearchResults from './search-results'

export const metadata = {
  title: 'Search - Kulture',
  description: 'Search for users, kultures, and takes on Kulture',
}

export default function SearchPage() {
  return (
    <div className="container max-w-7xl py-6">
      <SearchResults />
    </div>
  )
} 