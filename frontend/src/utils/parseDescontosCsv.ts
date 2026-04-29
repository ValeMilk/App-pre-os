import { DescontoSchema, type Desconto } from '../schemas';

export function parseDescontosCsv(text: string): Desconto[] {
  const lines = text.split('\n').filter(l => l.trim());
  const descontos: Desconto[] = [];

  for (let i = 1; i < lines.length; i++) { // Começar em 1 para pular o header
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(';');
    if (parts.length < 5) continue;

    const rede = parts[0].trim();
    const subrede = parts[1].trim();
    const codigo_produto = parts[2].trim();
    const nome_produto = parts[3].trim();
    const desconto = parts[4].trim();

    const descontoObj = {
      rede: rede === '-' ? undefined : rede,
      subrede: subrede === '-' ? undefined : subrede,
      codigo_produto,
      nome_produto,
      desconto
    };

    // Validar com Zod
    try {
      const validated = DescontoSchema.parse(descontoObj);
      descontos.push(validated);
    } catch (err) {
      console.warn(`Desconto inválido na linha ${i + 1}:`, err);
    }
  }

  return descontos;
}
