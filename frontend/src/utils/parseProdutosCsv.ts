import Papa from 'papaparse'

export type Produto = {
  id: string
  codigo_produto: string
  nome_produto: string
}

export function parseProdutosCsv(text: string): Produto[] {
  const res = Papa.parse<string[]>(text, { delimiter: ';' })
  const rows: any[] = res.data as any[]
  const parsed = rows
    .map(r => r.filter((c: any) => c !== undefined && String(c).trim() !== ''))
    .filter(r => r.length >= 3)
    .map(r => ({
      id: String(r[0]).trim(),
      codigo_produto: String(r[1]).trim(),
      nome_produto: String(r[2]).trim()
    }))
  return parsed
}
