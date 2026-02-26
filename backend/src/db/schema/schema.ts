import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const speeches = pgTable('speeches', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  speechType: text('speech_type').notNull(),
  groomName: text('groom_name'),
  brideName: text('bride_name'),
  relationship: text('relationship'),
  keyMemories: text('key_memories'),
  tone: text('tone'),
  duration: text('duration'),
  generatedSpeech: text('generated_speech').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
