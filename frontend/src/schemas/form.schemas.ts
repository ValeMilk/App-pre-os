import { z } from 'zod';

// Schema para validação do formulário de login
export const LoginFormSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória')
});

export type LoginFormData = z.infer<typeof LoginFormSchema>;

// Schema para validação do formulário de solicitação de preço
export const RequestFormSchema = z.object({
  customer_code: z.string().min(1, 'Cliente é obrigatório').optional(),
  subrede: z.string().min(1, 'Subrede é obrigatória').optional(),
  product_id: z.string().min(1, 'Produto é obrigatório'),
  requested_price: z.string()
    .min(1, 'Preço é obrigatório')
    .refine((val) => {
      const num = parseFloat(val.replace(',', '.'));
      return !isNaN(num) && num > 0;
    }, 'Preço deve ser um número positivo'),
  quantity: z.string()
    .min(1, 'Quantidade é obrigatória')
    .refine((val) => {
      const num = parseInt(val);
      return !isNaN(num) && num > 0;
    }, 'Quantidade deve ser um número inteiro positivo'),
  notes: z.string().optional()
}).refine(
  (data) => data.customer_code || data.subrede,
  { message: 'Cliente ou Subrede deve ser selecionado' }
);

export type RequestFormData = z.infer<typeof RequestFormSchema>;

// Schema para validação do formulário de registro de usuário
export const RegisterFormSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  tipo: z.enum(['vendedor', 'supervisor', 'gerente', 'admin'], {
    errorMap: () => ({ message: 'Tipo de usuário inválido' })
  }),
  vendedor_code: z.string().optional(),
  codigo_supervisor: z.string().optional()
});

export type RegisterFormData = z.infer<typeof RegisterFormSchema>;
