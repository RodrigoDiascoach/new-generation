-- H1 Diagnóstico: substituir as 2 perguntas tácticas por 3 perguntas abertas
-- (olhar geracional, experiência do cliente, lado emocional da sucessão).
-- Não há dados reais ainda — drop + add é seguro.

ALTER TABLE h1_competencias
  DROP COLUMN IF EXISTS processos_melhoria,
  DROP COLUMN IF EXISTS oportunidades_inovacao;

ALTER TABLE h1_competencias
  ADD COLUMN IF NOT EXISTS olhar_geracional TEXT,
  ADD COLUMN IF NOT EXISTS experiencia_cliente TEXT,
  ADD COLUMN IF NOT EXISTS sucessao_emocional TEXT;
