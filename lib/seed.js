import { kv } from './kv';

// Dati dimostrativi. Codici fiscali fittizi (non appartengono a persone
// reali) usati solo per popolare il database al primo avvio.
export async function ensureSeed() {
  const seeded = await kv.get('meta:seeded');
  if (seeded) return;

  await kv.set('user:RSSMRA93A01H501U', {
    codiceFiscale: 'RSSMRA93A01H501U',
    nome: 'Mario',
    cognome: 'Rossi',
    dataNascita: '1993-01-01'
  });

  await kv.set('user:BNCSFO93E55F205T', {
    codiceFiscale: 'BNCSFO93E55F205T',
    nome: 'Sofia',
    cognome: 'Bianchi',
    dataNascita: '1993-05-15'
  });

  await kv.set('test:PROVA', {
    code: 'PROVA',
    title: 'Test di prova',
    validityMonths: 24,
    passMark: 80,
    questions: [
      {
        text: 'Quando è stato creato questo test?',
        options: ['Gennaio 2026', 'Agosto 2026', 'Dicembre 2025', 'Marzo 2026'],
        correct: 1,
        explanation: 'Il test è stato configurato nel mese corrente, Agosto 2026.'
      },
      {
        text: 'Quante domande ha questo test di prova?',
        options: ['Due', 'Molte', 'Tre', 'Cinque'],
        correct: 2,
        explanation: 'Il test di prova contiene esattamente tre domande.'
      },
      {
        text: 'Quanti giorni ha il mese di Ottobre?',
        options: ['30', '31', '28', '29'],
        correct: 1,
        explanation: 'Ottobre è tra i mesi con 31 giorni, insieme a gennaio, marzo, maggio, luglio, agosto e dicembre.'
      }
    ],
    createdAt: new Date().toISOString()
  });

  await kv.set('meta:seeded', true);
}
