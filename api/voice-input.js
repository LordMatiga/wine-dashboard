const GROQ_API_KEY = process.env.GROQ_API_KEY
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SERVICE_ROLE_KEY

const SUPABASE_HEADERS = {
  'Content-Type': 'application/json',
  apikey: SUPABASE_SERVICE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
  Prefer: 'return=representation',
}

async function transcribeAudio(audioBase64, mimeType) {
  const audioBuffer = Buffer.from(audioBase64, 'base64')
  const ext = mimeType?.includes('webm') ? 'webm' : mimeType?.includes('ogg') ? 'ogg' : 'm4a'

  const form = new FormData()
  form.append('file', new Blob([audioBuffer], { type: mimeType }), `recording.${ext}`)
  form.append('model', 'whisper-large-v3')
  form.append('language', 'fr')

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
    body: form,
  })
  const data = await res.json()
  if (!data.text) throw new Error(`Transcription failed: ${JSON.stringify(data)}`)
  return data.text
}

async function splitIntents(text) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `Tu analyses un message professionnel pour détecter s'il contient plusieurs demandes distinctes et indépendantes.
Une demande distincte = une action qui peut être traitée séparément (passer une commande, préparer une fiche client, signaler un problème logistique, envoyer une facture, etc.).
Si le message contient UNE SEULE demande : {"segments":["<texte complet>"]}
Si le message contient PLUSIEURS demandes distinctes, découpe en segments autonomes (chaque segment doit être compréhensible seul) : {"segments":["demande 1 avec contexte","demande 2 avec contexte"]}
Réponds uniquement en JSON PUR.`,
        },
        { role: 'user', content: text },
      ],
      response_format: { type: 'json_object' },
    }),
  })
  const data = await res.json()
  try {
    const parsed = JSON.parse(data.choices[0].message.content)
    return Array.isArray(parsed.segments) && parsed.segments.length > 0 ? parsed.segments : [text]
  } catch {
    return [text]
  }
}

async function categorize(text) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `### MISSION
Tu es un agent d'extraction de données logistiques pour Grün Falcot & Co, agence de courtage en vins.
Tu analyses un message et tu dois identifier la NATURE de la demande, extraire les informations pertinentes et retourner un JSON structuré.
Réponds uniquement en JSON PUR, sans réflexion, sans markdown.

### PERSONNES À IGNORER (NE JAMAIS EXTRAIRE comme client ou fournisseur) :
- Steve, Axel, Axelle (ce sont les opérateurs)

### RÉFÉRENTIEL FOURNISSEURS — utilise UNIQUEMENT ces noms exacts (correction phonétique obligatoire) :
ALPHONSE MELLOT, BONSERINE, BRUMONT ALAIN, CAZES, CHATEAU DE LA GREFFIERE, COULY DUTHEIL, COURBIS DOMAINE, DE LADOUCETTE, DESCAVES, DEVILLARD, DUBOST, GEORGES VERNAY, HAUTS CHASSIS DOMAINE, JAUME ALAIN, LAFAGE DOMAINE, LEDA - MAISON LEDA, LES ENTREFAUX, LORON, LOUIS LATOUR, LOUIS MOREAU, MAGNIEN FREDERIC MAISON, MAGNIEN MICHEL DOMAINE, MARGÜI VINEYARDS, MAS DE DAUMAS GASSAC, OPCO COMMERCE, PIERRE CHAVIN, RAFFIN VINI, REGNARD, ROLET DOMAINE, SAINT COSME, SAS G3F, SCHLUMBERGER DOMAINES, SIMONNET-FEBVRE, SNC ROEDERER DISTRIBUTION, SPIRIBAM, VINI BE GOOD, VINITERROIRS, VINS DU MONDE, VINUSTRALE
Exemples phonétiques : "5 come" / "cinq comme" / "sein caume" = SAINT COSME | "de villars" = DEVILLARD | "vernet" = GEORGES VERNAY
Si aucune correspondance possible : null

### TYPES DE DEMANDES :
1. commande : passer une commande chez un fournisseur pour un client. Mots-clés : "commande", "commander", "bouteilles", "caisses", "livraison pour"
2. fiche_client : fiche de préparation pour un rendez-vous. Mots-clés : "fiche", "prépare", "rendez-vous", "RDV", "dossier", "semaine"
3. logistique : problème livraison/transporteur/adresse/stock. Mots-clés : "pas reçu", "livraison", "livreur", "adresse", "problème", "retard"
4. compta : factures, avoirs, paiements. Mots-clés : "facture", "avoir", "paiement", "comptabilité", "envoie", "perdu"
5. tarif : demande d'envoi de tarif fournisseur. Mots-clés : "tarif", "prix", "pousse", "envoie le tarif"
6. autre : tout ce qui ne rentre dans aucune catégorie

### DÉTECTION URGENCE :
urgent = true si : "urgent", "urgence", "asap", "rapidement", "dès que possible", "priorité", "immédiatement"

### RÈGLES CLIENT :
- Retranscris le nom EXACTEMENT comme prononcé
- Inclus la localisation si mentionnée (ex: "à Dardilly", "Lyon 6")
- Met en MAJUSCULES
- Arrête la capture dès que tu entends des dates, quantités ou noms de cuvées
- IGNORE Steve, Axel, Axelle

### FORMAT DE SORTIE :
Pour commande :
{"type":"commande","urgent":false,"client":"NOM CLIENT","fournisseur":"NOM RÉFÉRENTIEL ou null","description":"résumé exhaustif et complet de la demande"}

Pour fiche_client, logistique, compta, autre :
{"type":"fiche_client","urgent":false,"client":"NOM CLIENT ou null","fournisseur":null,"description":"résumé exhaustif et complet"}

Pour tarif :
{"type":"tarif","urgent":false,"client":"NOM CLIENT ou null","fournisseur":"NOM RÉFÉRENTIEL ou null","description":"résumé exhaustif et complet"}`,
        },
        { role: 'user', content: text },
      ],
      response_format: { type: 'json_object' },
    }),
  })
  const data = await res.json()
  return JSON.parse(data.choices[0].message.content)
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const { text, audio, mimeType } = req.body

    const transcript = audio ? await transcribeAudio(audio, mimeType) : text
    if (!transcript?.trim()) {
      res.status(400).json({ error: 'Aucun contenu à traiter' })
      return
    }

    const segments = await splitIntents(transcript)
    const items = []

    for (const segment of segments) {
      const result = await categorize(segment)
      let createdId = null
      let createdTable = null

      if (result.type === 'commande') {
        const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
          method: 'POST',
          headers: SUPABASE_HEADERS,
          body: JSON.stringify({
            client_name: result.client ?? null,
            supplier_name: result.fournisseur ?? null,
            transcription: result.description ?? segment,
            raw_transcription: transcript,
            urgent: result.urgent ?? false,
            status: 'Entrante',
          }),
        })
        const ordersData = await insertRes.json()
        createdId = Array.isArray(ordersData) ? (ordersData[0]?.id ?? null) : null
        createdTable = 'orders'
        // notifications temporairement désactivées
        // fetch(`${SUPABASE_URL}/functions/v1/send-push`, { ... }).catch(() => {})
      } else {
        const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/tasks`, {
          method: 'POST',
          headers: SUPABASE_HEADERS,
          body: JSON.stringify({
            client_name: result.client ?? null,
            supplier_name: result.fournisseur ?? null,
            description: result.description ?? null,
            raw_transcription: transcript,
            type: result.type ?? 'autre',
            urgent: result.urgent ?? false,
            status: 'Entrante',
          }),
        })
        const tasksData = await insertRes.json()
        createdId = Array.isArray(tasksData) ? (tasksData[0]?.id ?? null) : null
        createdTable = 'tasks'
      }

      items.push({
        type: result.type,
        client: result.client ?? null,
        fournisseur: result.fournisseur ?? null,
        description: result.description ?? null,
        urgent: result.urgent ?? false,
        id: createdId,
        table: createdTable,
      })
    }

    res.status(200).json({ items, transcript })
  } catch (e) {
    console.error('voice-input error:', e)
    res.status(500).json({ error: e.message })
  }
}
