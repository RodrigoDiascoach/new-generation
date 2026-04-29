-- Caminho profissional do participante (sucessor / apoiante / independente / explorando)
-- e respostas específicas do caminho no H4.
-- Aditivo — seguro de correr múltiplas vezes.

ALTER TABLE workshop_participants
  ADD COLUMN IF NOT EXISTS caminho TEXT;

ALTER TABLE h4_plano_acao
  ADD COLUMN IF NOT EXISTS respostas_caminho JSONB NOT NULL DEFAULT '[]'::jsonb;
