import { OpenAI } from 'openai';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { z } from 'zod';
import { Change } from './change-detector.service';

const SummarySchema = z.object({
  priority: z.enum(['low', 'medium', 'high']),
  summary: z.string(),
  action: z.string().optional(),
  urgent: z.boolean(),
});

type Summary = z.infer<typeof SummarySchema>;

export async function summarizeChangesWithOpenAI(changes: Change[]): Promise<Summary | null> {
  if (!config.openai.enabled) {
    logger.log('ℹ️  OpenAI disabled, skipping summary');
    return null;
  }

  if (changes.length === 0) {
    return null;
  }

  try {
    const client = new OpenAI({
      apiKey: config.openai.apiKey,
    });

    // SECURITY: Only send aggregated change summaries (entityName, entityType, details)
    // Never send: credentials, cookies, storageState, HTML, or any personal data
    const changesText = changes
      .map(c => `- [${c.type.toUpperCase()}] ${c.entityType}: ${c.entityName}${c.details ? ` (${c.details})` : ''}`)
      .join('\n');

    const prompt = `Analiza estos cambios detectados en el campus virtual y proporciona un resumen priorizado.

Cambios:
${changesText}

Responde en JSON con:
{
  "priority": "low|medium|high",
  "summary": "Resumen conciso en 1-2 líneas",
  "action": "Acción recomendada si aplica",
  "urgent": true|false
}

Sé breve. Considera urgentes: nuevas tareas con vencimiento próximo, cambios en evaluaciones, avisos del profesor.`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const summary = SummarySchema.parse(parsed);

    logger.success('✅ OpenAI summary generated');
    return summary;
  } catch (error) {
    logger.error('OpenAI summary failed', error);
    return null;
  }
}
