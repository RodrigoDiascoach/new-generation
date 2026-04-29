# New Generation AGEBROKERS · AGELegacy

Aplicação web para o workshop **New Generation AGEBROKERS** — Preparar a Transição, Garantir o Sucesso.

Desenhada para o evento de **1 de maio de 2026** com sucessores de mediadores de seguros Ageas.

---

## O que esta app faz

**Para os sucessores (público):**
- Registam dados pessoais (nome, contactos, entidade, parentesco)
- Navegam livremente pelos 4 módulos da jornada de 4 horas:
  - **H1** — Roda das Competências + Diagnóstico
  - **H2** — Brainstorming em equipa (4 equipas)
  - **H3** — Pitch individual (4 quadrantes: valências, gostos, barreiras, soluções)
  - **H4** — Plano de ação + Feedback do workshop

**Para o Rodrigo (admin):**
- Painel protegido por password em `/admin`
- Dashboard com KPIs em tempo real
- Gráfico radar das competências (média do grupo)
- Ideias agregadas por equipa
- Pitches individuais e planos de ação
- Export de todos os dados em JSON para o debriefing

---

## Stack técnica

- **React 18** + **Vite** (build rápido)
- **Tailwind CSS** com cores Alfa Academy + AGEBROKERS
- **React Router** para navegação
- **Supabase** (PostgreSQL) para persistência de dados
- **Recharts** para gráficos do dashboard
- **Lucide Icons**

---

## Setup local (no VSCode)

### 1. Clonar o repositório
```bash
git clone https://github.com/RodrigoDiascoach/New-Generation.git
cd New-Generation
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente
Copia o ficheiro `.env.example` para `.env`:
```bash
cp .env.example .env
```

O ficheiro `.env` já tem os valores corretos do Supabase. **Antes de fazer deploy público, muda a `VITE_ADMIN_PASSWORD`** para algo só teu.

### 4. Correr em modo desenvolvimento
```bash
npm run dev
```

Abre `http://localhost:5173`

### 5. Build para produção
```bash
npm run build
```

Os ficheiros vão para a pasta `dist/`.

---

## Acesso ao painel admin

URL: `https://teu-dominio.com/admin`

**Password padrão:** `AGELegacy2026`

> Muda esta password no ficheiro `.env` (variável `VITE_ADMIN_PASSWORD`) antes de fazer deploy.

---

## Estrutura da base de dados (Supabase)

5 tabelas no schema `public`:

| Tabela | Descrição |
|---|---|
| `workshop_participants` | Dados pessoais e progresso |
| `h1_competencias` | Auto-avaliação das 8 competências + diagnóstico |
| `h2_ideias_equipa` | Ideias do brainstorming (com equipa e categoria) |
| `h3_pitch_individual` | 4 quadrantes do pitch |
| `h4_plano_acao` | Plano de ação + feedback do workshop |

Todas com Row Level Security ativada e políticas públicas (workshop sem login).

---

## Deploy

### Opção 1: Vercel (recomendado, grátis)
1. Vai a [vercel.com](https://vercel.com)
2. "Import Project" → seleciona o repo `New-Generation`
3. Em **Environment Variables**, adiciona:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ADMIN_PASSWORD`
4. Deploy

### Opção 2: Netlify
1. Vai a [netlify.com](https://netlify.com)
2. "Add new site" → "Import an existing project"
3. Conecta ao GitHub e seleciona o repo
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Adiciona as Environment Variables (iguais ao Vercel)

---

## URLs do dia do workshop

- **Para os participantes:** partilha o URL principal (vão para a página de registo)
- **Para ti (Rodrigo):** `URL/admin` com a tua password

> Sugestão: cria um QR code do URL principal para os participantes lerem no telemóvel.

---

## Estrutura de pastas

```
src/
├── components/
│   ├── Layout.jsx          # Header + footer + brand bar
│   ├── Logo.jsx            # Logo AGEBROKERS / AGELegacy
│   └── ModuleHeader.jsx    # Header reutilizável dos módulos
├── lib/
│   ├── supabase.js         # Cliente Supabase
│   └── ParticipantContext.jsx  # Estado global do participante
├── pages/
│   ├── Onboarding.jsx      # Página de registo
│   ├── Journey.jsx         # Hub das 4 horas
│   ├── H1Identidade.jsx    # Roda das Competências
│   ├── H2Brainstorming.jsx # Brainstorming em equipa
│   ├── H3Pitch.jsx         # Pitch individual
│   ├── H4Acao.jsx          # Plano de ação
│   ├── AdminLogin.jsx      # Login admin
│   └── AdminDashboard.jsx  # Dashboard admin
├── App.jsx                 # Routing
└── main.jsx                # Entry point
```

---

## Cores da marca (referência)

| Cor | Hex | Uso |
|---|---|---|
| Navy | `#050A26` | Texto principal |
| Alfa Blue | `#1C3BD7` | CTA primária, links |
| Alfa Orange | `#F39237` | Acentos, segunda CTA |
| Off-white | `#E5ECE9` | Backgrounds suaves |

Tipografia: **Kanit** (display) + **Inter** (body)

---

## Workshop · 1 Maio 2026

Idealizado e produzido pelo **Rodrigo Dias** — Alfa Academy.
