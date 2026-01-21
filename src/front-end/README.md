<!-- Badges -->
<div align="center">

![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4.1-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

![ESLint](https://img.shields.io/badge/ESLint-9.39-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=for-the-badge&logo=node.js&logoColor=white)

</div>

Dashboard di monitoraggio in tempo reale per arnie intelligenti con sensori IoT.

## 📊 Cosa monitoriamo

L'app fornisce un cruscotto per monitorare metriche ambientali e operative dell'alveare raccolte da sensori IoT (ad esempio temperatura, umidità, peso, suono).

Funzionalità tipiche:

- Visualizzazioni time-series per analisi storica
- Tabella dei rilevamenti recenti
- Soglie configurabili e notifiche (opzionale)

I dettagli esatti (tipi di sensori, intervalli, soglie) possono variare a seconda dell'installazione e dei dispositivi disponibili.

Aspetti pratici rilevanti per il monitoraggio:

- Cicli stagionali e variazioni di attività durante l'anno.
- Prodotti tipici dell'alveare (miele, polline, cera, propoli, pappa reale).
- Fenomeni operativi da considerare: perdita di risorse, saccheggio, sciamatura e invernamento.

## 🧰 Librerie

Le badge in alto mostrano le versioni principali; qui trovi le librerie secondarie e il loro scopo nel progetto:

- **shadcn/ui** — libreria di componenti pronta, basata su Radix (stili e pattern UI)
- **Recharts** — grafici e visualizzazioni time-series per i sensori
- **React Router** — navigazione e routing dell'applicazione
- **Lucide React** — icone vettoriali leggere per l'interfaccia

Suggerimenti:

- Se aggiungi integrazioni esterne, incapsula chiamate API in una cartella `src/services`.

## 🚀 Quick Start

```bash
# Installa le dipendenze
npm install

# Avvia il server di sviluppo
npm run dev

# Build per produzione
npm run build

# Preview build di produzione
npm run preview
```

---

<div align="center">
Made with 🐝 for beekeepers
</div>
