/**
 * Vercel Serverless Function: Proxy seguro para OpenRouter AI.
 * Las llaves de API se leen desde variables de entorno (OPENROUTER_API_KEY).
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, cityId } = req.body || {};
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY || req.headers['x-openrouter-key'];

  const systemPrompt = `Eres "CombiRumbo Copilot", asistente experto en transporte público urbano para Chiclayo y Latinoamérica.
Responde ÚNICAMENTE en JSON con los campos:
{
  "conversationalAnswer": "Respuesta clara y cálida",
  "suggestedOriginStopId": "id-del-paradero-origen o null",
  "suggestedDestinationStopId": "id-del-paradero-destino o null",
  "detectedOriginName": "nombre origen o null",
  "detectedDestinationName": "nombre destino o null",
  "tips": ["Consejos prácticos"],
  "requiresClarification": false
}`;

  if (!apiKey) {
    return res.status(200).json({
      ok: true,
      conversationalAnswer: `Para viajar en ${cityId || 'Chiclayo'}, puedes buscar cualquier universidad, paradero o centro comercial en la barra superior.`,
      tips: [
        'Para ir a la USMP o USS toma la combi de Pimentel desde Bolognesi con Balta.',
        'El pasaje estándar verificado dentro del casco urbano es S/ 1.50 y a Pimentel S/ 2.50.'
      ]
    });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://combirumbo-chiclayo.vercel.app',
        'X-Title': 'CombiRumbo Chiclayo Transit Copilot',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query },
        ],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        return res.status(200).json({ ok: true, ...parsed });
      }
    }

    return res.status(200).json({
      ok: true,
      conversationalAnswer: 'Te recomendamos consultar las opciones recomendadas del catálogo verificado.',
      tips: ['Usa los botones de prueba rápida para simular rutas verificadas.']
    });
  } catch {
    return res.status(200).json({
      ok: true,
      conversationalAnswer: 'Te recomendamos consultar las opciones recomendadas del catálogo verificado.',
      tips: ['Usa los botones de prueba rápida para simular rutas verificadas.']
    });
  }
}
