import { Desconto } from '../types/Desconto';

export function parseDescontosCsv(text: string): Desconto[] {
  const lines = text.split('\n').filter(l => l.trim());
  const descontos: Desconto[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(';');
    if (parts.length < 5) continue;

    const rede = parts[0].trim();
    const subrede = parts[1].trim();
    const codigo_produto = parts[2].trim();
    const nome_produto = parts[3].trim();
    const desconto = parts[4].trim();

    descontos.push({
      rede: rede === '-' ? undefined : rede,
      subrede: subrede === '-' ? undefined : subrede,
      codigo_produto,
      nome_produto,
      desconto
    });
  }

  return descontos;
}
