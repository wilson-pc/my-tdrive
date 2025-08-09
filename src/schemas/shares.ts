import { createId } from '@paralleldrive/cuid2'
import { relations, sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { users } from './users'
import { files } from './files'

export const shares = sqliteTable('shares', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  ownerId: integer('ownerId'),
  fileId: text('fileId'),
  expirationDate: integer('expirationDate', { mode: 'timestamp_ms' }),
  users: text('users', { mode: 'json' }).$type<string[]>().default([]),
  createdAt: integer('createdAt', { mode: 'timestamp_ms' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp_ms' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
})

export const shareRelations = relations(shares, ({ one }) => ({
  owner: one(users, {
    fields: [shares.ownerId],
    references: [users.externalId]
  }),
  file: one(files, {
    fields: [shares.fileId],
    references: [files.id]
  })
}))

export type Share = typeof shares.$inferSelect
