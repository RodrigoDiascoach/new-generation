-- ============================================================
-- New Generation AGEBROKERS — Schema completo
-- Workshop 1 Maio 2026
-- ============================================================
-- Cria as 5 tabelas, indexes, e políticas de RLS públicas.
-- Inclui já as alterações das migrations 0001 (competências JSONB)
-- e 0002 (3 perguntas abertas). Idempotente — pode ser corrido
-- várias vezes sem partir nada (CREATE IF NOT EXISTS).

-- ------------------------------------------------------------
-- 1. PARTICIPANTES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workshop_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  entidade_nome TEXT,
  mediador_responsavel TEXT,
  relacao_parentesco TEXT,
  caminho TEXT,
  equipa_numero INT,
  h1_completo BOOLEAN NOT NULL DEFAULT false,
  h2_completo BOOLEAN NOT NULL DEFAULT false,
  h3_completo BOOLEAN NOT NULL DEFAULT false,
  h4_completo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 2. H1 — COMPETÊNCIAS + DIAGNÓSTICO
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS h1_competencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES workshop_participants(id) ON DELETE CASCADE,
  competencias JSONB NOT NULL DEFAULT '[]'::jsonb,
  olhar_geracional TEXT,
  experiencia_cliente TEXT,
  sucessao_emocional TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_h1_participant ON h1_competencias(participant_id);

-- ------------------------------------------------------------
-- 3. H2 — IDEIAS DE EQUIPA
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS h2_ideias_equipa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES workshop_participants(id) ON DELETE CASCADE,
  equipa_numero INT NOT NULL,
  ideia_titulo TEXT NOT NULL,
  ideia_descricao TEXT,
  categoria TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_h2_participant ON h2_ideias_equipa(participant_id);
CREATE INDEX IF NOT EXISTS idx_h2_equipa ON h2_ideias_equipa(equipa_numero);

-- ------------------------------------------------------------
-- 4. H3 — PITCH INDIVIDUAL (4 quadrantes)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS h3_pitch_individual (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES workshop_participants(id) ON DELETE CASCADE,
  valencias TEXT,
  o_que_gosto TEXT,
  o_que_nao_gosto TEXT,
  solucoes_propostas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_h3_participant ON h3_pitch_individual(participant_id);

-- ------------------------------------------------------------
-- 5. H4 — PLANO DE AÇÃO + FEEDBACK
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS h4_plano_acao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES workshop_participants(id) ON DELETE CASCADE,
  execucao_imediata TEXT,
  desenvolvimento_6m TEXT,
  compromisso_lideranca TEXT,
  respostas_caminho JSONB NOT NULL DEFAULT '[]'::jsonb,
  feedback_workshop TEXT,
  rating_workshop INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_h4_participant ON h4_plano_acao(participant_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- O workshop não tem autenticação dos participantes. A app usa
-- a anon key e a proteção do admin é feita no frontend (password).
-- Por isso, anon precisa de CRUD total nas 5 tabelas.
ALTER TABLE workshop_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE h1_competencias       ENABLE ROW LEVEL SECURITY;
ALTER TABLE h2_ideias_equipa      ENABLE ROW LEVEL SECURITY;
ALTER TABLE h3_pitch_individual   ENABLE ROW LEVEL SECURITY;
ALTER TABLE h4_plano_acao         ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon all on workshop_participants" ON workshop_participants;
DROP POLICY IF EXISTS "public all on workshop_participants" ON workshop_participants;
CREATE POLICY "public all on workshop_participants" ON workshop_participants
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon all on h1_competencias" ON h1_competencias;
DROP POLICY IF EXISTS "public all on h1_competencias" ON h1_competencias;
CREATE POLICY "public all on h1_competencias" ON h1_competencias
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon all on h2_ideias_equipa" ON h2_ideias_equipa;
DROP POLICY IF EXISTS "public all on h2_ideias_equipa" ON h2_ideias_equipa;
CREATE POLICY "public all on h2_ideias_equipa" ON h2_ideias_equipa
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon all on h3_pitch_individual" ON h3_pitch_individual;
DROP POLICY IF EXISTS "public all on h3_pitch_individual" ON h3_pitch_individual;
CREATE POLICY "public all on h3_pitch_individual" ON h3_pitch_individual
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon all on h4_plano_acao" ON h4_plano_acao;
DROP POLICY IF EXISTS "public all on h4_plano_acao" ON h4_plano_acao;
CREATE POLICY "public all on h4_plano_acao" ON h4_plano_acao
  FOR ALL USING (true) WITH CHECK (true);
