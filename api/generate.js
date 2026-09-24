export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { productInfo } = req.body;

  if (!productInfo || productInfo.trim().length < 5) {
    return res.status(400).json({ error: 'Merci de décrire le produit.' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 700,
        messages: [
          {
            role: 'user',
            content: `Tu es un rédacteur e-commerce expert. À partir des caractéristiques brutes suivantes, génère une fiche produit prête à publier.

Caractéristiques du produit :
${productInfo}

Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ni après, au format exact :
{"titre": "...", "description": "...", "motscles": ["...", "...", "..."]}

Le titre doit faire moins de 70 caractères, optimisé SEO. La description doit faire 3 à 5 phrases, vendeuse et naturelle. Les mots-clés : entre 5 et 8, pertinents pour la recherche.`
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      return res.status(500).json({ error: "Erreur lors de la génération." });
    }

    const text = data.content?.[0]?.text || '';
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
}
