import { createId } from '@paralleldrive/cuid2'
import { relations, sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { files } from './files'
import { shares } from './shares'

export const users = sqliteTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  externalId: integer('externalId').unique(),
  serverSession: text('serverSession'),
  createdAt: integer('createdAt', { mode: 'timestamp_ms' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp_ms' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
})

export const userRelations = relations(users, ({ many }) => ({
    files: many(files),
    shares: many(shares)
  }))

export type User = typeof users.$inferSelect
