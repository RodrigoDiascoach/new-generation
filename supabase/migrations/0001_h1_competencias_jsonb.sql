-- H1 Competências: passar de 8 colunas fixas para um array JSONB
-- Cada participante pode escolher 8 competências (sugeridas ou personalizadas).
-- Estrutura de cada item: { key, label, desc, custom: bool, score: 1-10 }

ALTER TABLE h1_competencias
  DROP COLUMN IF EXISTS vendas,
  DROP COLUMN IF EXISTS marketing_digital,
  DROP COLUMN IF EXISTS tecnologia_ia,
  DROP COLUMN IF EXISTS gestao_clientes,
  DROP COLUMN IF EXISTS comunicacao,
  DROP COLUMN IF EXISTS lideranca,
  DROP COLUMN IF EXISTS analise_dados,
  DROP COLUMN IF EXISTS conhecimento_seguros;

ALTER TABLE h1_competencias
  ADD COLUMN IF NOT EXISTS competencias JSONB NOT NULL DEFAULT '[]'::jsonb;
