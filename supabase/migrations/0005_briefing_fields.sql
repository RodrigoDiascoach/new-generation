-- H4: campos extra para o briefing pessoal aos seniors
--   nao_disse — texto livre sobre o que o sucessor ainda não disse aos pais
--   nao_disse_partilhar — toggle de privacidade: aparece no briefing aos pais?
--   prazo_pronto — quando se sente pronto/a para o próximo passo

ALTER TABLE h4_plano_acao
  ADD COLUMN IF NOT EXISTS nao_disse TEXT,
  ADD COLUMN IF NOT EXISTS nao_disse_partilhar BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS prazo_pronto TEXT;
