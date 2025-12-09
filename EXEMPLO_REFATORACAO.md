# 📋 Exemplo Prático: Refatoração de Botão Principal

## Cenário Real: Botão de Enviar Solicitação

### ❌ ANTES - Cores Hardcoded
```tsx
<Button
  variant="contained"
  startIcon={<SendIcon />}
  onClick={handleSubmit}
  fullWidth
  disabled={loading}
  sx={{
    background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
    color: 'white',
    fontWeight: 600,
    fontSize: '1rem',
    py: 1.5,
    '&:hover': {
      background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
    },
    '&:disabled': {
      background: '#cccccc',
      color: '#666666',
    }
  }}
>
  {loading ? 'Enviando...' : 'Enviar Solicitação'}
</Button>
```

**Problemas:**
- Cores específicas (#1976d2, #1565c0) não seguem a paleta Vale Tech
- Difícil manutenção (cores duplicadas em vários lugares)
- Não há consistência entre diferentes telas
- Gradientes customizados que não usam o tema

---

### ✅ DEPOIS - Usando Tema Vale Tech
```tsx
<Button
  variant="contained"
  color="primary"
  startIcon={<SendIcon />}
  onClick={handleSubmit}
  fullWidth
  disabled={loading}
  sx={{
    py: 1.5,
    fontSize: '1rem',
  }}
>
  {loading ? 'Enviando...' : 'Enviar Solicitação'}
</Button>
```

**Vantagens:**
- Usa automaticamente #006FAD (Azul 300C da paleta Vale Tech)
- Hover, disabled e outras variações gerenciadas pelo tema
- Código mais limpo e legível
- Fácil de mudar globalmente (alterar tema afeta todos os botões)
- Consistência garantida em todo o app

---

## Onde Encontrar e Refatorar

### 1. RequestForm.tsx - Botão de Envio

**Localização:** ~linha 1200-1250

**Busque por:**
```tsx
<Button
  variant="contained"
  startIcon={<SendIcon />}
```

**Refatore para:**
```tsx
<Button
  variant="contained"
  color="primary"  // ← Adicione esta linha
  startIcon={<SendIcon />}
```

---

### 2. AdminPanel.tsx - Botões de Ação

**Botão Aprovar:**
```tsx
// ANTES
<Button sx={{ bgcolor: '#28a745', color: 'white' }}>
  Aprovar
</Button>

// DEPOIS
<Button variant="contained" color="success">
  Aprovar
</Button>
```

**Botão Reprovar:**
```tsx
// ANTES
<Button sx={{ bgcolor: '#dc3545', color: 'white' }}>
  Reprovar
</Button>

// DEPOIS
<Button variant="contained" color="error">
  Reprovar
</Button>
```

---

### 3. AuthForm.tsx - Botão de Login

**Busque por:**
```tsx
<Button type="submit" variant="contained" fullWidth>
  Login
</Button>
```

**Refatore para:**
```tsx
<Button 
  type="submit" 
  variant="contained" 
  color="primary"  // ← Adicione
  fullWidth
>
  Login
</Button>
```

---

## Mapeamento Cores → Ações

| Ação | Cor do Tema | Cor Hex | Exemplo |
|------|-------------|---------|---------|
| **Enviar/Confirmar** | `primary` | #006FAD | Enviar solicitação |
| **Aprovar/Sucesso** | `success` | #28A745 | Aprovar preço |
| **Cancelar/Deletar** | `error` | #DC3545 | Cancelar pedido |
| **Avisar** | `warning` | #FFC107 | Preço abaixo do mínimo |
| **Secundário/Neutro** | `secondary` | #6C757D | Voltar, Limpar |
| **Informação** | `info` | #17A2B8 | Ver detalhes |

---

## Teste Rápido

Para testar se a refatoração está correta, abra o navegador e:

1. Inspecione o botão (F12 → Elements)
2. Verifique se a cor aplicada é #006FAD (primary)
3. Hover no botão → deve ficar um tom mais escuro automaticamente
4. Botão disabled → deve ficar cinza automaticamente

---

## Checklist de Refatoração

- [ ] Remover `background: 'linear-gradient(...)'`
- [ ] Remover `bgcolor: '#hexcolor'`
- [ ] Adicionar `color="primary"` (ou success/error/warning)
- [ ] Remover estados `&:hover` customizados (tema já gerencia)
- [ ] Remover estados `&:disabled` customizados (tema já gerencia)
- [ ] Manter apenas estilos estruturais no sx (padding, fontSize, etc)

---

## Resultado Final

✅ **Código mais limpo**
✅ **Manutenção mais fácil**
✅ **Consistência visual**
✅ **Paleta Vale Tech aplicada**
✅ **Tema Material-UI gerenciando estados**
