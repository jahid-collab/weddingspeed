import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import { gateway } from '@specific-dev/framework';
import { generateText } from 'ai';
import * as schema from '../db/schema/schema.js';
import type { App } from '../index.js';

interface GenerateSpeechBody {
  speechType: string;
  groomName: string;
  brideName: string;
  relationship: string;
  keyMemories: string;
  tone: string;
  duration: string;
}

interface GenerateSpeechResponse {
  speech: string;
  speechId: string;
}

interface GetSpeechsResponse {
  id: string;
  speechType: string;
  groomName?: string;
  brideName?: string;
  generatedSpeech: string;
  createdAt: string;
}

interface GetSingleSpeechResponse {
  id: string;
  speechType: string;
  groomName?: string;
  brideName?: string;
  relationship?: string;
  keyMemories?: string;
  tone?: string;
  duration?: string;
  generatedSpeech: string;
  createdAt: string;
}

interface DeleteSpeechResponse {
  success: boolean;
}

export function registerSpeechRoutes(app: App) {
  const requireAuth = app.requireAuth();
  const fastify = app.fastify as FastifyInstance;

  // Generate a wedding speech using AI
  fastify.post<{ Body: GenerateSpeechBody }>(
    '/api/speeches/generate',
    {
      schema: {
        description: 'Generate a personalized wedding speech using AI',
        tags: ['speeches'],
        body: {
          type: 'object',
          required: ['speechType', 'groomName', 'brideName', 'relationship', 'keyMemories', 'tone', 'duration'],
          properties: {
            speechType: { type: 'string', enum: ['best_man', 'maid_of_honor', 'groom', 'bride', 'parent', 'friend'] },
            groomName: { type: 'string' },
            brideName: { type: 'string' },
            relationship: { type: 'string' },
            keyMemories: { type: 'string' },
            tone: { type: 'string', enum: ['funny', 'heartfelt', 'formal', 'casual'] },
            duration: { type: 'string', enum: ['short', 'medium', 'long'] },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              speech: { type: 'string' },
              speechId: { type: 'string', format: 'uuid' },
            },
          },
          401: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
          500: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: GenerateSpeechBody }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { speechType, groomName, brideName, relationship, keyMemories, tone, duration } = request.body;

      app.logger.info(
        { userId: session.user.id, speechType, groomName, brideName },
        'Generating wedding speech'
      );

      const durationGuide = {
        short: '2-3 minutes (300-400 words)',
        medium: '4-5 minutes (600-800 words)',
        long: '6-8 minutes (1000-1200 words)',
      };

      const toneGuide = {
        funny: 'humorous and entertaining',
        heartfelt: 'emotional and sincere',
        formal: 'professional and eloquent',
        casual: 'conversational and relaxed',
      };

      const speechTypeGuide = {
        best_man: 'best man toast',
        maid_of_honor: 'maid of honor toast',
        groom: 'groom speech',
        bride: 'bride speech',
        parent: 'parent speech',
        friend: 'friend speech',
      };

      const prompt = `Write a ${speechTypeGuide[speechType as keyof typeof speechTypeGuide] || speechType} for a wedding.

Details:
- Groom's name: ${groomName}
- Bride's name: ${brideName}
- Speaker's relationship: ${relationship}
- Key memories and moments to include: ${keyMemories}
- Tone: ${toneGuide[tone as keyof typeof toneGuide] || tone}
- Length: ${durationGuide[duration as keyof typeof durationGuide] || duration}

Please create a personalized, engaging wedding speech that naturally incorporates the provided details and matches the requested tone and length. The speech should feel authentic, warm, and appropriate for a wedding celebration.`;

      try {
        app.logger.info({ userId: session.user.id, speechType }, 'Calling AI model');

        const { text: generatedSpeech } = await generateText({
          model: gateway('google/gemini-3-flash'),
          prompt,
        });

        app.logger.info({ userId: session.user.id, speechLength: generatedSpeech.length }, 'AI generation succeeded');
        app.logger.info({ userId: session.user.id, speechType }, 'Saving speech to database');

        const result = await app.db
          .insert(schema.speeches)
          .values({
            userId: session.user.id,
            speechType,
            groomName,
            brideName,
            relationship,
            keyMemories,
            tone,
            duration,
            generatedSpeech,
          })
          .returning();

        const createdSpeech = result[0];
        app.logger.info({ userId: session.user.id, speechId: createdSpeech.id }, 'Speech created successfully');

        await reply.send({
          speech: generatedSpeech,
          speechId: createdSpeech.id,
        });
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id, body: request.body }, 'Failed to generate speech');
        await reply.status(500).send({ error: 'Failed to generate wedding speech' });
      }
    }
  );

  // Get all speeches for the authenticated user
  fastify.get<{ Reply: GetSpeechsResponse[] }>(
    '/api/speeches',
    {
      schema: {
        description: "Get all wedding speeches for the authenticated user",
        tags: ['speeches'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                speechType: { type: 'string' },
                groomName: { type: 'string' },
                brideName: { type: 'string' },
                generatedSpeech: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
          },
          401: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, 'Fetching user speeches');

      try {
        const speeches = await app.db
          .select({
            id: schema.speeches.id,
            speechType: schema.speeches.speechType,
            groomName: schema.speeches.groomName,
            brideName: schema.speeches.brideName,
            generatedSpeech: schema.speeches.generatedSpeech,
            createdAt: schema.speeches.createdAt,
          })
          .from(schema.speeches)
          .where(eq(schema.speeches.userId, session.user.id));

        app.logger.info({ userId: session.user.id, count: speeches.length }, 'Speeches fetched successfully');

        const result = speeches.map((speech) => ({
          ...speech,
          createdAt: new Date(speech.createdAt).toISOString(),
        }));

        await reply.send(result);
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id }, 'Failed to fetch speeches');
        await reply.status(500).send({ error: 'Failed to fetch speeches' });
      }
    }
  );

  // Get a single speech by ID
  fastify.get<{ Params: { id: string } }>(
    '/api/speeches/:id',
    {
      schema: {
        description: 'Get a specific wedding speech by ID',
        tags: ['speeches'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              speechType: { type: 'string' },
              groomName: { type: 'string' },
              brideName: { type: 'string' },
              relationship: { type: 'string' },
              keyMemories: { type: 'string' },
              tone: { type: 'string' },
              duration: { type: 'string' },
              generatedSpeech: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
          401: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
          404: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params;

      app.logger.info({ userId: session.user.id, speechId: id }, 'Fetching single speech');

      try {
        const speech = await app.db.query.speeches.findFirst({
          where: eq(schema.speeches.id, id),
        });

        if (!speech) {
          app.logger.warn({ userId: session.user.id, speechId: id }, 'Speech not found');
          await reply.status(404).send({ error: 'Speech not found' });
          return;
        }

        if (speech.userId !== session.user.id) {
          app.logger.warn({ userId: session.user.id, speechId: id, ownerId: speech.userId }, 'Unauthorized access to speech');
          await reply.status(404).send({ error: 'Speech not found' });
          return;
        }

        app.logger.info({ userId: session.user.id, speechId: id }, 'Speech fetched successfully');

        const result: GetSingleSpeechResponse = {
          id: speech.id,
          speechType: speech.speechType,
          groomName: speech.groomName || undefined,
          brideName: speech.brideName || undefined,
          relationship: speech.relationship || undefined,
          keyMemories: speech.keyMemories || undefined,
          tone: speech.tone || undefined,
          duration: speech.duration || undefined,
          generatedSpeech: speech.generatedSpeech,
          createdAt: new Date(speech.createdAt).toISOString(),
        };

        await reply.send(result);
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id, speechId: id }, 'Failed to fetch speech');
        await reply.status(500).send({ error: 'Failed to fetch speech' });
      }
    }
  );

  // Delete a speech
  fastify.delete<{ Params: { id: string } }>(
    '/api/speeches/:id',
    {
      schema: {
        description: 'Delete a wedding speech (only if owned by authenticated user)',
        tags: ['speeches'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
            },
          },
          401: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
          404: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params;

      app.logger.info({ userId: session.user.id, speechId: id }, 'Deleting speech');

      try {
        const speech = await app.db.query.speeches.findFirst({
          where: eq(schema.speeches.id, id),
        });

        if (!speech) {
          app.logger.warn({ userId: session.user.id, speechId: id }, 'Speech not found for deletion');
          await reply.status(404).send({ error: 'Speech not found' });
          return;
        }

        if (speech.userId !== session.user.id) {
          app.logger.warn({ userId: session.user.id, speechId: id, ownerId: speech.userId }, 'Unauthorized delete attempt');
          await reply.status(404).send({ error: 'Speech not found' });
          return;
        }

        await app.db.delete(schema.speeches).where(eq(schema.speeches.id, id));

        app.logger.info({ userId: session.user.id, speechId: id }, 'Speech deleted successfully');

        await reply.send({ success: true });
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id, speechId: id }, 'Failed to delete speech');
        await reply.status(500).send({ error: 'Failed to delete speech' });
      }
    }
  );
}
