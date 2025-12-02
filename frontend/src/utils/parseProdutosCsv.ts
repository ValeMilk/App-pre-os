import Papa from 'papaparse'

export type Produto = {
  id: string
  codigo_produto: string
  nome_produto: string
  maximo?: string
  minimo?: string
  promocional?: string
}

export function parseProdutosCsv(text: string): Produto[] {
  // Nova estrutura: CODIGO PRODUTO; ID LIVRE; PRODUTO; MAXIMO; MINIMO; PROMOCIONAL
  const res = Papa.parse<string[]>(text, { delimiter: ';' })
  const rows: any[] = res.data as any[]
  const parsed = rows
    .map(r => r.filter((c: any) => c !== undefined && String(c).trim() !== ''))
    .filter(r => r.length >= 3)
    .map(r => ({
      id: String(r[0]).trim(),
      codigo_produto: String(r[1]).trim(),
      nome_produto: String(r[2]).trim(),
      maximo: r[3] ? String(r[3]).trim() : undefined,
      minimo: r[4] ? String(r[4]).trim() : undefined,
      promocional: r[5] ? String(r[5]).trim() : undefined
    }))
  return parsed
}
