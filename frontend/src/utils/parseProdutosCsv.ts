import Papa from 'papaparse'
import { ProdutoSchema, type Produto } from '../schemas'

export type { Produto }

export function parseProdutosCsv(text: string): Produto[] {
  // Nova estrutura: CODIGO PRODUTO; ID LIVRE; PRODUTO; MAXIMO; MINIMO; PROMOCIONAL
  const res = Papa.parse<string[]>(text, { delimiter: ';' })
  const rows: any[] = res.data as any[]
  const parsed = rows
    .slice(1) // Pular a primeira linha (header)
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
  
  // Validar com Zod e filtrar inválidos
  const validated = parsed
    .map((produto, index) => {
      try {
        return ProdutoSchema.parse(produto)
      } catch (err) {
        console.warn(`Produto inválido na linha ${index + 1}:`, err)
        return null
      }
    })
    .filter((p): p is Produto => p !== null)
  
  return validated
}
