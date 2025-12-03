import { z } from 'zod';

// Schema para User (API responses)
// Backend retorna 'tipo' ao invés de 'role'
export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  tipo: z.enum(['vendedor', 'supervisor', 'gerente', 'admin']),
  vendedor_code: z.string().optional(),
  codigo_supervisor: z.string().optional()
});

export type User = z.infer<typeof UserSchema>;

// Schema para Request (solicitação de preço)
// Usando z.any() temporariamente para campos opcionais que podem vir em formatos variados
export const RequestSchema = z.object({
  _id: z.string().optional(),
  id: z.string().optional(),
  requester_name: z.string().optional().default(''),
  requester_id: z.string().optional().default(''),
  customer_code: z.string().optional().default(''),
  customer_name: z.string().optional(),
  product_id: z.string().optional().default(''),
  product_name: z.string().optional(),
  requested_price: z.union([z.string(), z.number()]).optional().default('0'),
  quantity: z.union([z.string(), z.number()]).optional(),
  product_maximo: z.union([z.string(), z.number()]).optional(),
  product_minimo: z.union([z.string(), z.number()]).optional(),
  product_promocional: z.union([z.string(), z.number()]).optional(),
  currency: z.string().optional().default('R$'),
  status: z.string().optional().default('Pending'),
  notes: z.string().optional(),
  created_at: z.union([z.string(), z.date()]).optional().default(''),
  approved_by: z.string().optional(),
  approved_at: z.union([z.string(), z.date()]).optional(),
  subrede_batch_id: z.string().optional(),
  subrede_name: z.string().optional(),
  discount_percent: z.union([z.string(), z.number()]).optional(),
  discounted_price: z.union([z.string(), z.number()]).optional()
}).passthrough(); // Permite campos extras que não estão no schema

export type Request = z.infer<typeof RequestSchema>;

// Schema para array de requests
export const RequestsArraySchema = z.array(RequestSchema);

// Schema para Auth Response
export const AuthResponseSchema = z.object({
  token: z.string(),
  user: UserSchema
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

// Schema para lista de usuários
export const UserListSchema = z.array(
  z.object({
    name: z.string(),
    email: z.string().email()
  })
);

export type UserList = z.infer<typeof UserListSchema>;
