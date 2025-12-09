# 🎨 Vale Tech - Guia de Paleta de Cores

## Cores Definidas

### 1. Cores Primárias/Ação
- **Primary (Azul 300C)**: `#006FAD` - Botões principais, links, elementos de ação
- **Secondary (Cinza)**: `#6C757D` - Elementos secundários, texto auxiliar

### 2. Cores de Fundo e Texto
- **Background**: `#F8F9FA` - Fundo geral da aplicação
- **Text**: `#212529` - Texto principal (quase preto)
- **Text Secondary**: `#6c757d` - Texto secundário

### 3. Cores de Status/Feedback
- **Success (Verde)**: `#28A745` - Operações bem-sucedidas, confirmações
- **Danger (Vermelho)**: `#DC3545` - Erros, alertas críticos, exclusões
- **Warning (Amarelo)**: `#FFC107` - Avisos, atenção necessária
- **Info (Azul claro)**: `#17A2B8` - Informações adicionais

---

## Como Usar

### Em CSS Puro (variáveis CSS)
```css
/* Disponíveis em styles.css */
.meu-botao {
  background-color: var(--primary-color);
  color: white;
}

.alerta-erro {
  background-color: var(--danger-light);
  color: var(--danger-dark);
  border: 1px solid var(--danger-color);
}

.card-sucesso {
  background: var(--gradient-success);
}
```

### Em Material-UI (tema)
```tsx
import { Button, Box, Typography } from '@mui/material';

// Botão primário (Azul #006FAD)
<Button variant="contained" color="primary">
  Ação Principal
</Button>

// Botão secundário (Cinza #6C757D)
<Button variant="contained" color="secondary">
  Ação Secundária
</Button>

// Botão de sucesso (Verde #28A745)
<Button variant="contained" color="success">
  Confirmar
</Button>

// Botão de erro (Vermelho #DC3545)
<Button variant="contained" color="error">
  Cancelar
</Button>

// Botão de aviso (Amarelo #FFC107)
<Button variant="contained" color="warning">
  Atenção
</Button>

// Usando cores no sx prop
<Box sx={{ bgcolor: 'primary.main', color: 'white', p: 2 }}>
  Fundo azul #006FAD
</Box>

<Typography sx={{ color: 'success.main' }}>
  Texto verde #28A745
</Typography>

// Acessando variações
<Box sx={{ bgcolor: 'primary.light' }}>  {/* Azul mais claro */}
<Box sx={{ bgcolor: 'primary.dark' }}>   {/* Azul mais escuro */}
```

---

## Exemplos de Refatoração

### ❌ ANTES (cores hardcoded)
```tsx
<Button 
  sx={{ 
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white'
  }}
>
  Clique aqui
</Button>

<Box sx={{ bgcolor: '#1976d2' }}>
  Conteúdo
</Box>
```

### ✅ DEPOIS (usando tema)
```tsx
<Button 
  variant="contained"
  color="primary"
>
  Clique aqui
</Button>

<Box sx={{ bgcolor: 'primary.main' }}>
  Conteúdo
</Box>
```

---

## Componentes já Refatorados

### ✅ VendorDashboard.tsx
- Título "Bem-vindo ao Vale Tech" usa `color: 'primary.main'`
- Cards de apps usam cores diretas:
  - Solicitação de Preços: `#006FAD` (primary)
  - Calculadora: `#28A745` (success)

### ✅ CalculadoraStandalone.tsx
- Header usa `bgcolor: 'success.main'` (verde #28A745)
- Botão "Voltar ao Menu" usa `color="success"`

### ✅ RequestForm.tsx (Modal Calculadora)
- DialogTitle usa `bgcolor: 'primary.main'` (azul #006FAD)
- Botão "Fechar" usa `color="primary"`

---

## Checklist de Refatoração

Ao adicionar novos componentes ou refatorar existentes:

### Botões
- [ ] Botões de ação principal → `color="primary"` (Azul #006FAD)
- [ ] Botões de sucesso/confirmação → `color="success"` (Verde #28A745)
- [ ] Botões de cancelar/erro → `color="error"` (Vermelho #DC3545)
- [ ] Botões de aviso → `color="warning"` (Amarelo #FFC107)
- [ ] Botões secundários → `color="secondary"` (Cinza #6C757D)

### Alertas/Feedback
- [ ] Mensagens de sucesso → `severity="success"` ou `bgcolor: 'success.light'`
- [ ] Mensagens de erro → `severity="error"` ou `bgcolor: 'error.light'`
- [ ] Mensagens de aviso → `severity="warning"` ou `bgcolor: 'warning.light'`
- [ ] Mensagens informativas → `severity="info"` ou `bgcolor: 'info.light'`

### Fundos e Containers
- [ ] Fundo de páginas → `bgcolor: 'background.default'` (#F8F9FA)
- [ ] Fundo de cards → `bgcolor: 'background.paper'` (branco)
- [ ] Headers destacados → `bgcolor: 'primary.main'`

### Texto
- [ ] Texto principal → `color: 'text.primary'` (#212529)
- [ ] Texto secundário → `color: 'text.secondary'` (#6c757d)

---

## Componentes Pendentes de Refatoração

### AdminPanel.tsx
- Verificar botões e cores de status
- Substituir cores hardcoded por tema

### SupervisorPanel.tsx
- Botões de aprovação → `color="success"`
- Botões de reprovação → `color="error"`

### GerentePanel.tsx
- Similar ao SupervisorPanel

### AuthForm.tsx
- Botão de login → `color="primary"`

---

## Variáveis CSS Disponíveis (styles.css)

```css
/* Cores Primárias */
--primary-color: #006FAD
--primary-hover: #005a8c
--primary-light: #4d9dc4
--primary-dark: #004a73

/* Cores Secundárias */
--secondary-color: #6C757D
--secondary-hover: #5a6268

/* Fundo e Texto */
--background-color: #F8F9FA
--text-color: #212529
--text-secondary: #6c757d
--surface-color: #FFFFFF

/* Status */
--success-color: #28A745
--success-light: #d4edda
--success-dark: #1e7e34

--danger-color: #DC3545
--danger-light: #f8d7da
--danger-dark: #bd2130

--warning-color: #FFC107
--warning-light: #fff3cd
--warning-dark: #e0a800

--info-color: #17A2B8
--info-light: #d1ecf1

/* UI */
--border-color: #dee2e6
--shadow-color: rgba(0, 0, 0, 0.1)
--overlay-color: rgba(0, 0, 0, 0.5)

/* Gradientes */
--gradient-primary: linear-gradient(135deg, #006FAD 0%, #004a73 100%)
--gradient-secondary: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
--gradient-success: linear-gradient(135deg, #28A745 0%, #1e7e34 100%)
--gradient-danger: linear-gradient(135deg, #DC3545 0%, #bd2130 100%)
```

---

## Dicas

1. **Sempre use as cores do tema** ao invés de valores hexadecimais diretos
2. **Prefira `color="primary"` nos botões** ao invés de `sx={{ bgcolor: ... }}`
3. **Use variações** (`primary.light`, `primary.dark`) para hierarquia visual
4. **Mantenha consistência**: mesma ação = mesma cor em todo app
5. **Teste acessibilidade**: contraste de texto/fundo adequado

---

## Próximos Passos

1. Refatorar AdminPanel, SupervisorPanel, GerentePanel
2. Padronizar todos os botões de ação
3. Revisar alertas e mensagens de feedback
4. Documentar componentes customizados com cores específicas
