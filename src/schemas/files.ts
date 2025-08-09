import { createId } from '@paralleldrive/cuid2'
import { relations, sql } from 'drizzle-orm'
import { integer, numeric, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { users } from './users'
import { shares } from './shares'
export const files = sqliteTable('files', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text('name').notNull(), // nombre del archivo o carpeta
  isFolder: integer('delete', { mode: 'boolean' }).default(false), // true = carpeta, false = archivo
  parentId: text('parentId'), // carpeta contenedora
  mimeType: text('mimeType'), // null para carpetas
  size: numeric('size',{mode:"number"}), // tamaño en bytes como texto (o usa `bigint` si prefieres numérico)
  duration: numeric('duration',{mode:"number"}), // duración en segundos
  userId: integer('userId').references(() => users.externalId),
  chatId:text('chatId'),
  fileId:text('fileId'),
  messageId:text('messageId'),
  createdAt: integer('createdAt', { mode: 'timestamp_ms' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp_ms' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
})

export const pointsRelations = relations(files, ({ one,many }) => ({
  user: one(users, {
    fields: [files.userId],
    references: [users.externalId]
  }),
  shares: many(shares)
}))

export type Files = typeof files.$inferSelect
