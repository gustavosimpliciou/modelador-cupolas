# Nativos Studio Pro — PRD

## Sessions Completed
- Setup do repositório enviado (meu-site.zip) + preview rodando
- Correção do export: dimensões respeitadas + fundo mesclado com cúpula
- Padrão de "Diâm. Superior" alterado para 200mm
- i18n (pt/en/es) com seletor no navbar + bloqueio mobile (< 900px)

## Architecture
- Frontend puro: React 18 + Vite + Three.js + zustand
- Estado i18n persistido em localStorage (`nativos.language`)

## Implemented (2026-01-11)
- `i18n/translations.js` — dicionários pt/en/es
- `i18n/useT.js` — hook `useT()` (fallback pt se chave faltar)
- `store/useStore.js` — `language` + `setLanguage` (persiste em localStorage)
- Navbar com seletor PT/EN/ES + menus traduzidos
- LeftPanel/RightPanel/Footer/Splash traduzidos nos strings principais
- `components/MobileBlock.jsx` — tela travada em `< 900px`, mostra logo + barra de loading estática + mensagem "abra em desktop ou tablet" + seletor de idiomas próprio
- `App.jsx` — verifica `useIsMobile()` ANTES do splash; se mobile, renderiza `MobileBlock`

## Validated
- Screenshots capturadas em PT/EN/ES no desktop (labels mudam ao vivo)
- Screenshots capturadas em PT/EN/ES no viewport 390×844 (bloqueio ativo)

## Backlog
- P2: expandir tradução aos parâmetros técnicos (mesh params labels, cores da paleta, etc)
- P2: adicionar mais idiomas
