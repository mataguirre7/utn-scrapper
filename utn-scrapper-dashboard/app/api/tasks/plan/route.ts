import { NextRequest, NextResponse } from 'next/server';

interface TaskInput {
  title: string;
  description?: string;
  type: string;
  dueDate: string;
  courseName: string;
  materials: Array<{ title: string; type: string }>;
}

export async function POST(req: NextRequest) {
  try {
    const tasks: TaskInput[] = await req.json();
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!openaiKey) {
      return NextResponse.json(
        { error: 'OpenAI not configured' },
        { status: 400 }
      );
    }

    const prompt = `Eres un asistente académico. Analiza estas tareas pendientes y crea un plan de acción claro y ejecutable.

TAREAS:
${tasks
  .map(
    (t, i) => `
${i + 1}. ${t.title} (${t.courseName})
   Tipo: ${t.type}
   Vence: ${new Date(t.dueDate).toLocaleDateString('es-AR')}
   ${t.description ? `Descripción: ${t.description}` : ''}
   Materiales disponibles: ${t.materials.map(m => m.title).join(', ') || 'Ninguno'}
`
  )
  .join('\n')}

Para CADA TAREA, proporciona:
1. Resumen ejecutivo (1 línea)
2. Pasos para completar (2-3 pasos numerados)
3. Tiempo estimado
4. Prioridad (URGENTE/ALTA/MEDIA/BAJA)

Luego, al final:
5. Plan diario sugerido (qué hacer hoy, mañana, etc.)
6. Ruta crítica (por dónde empezar para máxima eficiencia)

Formato JSON limpio, sin markdown.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const plan = data.choices[0]?.message?.content;

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Task planning error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
