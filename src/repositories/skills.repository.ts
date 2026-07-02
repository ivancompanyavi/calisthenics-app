import { db } from '@/db'

export const skillsRepository = {
  getAll: () => db.skills.orderBy('name').toArray(),
}
