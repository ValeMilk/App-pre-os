import Papa from 'papaparse'
import { ClienteSchema, ClientesArraySchema, type Cliente } from '../schemas'

export type { Cliente }

export function parseClientesCsv(text: string): Cliente[] {
  // Nova estrutura: REDE; SUBREDE; CODIGO CLIENTE; NOME CLIENTE; CODIGO VENDEDOR; NOME VENDEDOR; CODIGO SUPERVISOR; NOME SUPERVISOR
  const res = Papa.parse<string[]>(text, { delimiter: ';' })
  const rows: any[] = res.data as any[]
  const parsed = rows
    .map(r => r.filter((c: any) => c !== undefined && String(c).trim() !== ''))
    .filter(r => r.length >= 4) // Mínimo: REDE, SUBREDE, CODIGO, NOME
    .map(r => ({
      rede: r[0] ? String(r[0]).replace(/\"/g, '').trim() : undefined,
      subrede: r[1] ? String(r[1]).replace(/\"/g, '').trim() : undefined,
      codigo: String(r[2]).replace(/\"/g, '').trim(),
      nome_fantasia: String(r[3]).replace(/\"/g, '').trim(),
      vendedor_code: r[4] ? String(r[4]).replace(/\"/g, '').trim() : undefined,
      vendedor_name: r[5] ? String(r[5]).replace(/\"/g, '').trim() : undefined,
      supervisor_code: r[6] ? String(r[6]).replace(/\"/g, '').trim() : undefined,
      supervisor_name: r[7] ? String(r[7]).replace(/\"/g, '').trim() : undefined
    }))
  
  // Validar com Zod e filtrar inválidos
  const validated = parsed
    .map((cliente, index) => {
      try {
        return ClienteSchema.parse(cliente)
      } catch (err) {
        console.warn(`Cliente inválido na linha ${index + 1}:`, err)
        return null
      }
    })
    .filter((c): c is Cliente => c !== null)
  
  return validated
}
