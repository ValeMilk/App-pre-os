import Papa from 'papaparse'

export type Cliente = {
  codigo: string
  nome_fantasia: string
  vendedor_code?: string
  vendedor_name?: string
  extra?: string
}

export function parseClientesCsv(text: string): Cliente[] {
  // The input uses ; as delimiter and fields in quotes
  const res = Papa.parse<string[]>(text, { delimiter: ';' })
  const rows: any[] = res.data as any[]
  const parsed = rows
    .map(r => r.filter((c: any) => c !== undefined && String(c).trim() !== ''))
    .filter(r => r.length >= 2)
    .map(r => ({
      codigo: String(r[0]).replace(/\"/g, '').trim(),
      nome_fantasia: String(r[1]).replace(/\"/g, '').trim(),
      vendedor_code: r[2] ? String(r[2]).replace(/\"/g, '').trim() : undefined,
      vendedor_name: r[3] ? String(r[3]).replace(/\"/g, '').trim() : undefined,
      supervisor_code: r[4] ? String(r[4]).replace(/\"/g, '').trim() : undefined,
      supervisor_name: r[5] ? String(r[5]).replace(/\"/g, '').trim() : undefined,
      extra: r[6] ? String(r[6]).replace(/\"/g, '').trim() : undefined
    }))
  return parsed
}
