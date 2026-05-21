// fake-indexeddb polyfills the global indexedDB so Dexie can run under
// vitest's node environment. Importing this side-effect module installs the
// polyfill; every test file that touches the repository layer should import
// it first via `import './setup'`.
import 'fake-indexeddb/auto'

import { db } from '@/db'

// Wipe every table to give each test a clean DB without re-opening Dexie.
// Closing & reopening the database between tests would force migrations to
// re-run, which is slower and dilutes what we're testing.
export async function clearAllTables() {
  await db.transaction(
    'rw',
    db.tables,
    async () => {
      for (const table of db.tables) {
        await table.clear()
      }
    },
  )
}
