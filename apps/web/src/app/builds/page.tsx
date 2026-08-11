import { createClient } from '@/lib/supabase/server'
import BuildsClientView from './BuildsClientView'

export default async function BuildsPage() {
  const supabase = await createClient()
  
  // Fetch initial top builds
  const { data: topBuilds, error } = await supabase
    .from('top_builds')
    .select('*')
    .order('rank', { ascending: true })

  return <BuildsClientView initialBuilds={topBuilds || []} />
}
