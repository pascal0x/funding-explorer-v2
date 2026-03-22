# Funding Explorer V2 — CLAUDE.md

## What This App Does

Version 2 du Funding Rate Explorer — visualisation et comparaison des funding rates des marchés de futures perpétuels crypto, sur plusieurs exchanges CEX et DEX (Hyperliquid, Binance, Bybit, OKX, dYdX, Lighter, Asterdex).

Voir aussi : funding-explorer (V1) pour le contexte historique et la logique métier détaillée.

---

## Stack

- À définir au démarrage du projet (probablement Next.js 14 + TypeScript pour rester cohérent avec looping-dashboard)

Design system : @~/Documents/Claude/claude-config/DESIGN_SYSTEM_UNIVERSAL.md

---

## Référence V1

Le CLAUDE.md de funding-explorer (V1) contient :
- La liste complète des venues et leurs APIs
- La logique de calcul APR par venue
- Les catégories d'assets (Crypto / Stocks / FX / Commodities)
- Le symbol mapping par venue
- Les endpoints API (tous publics, pas de clé)

Lire @~/Documents/Claude/funding-explorer/CLAUDE.md avant de commencer.

---

## Améliorations prévues vs V1

- Architecture modulaire (pas monolithique dans un seul App.jsx)
- TypeScript strict
- Tests unitaires
- Meilleure gestion du cache et des erreurs API
