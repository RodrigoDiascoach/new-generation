-- Fix: políticas RLS com "TO anon" não aplicam com as novas API keys
-- (sb_publishable_*). Recriar sem restrição de role (PUBLIC = todos).

DROP POLICY IF EXISTS "anon all on workshop_participants" ON workshop_participants;
DROP POLICY IF EXISTS "anon all on h1_competencias" ON h1_competencias;
DROP POLICY IF EXISTS "anon all on h2_ideias_equipa" ON h2_ideias_equipa;
DROP POLICY IF EXISTS "anon all on h3_pitch_individual" ON h3_pitch_individual;
DROP POLICY IF EXISTS "anon all on h4_plano_acao" ON h4_plano_acao;

CREATE POLICY "public all on workshop_participants" ON workshop_participants
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public all on h1_competencias" ON h1_competencias
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public all on h2_ideias_equipa" ON h2_ideias_equipa
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public all on h3_pitch_individual" ON h3_pitch_individual
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public all on h4_plano_acao" ON h4_plano_acao
  FOR ALL USING (true) WITH CHECK (true);
