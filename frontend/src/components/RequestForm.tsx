import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Papa from 'papaparse'
import { Cliente } from '../utils/parseCsv'
import { Produto } from '../utils/parseProdutosCsv'
import { Desconto } from '../types/Desconto'
import { RequestFormSchema, RequestsArraySchema } from '../schemas'
import { Box, Button, TextField, Typography, Alert, Stack, Paper, Autocomplete, Divider, Slide, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText, Chip, InputAdornment, Tooltip } from '@mui/material'
import SendIcon from '@mui/icons-material/Send';
import DownloadIcon from '@mui/icons-material/Download';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PersonIcon from '@mui/icons-material/Person';
import WarningIcon from '@mui/icons-material/Warning';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CancelIcon from '@mui/icons-material/Cancel';
import CalculateIcon from '@mui/icons-material/Calculate';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

type Props = {
  clientes: Cliente[]
  produtos: Produto[]
  descontos: Desconto[]
  onClientesLoaded: (c: Cliente[]) => void
}

type PriceRequest = {
  id: string
  requester_name: string
  requester_id?: string
  customer_code: string
  customer_name?: string
  product_id: string
  product_name?: string
  requested_price: string
  quantity?: string
  currency: string
  status: string
  notes?: string
  created_at: string
  approved_by?: string
  approved_at?: string
}

import { API_ENDPOINTS } from '../config/api';
const API_URL = API_ENDPOINTS.requests.base;

export default function RequestForm({ clientes, produtos, descontos, onClientesLoaded }: Props) {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  // Estados do formulário e feedback
  const [selectionMode, setSelectionMode] = useState<'cliente' | 'subrede'>('cliente');
  const [selectedCustomer, setSelectedCustomer] = useState<Cliente | null>(null)
  const [selectedSubrede, setSelectedSubrede] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Produto | null>(null)
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [requests, setRequests] = useState<PriceRequest[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmPromocionalDialogOpen, setConfirmPromocionalDialogOpen] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [promocionalWarningMessage, setPromocionalWarningMessage] = useState('');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [selectedRequestForCancel, setSelectedRequestForCancel] = useState<string | null>(null);
  
  // Estados da calculadora
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [calcCusto, setCalcCusto] = useState('');
  const [calcMargem, setCalcMargem] = useState('');
  const [calcMarkup, setCalcMarkup] = useState('');
  const [calcRenda, setCalcRenda] = useState('');
  const [calcLucro, setCalcLucro] = useState('');
  
  // Rastrear os 2 últimos campos editados
  const [ultimosCampos, setUltimosCampos] = useState<string[]>([]);

  // Função unificada que calcula baseado nos 2 campos fixos
  const recalcular = (campo: string, valor: string, novosCampos: string[]) => {
    if (novosCampos.length < 2) return;

    const [campo1, campo2] = novosCampos;
    const valores: Record<string, number> = {
      custo: parseFloat(calcCusto),
      margem: parseFloat(calcMargem),
      markup: parseFloat(calcMarkup),
      renda: parseFloat(calcRenda),
      lucro: parseFloat(calcLucro)
    };
    // Usar o novo valor digitado
    valores[campo] = parseFloat(valor);

    // Obter os 2 valores fixos
    const val1 = valores[campo1];
    const val2 = valores[campo2];

    if (isNaN(val1) || isNaN(val2)) return;

    // CUSTO + RENDA
    if ((campo1 === 'custo' && campo2 === 'renda') || (campo1 === 'renda' && campo2 === 'custo')) {
      const custo = valores.custo;
      const renda = valores.renda;
      if (renda > custo) {
        const lucro = renda - custo;
        const margem = (lucro / renda) * 100;
        const markup = (lucro / custo) * 100;
        setCalcLucro(lucro.toFixed(2));
        setCalcMargem(margem.toFixed(2));
        setCalcMarkup(markup.toFixed(4));
      }
    }
    // CUSTO + MARGEM
    else if ((campo1 === 'custo' && campo2 === 'margem') || (campo1 === 'margem' && campo2 === 'custo')) {
      const custo = valores.custo;
      const margem = valores.margem;
      if (margem < 100) {
        const markup = margem / (1 - margem / 100);
        const renda = custo * (1 + markup / 100);
        const lucro = renda - custo;
        setCalcMarkup(markup.toFixed(4));
        setCalcRenda(renda.toFixed(2));
        setCalcLucro(lucro.toFixed(2));
      }
    }
    // CUSTO + MARKUP
    else if ((campo1 === 'custo' && campo2 === 'markup') || (campo1 === 'markup' && campo2 === 'custo')) {
      const custo = valores.custo;
      const markup = valores.markup;
      const margem = (markup / (1 + markup / 100));
      const renda = custo * (1 + markup / 100);
      const lucro = renda - custo;
      setCalcMargem(margem.toFixed(2));
      setCalcRenda(renda.toFixed(2));
      setCalcLucro(lucro.toFixed(2));
    }
    // CUSTO + LUCRO
    else if ((campo1 === 'custo' && campo2 === 'lucro') || (campo1 === 'lucro' && campo2 === 'custo')) {
      const custo = valores.custo;
      const lucro = valores.lucro;
      const renda = custo + lucro;
      const margem = (lucro / renda) * 100;
      const markup = (lucro / custo) * 100;
      setCalcRenda(renda.toFixed(2));
      setCalcMargem(margem.toFixed(2));
      setCalcMarkup(markup.toFixed(4));
    }
    // RENDA + MARGEM
    else if ((campo1 === 'renda' && campo2 === 'margem') || (campo1 === 'margem' && campo2 === 'renda')) {
      const renda = valores.renda;
      const margem = valores.margem;
      if (margem < 100) {
        const markup = margem / (1 - margem / 100);
        const custo = renda / (1 + markup / 100);
        const lucro = renda - custo;
        setCalcMarkup(markup.toFixed(4));
        setCalcCusto(custo.toFixed(2));
        setCalcLucro(lucro.toFixed(2));
      }
    }
    // RENDA + MARKUP
    else if ((campo1 === 'renda' && campo2 === 'markup') || (campo1 === 'markup' && campo2 === 'renda')) {
      const renda = valores.renda;
      const markup = valores.markup;
      const margem = (markup / (1 + markup / 100));
      const custo = renda / (1 + markup / 100);
      const lucro = renda - custo;
      setCalcMargem(margem.toFixed(2));
      setCalcCusto(custo.toFixed(2));
      setCalcLucro(lucro.toFixed(2));
    }
    // RENDA + LUCRO
    else if ((campo1 === 'renda' && campo2 === 'lucro') || (campo1 === 'lucro' && campo2 === 'renda')) {
      const renda = valores.renda;
      const lucro = valores.lucro;
      if (renda > lucro) {
        const custo = renda - lucro;
        const margem = (lucro / renda) * 100;
        const markup = (lucro / custo) * 100;
        setCalcCusto(custo.toFixed(2));
        setCalcMargem(margem.toFixed(2));
        setCalcMarkup(markup.toFixed(4));
      }
    }
    // MARGEM + MARKUP (são interdependentes)
    else if ((campo1 === 'margem' && campo2 === 'markup') || (campo1 === 'markup' && campo2 === 'margem')) {
      // Se digitou margem por último, recalcula markup
      if (campo === 'margem') {
        const margem = valores.margem;
        const markup = margem / (1 - margem / 100);
        setCalcMarkup(markup.toFixed(4));
      } else {
        const markup = valores.markup;
        const margem = (markup / (1 + markup / 100));
        setCalcMargem(margem.toFixed(2));
      }
    }
    // MARGEM + LUCRO
    else if ((campo1 === 'margem' && campo2 === 'lucro') || (campo1 === 'lucro' && campo2 === 'margem')) {
      const margem = valores.margem;
      const lucro = valores.lucro;
      if (margem < 100) {
        const renda = lucro / (margem / 100);
        const custo = renda - lucro;
        const markup = margem / (1 - margem / 100);
        setCalcRenda(renda.toFixed(2));
        setCalcCusto(custo.toFixed(2));
        setCalcMarkup(markup.toFixed(4));
      }
    }
    // MARKUP + LUCRO
    else if ((campo1 === 'markup' && campo2 === 'lucro') || (campo1 === 'lucro' && campo2 === 'markup')) {
      const markup = valores.markup;
      const lucro = valores.lucro;
      const custo = lucro / (markup / 100);
      const renda = custo + lucro;
      const margem = (markup / (1 + markup / 100));
      setCalcCusto(custo.toFixed(2));
      setCalcRenda(renda.toFixed(2));
      setCalcMargem(margem.toFixed(2));
    }
  };

  const handleCalcCustoChange = (value: string) => {
    setCalcCusto(value);
    const novosCampos = [...ultimosCampos.filter(c => c !== 'custo'), 'custo'].slice(-2);
    setUltimosCampos(novosCampos);
    recalcular('custo', value, novosCampos);
  };

  const handleCalcMargemChange = (value: string) => {
    setCalcMargem(value);
    const novosCampos = [...ultimosCampos.filter(c => c !== 'margem'), 'margem'].slice(-2);
    setUltimosCampos(novosCampos);
    recalcular('margem', value, novosCampos);
  };

  const handleCalcMarkupChange = (value: string) => {
    setCalcMarkup(value);
    const novosCampos = [...ultimosCampos.filter(c => c !== 'markup'), 'markup'].slice(-2);
    setUltimosCampos(novosCampos);
    recalcular('markup', value, novosCampos);
  };

  const handleCalcRendaChange = (value: string) => {
    setCalcRenda(value);
    const novosCampos = [...ultimosCampos.filter(c => c !== 'renda'), 'renda'].slice(-2);
    setUltimosCampos(novosCampos);
    recalcular('renda', value, novosCampos);
  };

  const handleCalcLucroChange = (value: string) => {
    setCalcLucro(value);
    const novosCampos = [...ultimosCampos.filter(c => c !== 'lucro'), 'lucro'].slice(-2);
    setUltimosCampos(novosCampos);
    recalcular('lucro', value, novosCampos);
  };

  const limparCalculadora = () => {
    setCalcCusto('');
    setCalcMargem('');
    setCalcMarkup('');
    setCalcRenda('');
    setCalcLucro('');
  };

  // Helper function: busca desconto com prioridade (produto > grupo)
  const findDescontoForClienteProduto = (cliente: Cliente, produto: Produto): Desconto | null => {
    console.log('� NOVA VERSÃO - Sistema de desconto com 2 níveis');
    console.log('�🔍 DEBUG DESCONTO - Cliente:', cliente);
    console.log('🔍 DEBUG DESCONTO - Produto:', produto);
    console.log('🔍 DEBUG DESCONTO - Total descontos:', descontos.length);

    // PRIORITY 1: Buscar desconto específico do produto (tipo_desconto='produto')
    let desconto: Desconto | null = descontos.find(d => {
      if (d.tipo_desconto === 'grupo') return false;
      
      const produtoMatch = d.codigo_produto === produto.codigo_produto;
      if (!produtoMatch) return false;
      
      const descontoTemRede = d.rede && d.rede !== '-' && d.rede.trim() !== '';
      const descontoTemSubrede = d.subrede && d.subrede !== '-' && d.subrede.trim() !== '';
      
      if (descontoTemRede && descontoTemSubrede) {
        const redeMatch = cliente.rede && d.rede && d.rede.trim() === cliente.rede.trim();
        const subredeMatch = cliente.subrede && d.subrede && d.subrede.trim() === cliente.subrede.trim();
        return redeMatch && subredeMatch;
      }
      
      if (descontoTemRede && !descontoTemSubrede) {
        return cliente.rede && d.rede && d.rede.trim() === cliente.rede.trim();
      }
      
      if (!descontoTemRede && descontoTemSubrede) {
        return cliente.subrede && d.subrede && d.subrede.trim() === cliente.subrede.trim();
      }
      
      return false;
    }) || null;

    // Se encontrou desconto de produto, verificar se é válido (> 0%)
    if (desconto) {
      const percentualStr = desconto.desconto.replace('%', '').replace(',', '.');
      const percentual = parseFloat(percentualStr);
      
      if (percentual > 0) {
        console.log('✅ Desconto de produto encontrado:', desconto);
        return desconto;
      } else {
        console.log('⚠️ Desconto de produto é 0%, buscando desconto de grupo...');
        desconto = null; // Ignorar desconto 0%
      }
    }

    // PRIORITY 2: Buscar desconto de grupo
    console.log('🔍 VERIFICANDO REDE_ID DO CLIENTE:', {
      rede_id: cliente.rede_id,
      rede: cliente.rede,
      tipo: typeof cliente.rede_id,
      temRedeId: !!cliente.rede_id
    });
    
    if (!desconto && cliente.rede_id) {
      console.log('🔍 Buscando desconto de grupo...');
      
      const descontoProdutoComGrupo = descontos.find(d => 
        d.codigo_produto === produto.codigo_produto && d.e01_id !== undefined
      );
      
      console.log('🔍 PRODUTO COM GRUPO ENCONTRADO?', descontoProdutoComGrupo);
      
      if (descontoProdutoComGrupo && descontoProdutoComGrupo.e01_id) {
        const produtoE01Id = descontoProdutoComGrupo.e01_id;
        console.log('🔍 Produto pertence ao grupo:', { e01_id: produtoE01Id, grupo: descontoProdutoComGrupo.grupo });
        
        desconto = descontos.find(d => {
          if (d.tipo_desconto !== 'grupo') return false;
          const redeMatch = d.rede_id && cliente.rede_id && Number(d.rede_id) === Number(cliente.rede_id);
          const grupoMatch = d.e01_id === produtoE01Id;
          return redeMatch && grupoMatch;
        }) || null;
        
        // Verificar se desconto de grupo é válido (> 0%)
        if (desconto) {
          const percentualStr = desconto.desconto.replace('%', '').replace(',', '.');
          const percentual = parseFloat(percentualStr);
          
          if (percentual > 0) {
            console.log('✅ Desconto de grupo encontrado:', desconto);
          } else {
            console.log('⚠️ Desconto de grupo é 0%, ignorando...');
            desconto = null;
          }
        }
      }
    }

    console.log('✅ DEBUG DESCONTO - Desconto final:', desconto);
    return desconto || null;
  };

  // Calcular desconto aplicável em tempo real
  const descontoAplicavel = useMemo(() => {
    if (!selectedCustomer && !selectedSubrede) return null;
    if (!selectedProduct) return null;

    let cliente: Cliente | undefined;
    if (selectionMode === 'cliente') {
      cliente = selectedCustomer || undefined;
    } else if (selectionMode === 'subrede' && selectedSubrede) {
      const clientesDaSubrede = clientes.filter(c => c.subrede && c.subrede.trim() === selectedSubrede);
      cliente = clientesDaSubrede[0];
    }

    if (!cliente) return null;

    return findDescontoForClienteProduto(cliente, selectedProduct);
  }, [selectedCustomer, selectedSubrede, selectedProduct, descontos, clientes, selectionMode]);

  // Calcular preço com desconto
  const precoComDesconto = useMemo(() => {
    if (!price || !descontoAplicavel) return null;

    const precoDigitado = parseFloat(price.replace(',', '.'));
    if (isNaN(precoDigitado)) return null;

    // Extrair percentual do desconto (ex: "5,00%" -> 5)
    const percentualStr = descontoAplicavel.desconto.replace('%', '').replace(',', '.');
    const percentual = parseFloat(percentualStr);
    if (isNaN(percentual)) return null;

    const valorDesconto = precoDigitado * (percentual / 100);
    const precoFinal = precoDigitado - valorDesconto;

    return {
      percentual,
      valorDesconto,
      precoFinal
    };
  }, [price, descontoAplicavel]);

  // Calcular preço sugerido baseado no MÍNIMO
  const precoSugeridoMinimo = useMemo(() => {
    if (!selectedProduct || !selectedProduct.minimo) return null;

    const precoMinimo = parseFloat(selectedProduct.minimo.replace(',', '.'));
    if (isNaN(precoMinimo)) return null;

    // Se tem desconto, calcular preço que RESULTA no mínimo APÓS o desconto
    if (descontoAplicavel) {
      const percentualStr = descontoAplicavel.desconto.replace('%', '').replace(',', '.');
      const percentual = parseFloat(percentualStr);
      if (!isNaN(percentual) && percentual > 0) {
        const fatorDesconto = 1 - (percentual / 100);
        const precoSugeridoAntesDesconto = precoMinimo / fatorDesconto;
        return {
          valor: precoSugeridoAntesDesconto,
          precoReferencia: precoMinimo,
          temDesconto: true,
          percentualDesconto: percentual,
          tipo: 'mínimo' as const
        };
      }
    }

    return {
      valor: precoMinimo,
      precoReferencia: precoMinimo,
      temDesconto: false,
      percentualDesconto: 0,
      tipo: 'mínimo' as const
    };
  }, [selectedProduct, descontoAplicavel]);

  // Calcular preço sugerido baseado no PROMOCIONAL
  const precoSugeridoPromocional = useMemo(() => {
    if (!selectedProduct || !selectedProduct.promocional) return null;

    const precoPromocional = parseFloat(selectedProduct.promocional.replace(',', '.'));
    if (isNaN(precoPromocional)) return null;

    // Se tem desconto aplicável, calcular preço que RESULTA no promocional APÓS o desconto
    if (descontoAplicavel) {
      const percentualStr = descontoAplicavel.desconto.replace('%', '').replace(',', '.');
      const percentual = parseFloat(percentualStr);
      if (!isNaN(percentual) && percentual > 0) {
        const fatorDesconto = 1 - (percentual / 100);
        const precoSugeridoAntesDesconto = precoPromocional / fatorDesconto;
        return {
          valor: precoSugeridoAntesDesconto,
          precoReferencia: precoPromocional,
          temDesconto: true,
          percentualDesconto: percentual,
          tipo: 'promocional' as const
        };
      }
    }

    return {
      valor: precoPromocional,
      precoReferencia: precoPromocional,
      temDesconto: false,
      percentualDesconto: 0,
      tipo: 'promocional' as const
    };
  }, [selectedProduct, descontoAplicavel]);

  // Calcular preço FINAL (após desconto) - usado em várias validações
  const precoFinalCalculado = useMemo(() => {
    if (!price) return null;
    
    const precoDigitado = parseFloat(price.replace(',', '.'));
    if (isNaN(precoDigitado)) return null;
    
    let precoFinal = precoDigitado;
    
    if (descontoAplicavel) {
      const percentualStr = descontoAplicavel.desconto.replace('%', '').replace(',', '.');
      const percentual = parseFloat(percentualStr);
      if (!isNaN(percentual) && percentual > 0) {
        const valorDesconto = precoDigitado * (percentual / 100);
        precoFinal = precoDigitado - valorDesconto;
      }
    }
    
    return Math.round(precoFinal * 100) / 100;
  }, [price, descontoAplicavel]);

  // Verificar se preço FINAL está abaixo do MÍNIMO
  const precoAbaixoDoMinimo = useMemo(() => {
    if (!precoFinalCalculado || !selectedProduct || !selectedProduct.minimo) {
      return false;
    }
    
    const precoMinimo = parseFloat(selectedProduct.minimo.replace(',', '.'));
    if (isNaN(precoMinimo)) return false;
    
    const precoMinimoArredondado = Math.round(precoMinimo * 100) / 100;
    
    return precoFinalCalculado < precoMinimoArredondado;
  }, [precoFinalCalculado, selectedProduct]);

  // Verificar se preço FINAL está abaixo do PROMOCIONAL (mostra sempre que violado)
  const precoAbaixoDoPromocional = useMemo(() => {
    if (!precoFinalCalculado || !selectedProduct || !selectedProduct.promocional) {
      return false;
    }
    
    const precoPromocional = parseFloat(selectedProduct.promocional.replace(',', '.'));
    if (isNaN(precoPromocional)) return false;
    
    const precoPromocionalArredondado = Math.round(precoPromocional * 100) / 100;
    
    return precoFinalCalculado < precoPromocionalArredondado;
  }, [precoFinalCalculado, selectedProduct]);

  // Extrair lista única de subredes
  const subredes = useMemo(() => {
    const uniqueSubredes = new Set<string>();
    clientes.forEach(c => {
      if (c.subrede && c.subrede.trim()) {
        uniqueSubredes.add(c.subrede.trim());
      }
    });
    return Array.from(uniqueSubredes).sort();
  }, [clientes]);

  // Carregar solicitações do backend
  const fetchRequests = () => {
    if (!token) return;
    
    // Calcular data de 14 dias atrás
    const hoje = new Date();
    const quatorzeDiasAtras = new Date();
    quatorzeDiasAtras.setDate(hoje.getDate() - 14);
    
    const startDate = quatorzeDiasAtras.toISOString().split('T')[0]; // YYYY-MM-DD
    const endDate = hoje.toISOString().split('T')[0];
    
    const url = `${API_URL}?start_date=${startDate}&end_date=${endDate}`;
    
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async res => {
        if (res.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.reload();
          return;
        }
        if (!res.ok) throw new Error('Erro ao buscar solicitações');
        const data = await res.json();
        
        // Validar resposta com Zod
        try {
          const validatedRequests = RequestsArraySchema.parse(data);
          setRequests(validatedRequests as any);
        } catch (err) {
          console.error('Erro ao validar solicitações:', err);
          setError('Dados inválidos recebidos do servidor');
        }
      })
      .catch(() => setError('Erro ao buscar solicitações do servidor.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchRequests();
    // Polling a cada 5 segundos para atualizar status em tempo real
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, [token]);

  // Upload de clientes.csv
  function onFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    Papa.parse(file, {
      complete: (res: any) => {
        const parsed = res.data
          .filter((r: any[]) => r.length >= 2)
          .map((r: any[]) => ({
            codigo: r[0]?.trim(),
            nome_fantasia: String(r[1] || '').trim(),
            vendedor_code: r[2]?.trim(),
            vendedor_name: r[3]?.trim(),
            extra: r[4]?.trim()
          }))
        onClientesLoaded(parsed)
      }
    })
  }

  // Validação e submit do formulário

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Validação com Zod
    const formData = {
      customer_code: selectionMode === 'cliente' ? selectedCustomer?.codigo : undefined,
      subrede: selectionMode === 'subrede' ? selectedSubrede : undefined,
      product_id: selectedProduct?.id || '',
      requested_price: price,
      quantity: quantity,
      notes: notes
    };

    const validationResult = RequestFormSchema.safeParse(formData);
    
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      setError(firstError.message);
      return;
    }
    
    // Validação baseada no modo de seleção (backup manual)
    if (selectionMode === 'cliente' && !selectedCustomer) {
      setError('Selecione um cliente válido.');
      return;
    }
    if (selectionMode === 'subrede' && !selectedSubrede) {
      setError('Selecione uma subrede válida.');
      return;
    }
    if (!selectedProduct) {
      setError('Selecione um produto válido.');
      return;
    }

    // Validação de justificativa obrigatória
    if (!notes.trim()) {
      setError('A justificativa é obrigatória. Por favor, preencha o campo.');
      return;
    }
    if (notes.trim().length < 10) {
      setError('A justificativa deve ter no mínimo 10 caracteres.');
      return;
    }

    // NOVA REGRA: Validação de segmento especial (PADARIA, RESTAURANTE & LANCHONETE, COZINHA & TRANSFORMADORES)
    if (selectionMode === 'cliente' && selectedCustomer && selectedCustomer.segmento && selectedProduct) {
      const segmentosEspeciais = ['PADARIA', 'RESTAURANTE & LANCHONETE', 'COZINHA & TRANSFORMADORES'];
      const segmentoCliente = selectedCustomer.segmento.trim().toUpperCase();
      
      if (segmentosEspeciais.includes(segmentoCliente)) {
        const priceNum = parseFloat(price);
        const maxPrice = selectedProduct.maximo ? parseFloat(selectedProduct.maximo.replace(',', '.')) : null;
        
        if (maxPrice && priceNum !== maxPrice) {
          setError(`⚠️ ATENÇÃO: Para o segmento "${selectedCustomer.segmento}", o preço solicitado deve ser IGUAL ao preço máximo do produto (R$ ${selectedProduct.maximo}). Preço atual: R$ ${priceNum.toFixed(2)}`);
          return;
        }
      }
    }

    // Verificar se já existe solicitação pendente/aguardando para o mesmo cliente + produto + preço
    const statusPendenteList = ['Pendente', 'Pending', 'Aguardando Gerência'];

    if (selectionMode === 'cliente' && selectedCustomer && selectedProduct) {
      const solicitacaoDuplicada = requests.find(r => {
        const mesmoCliente = String(r.customer_code).trim() === String(selectedCustomer.codigo).trim();
        const mesmoProduto = String(r.product_id).trim() === String(selectedProduct.codigo_produto).trim();
        const mesmoPreco = parseFloat(String(r.requested_price).replace(',', '.')) === parseFloat(price.replace(',', '.'));
        const statusPendente = statusPendenteList.includes(r.status);
        return mesmoCliente && mesmoProduto && mesmoPreco && statusPendente;
      });

      if (solicitacaoDuplicada) {
        const statusMsg = solicitacaoDuplicada.status === 'Aguardando Gerência'
          ? 'aguardando aprovação da gerência'
          : 'pendente de aprovação';
        setError(`⚠️ SOLICITAÇÃO DUPLICADA: Já existe uma solicitação ${statusMsg} para o produto "${selectedProduct.nome_produto}" no cliente "${selectedCustomer.nome_fantasia}" com o mesmo preço. Aguarde a aprovação ou cancelamento antes de criar uma nova solicitação.`);
        return;
      }
    }

    if (selectionMode === 'subrede' && selectedSubrede && selectedProduct) {
      const clientesDaSubrede = clientes.filter(c => c.subrede && c.subrede.trim() === selectedSubrede.trim());
      const codigosSubrede = new Set(clientesDaSubrede.map(c => String(c.codigo).trim()));

      const solicitacaoDuplicada = requests.find(r => {
        const clienteNaSubrede = codigosSubrede.has(String(r.customer_code).trim());
        const mesmoProduto = String(r.product_id).trim() === String(selectedProduct.codigo_produto).trim();
        const mesmoPreco = parseFloat(String(r.requested_price).replace(',', '.')) === parseFloat(price.replace(',', '.'));
        const statusPendente = statusPendenteList.includes(r.status);
        return clienteNaSubrede && mesmoProduto && mesmoPreco && statusPendente;
      });

      if (solicitacaoDuplicada) {
        const statusMsg = solicitacaoDuplicada.status === 'Aguardando Gerência'
          ? 'aguardando aprovação da gerência'
          : 'pendente de aprovação';
        setError(`⚠️ SOLICITAÇÃO DUPLICADA: Já existe uma solicitação ${statusMsg} para o produto "${selectedProduct.nome_produto}" na subrede "${selectedSubrede}" com o mesmo preço. Aguarde a aprovação ou cancelamento antes de criar uma nova solicitação.`);
        return;
      }
    }

    // Validação de faixa de preço do produto
    if (selectedProduct && selectedProduct.maximo && selectedProduct.minimo && selectedProduct.promocional) {
      const priceNum = parseFloat(price);
      const minPrice = parseFloat(selectedProduct.minimo.replace(',', '.'));
      const maxPrice = parseFloat(selectedProduct.maximo.replace(',', '.'));
      const promocionalPrice = parseFloat(selectedProduct.promocional.replace(',', '.'));
      
      // Calcular desconto para validação
      let precoFinal = priceNum;
      let temDesconto = false;
      if (selectionMode === 'cliente' && selectedCustomer) {
        const descontoInfo = calcularDesconto(selectedCustomer, selectedProduct, price);
        if (descontoInfo) {
          precoFinal = parseFloat(descontoInfo.discounted_price);
          temDesconto = true;
        }
      } else if (selectionMode === 'subrede' && selectedSubrede) {
        // Para subrede, pegar qualquer cliente da subrede para verificar desconto
        const clientesDaSubrede = clientes.filter(c => c.subrede && c.subrede.trim() === selectedSubrede);
        if (clientesDaSubrede.length > 0) {
          const descontoInfo = calcularDesconto(clientesDaSubrede[0], selectedProduct, price);
          if (descontoInfo) {
            precoFinal = parseFloat(descontoInfo.discounted_price);
            temDesconto = true;
          }
        }
      }

      // Se preço FINAL (após desconto) acima do máximo, bloqueia
      if (precoFinal > maxPrice) {
        if (temDesconto) {
          setError(`Preço final com desconto (R$ ${precoFinal.toFixed(2)}) está acima do máximo permitido. Máximo: R$ ${selectedProduct.maximo}`);
        } else {
          setError(`Preço acima do máximo permitido. Máximo: R$ ${selectedProduct.maximo}`);
        }
        return;
      }

      // Se preço FINAL (com ou sem desconto) abaixo do promocional, bloqueia e mostra dialog informativo
      if (precoFinal < promocionalPrice) {
        if (temDesconto) {
          // Cliente tem desconto mas o preço final ainda está abaixo do promocional
          setPromocionalWarningMessage(`Preço final com desconto (R$ ${precoFinal.toFixed(2)}) está abaixo do promocional. Preço Promocional: R$ ${selectedProduct.promocional}`);
        } else {
          // Cliente não tem desconto e o preço solicitado está abaixo do promocional
          setPromocionalWarningMessage(`Preço solicitado (R$ ${priceNum.toFixed(2)}) está abaixo do  preço Promocional: R$ ${selectedProduct.promocional}`);
        }
        setConfirmPromocionalDialogOpen(true);
        return;
      }

      // Se preço FINAL (com desconto) abaixo do mínimo (mas acima do promocional), solicita confirmação
      if (precoFinal < minPrice && !pendingSubmit) {
        setConfirmDialogOpen(true);
        return;
      }
    }

    // Prosseguir com o envio
    await processSubmit();
  }

  // Função para calcular desconto baseado em REDE/SUBREDE + PRODUTO
  function calcularDesconto(cliente: Cliente, produto: Produto, precoSolicitado: string): { discount_percent: string, discounted_price: string } | null {
    console.log('🔍 Calculando desconto para submissão:', {
      cliente: { rede: cliente.rede, subrede: cliente.subrede, codigo: cliente.codigo },
      produto: produto.codigo_produto,
      totalDescontos: descontos.length
    });

    // Usar helper function para buscar desconto
    const descontoAplicavel = findDescontoForClienteProduto(cliente, produto);

    if (!descontoAplicavel) {
      console.log('❌ Nenhum desconto encontrado');
      return null;
    }

    console.log('✅ Desconto encontrado:', descontoAplicavel);

    // Extrair percentual de desconto (ex: "5,00%" -> 5.00)
    const percentualStr = descontoAplicavel.desconto.replace('%', '').replace(',', '.');
    const percentual = parseFloat(percentualStr);

    if (isNaN(percentual) || percentual <= 0) return null;

    // Calcular preço com desconto
    const precoOriginal = parseFloat(precoSolicitado.replace(',', '.'));
    const valorDesconto = precoOriginal * (percentual / 100);
    const precoComDesconto = precoOriginal - valorDesconto;

    return {
      discount_percent: percentual.toFixed(2),
      discounted_price: precoComDesconto.toFixed(2)
    };
  }

  async function processSubmit() {
    setPendingSubmit(false);
    setConfirmDialogOpen(false);
    setLoading(true);

    try {
      if (selectionMode === 'cliente') {
        // Modo individual: envia 1 solicitação para o cliente selecionado
        const descontoInfo = calcularDesconto(selectedCustomer!, selectedProduct!, price);
        
        const req = {
          requester_name: 'Vendedor (frontend)',
          requester_id: '',
          customer_code: selectedCustomer!.codigo,
          customer_name: selectedCustomer!.nome_fantasia,
          product_id: selectedProduct!.codigo_produto,
          product_name: selectedProduct!.nome_produto,
          requested_price: price,
          quantity: quantity,
          product_maximo: selectedProduct!.maximo || '',
          product_minimo: selectedProduct!.minimo || '',
          product_promocional: selectedProduct!.promocional || '',
          currency: 'R$',
          status: 'Pending',
          notes,
          codigo_supervisor: selectedCustomer!.supervisor_code,
          nome_supervisor: selectedCustomer!.supervisor_name,
          ...(descontoInfo && {
            discount_percent: descontoInfo.discount_percent,
            discounted_price: descontoInfo.discounted_price
          })
        };

        const res = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(req)
        });
        
        if (res.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.reload();
          return;
        }
        if (!res.ok) throw new Error('Erro ao enviar solicitação');
        const created = await res.json();
        // Recarregar solicitações do servidor para garantir dados atualizados
        fetchRequests();
        setSuccess('Solicitação registrada com sucesso!');
        
      } else {
        // Modo subrede: envia múltiplas solicitações para todos os clientes da subrede
        const clientesDaSubrede = clientes.filter(c => c.subrede && c.subrede.trim() === selectedSubrede);
        
        if (clientesDaSubrede.length === 0) {
          throw new Error('Nenhum cliente encontrado para esta subrede.');
        }

        // Gerar ID único para agrupar todas as solicitações desta subrede
        const subrede_batch_id = `SUBREDE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        let successCount = 0;
        let errorCount = 0;

        for (const cliente of clientesDaSubrede) {
          try {
            const descontoInfo = calcularDesconto(cliente, selectedProduct!, price);
            
            const req = {
              requester_name: 'Vendedor (frontend)',
              requester_id: '',
              customer_code: cliente.codigo,
              customer_name: cliente.nome_fantasia,
              product_id: selectedProduct!.codigo_produto,
              product_name: selectedProduct!.nome_produto,
              requested_price: price,
              quantity: quantity,
              product_maximo: selectedProduct!.maximo || '',
              product_minimo: selectedProduct!.minimo || '',
              product_promocional: selectedProduct!.promocional || '',
              currency: 'R$',
              status: 'Pending',
              notes: `${notes} [SUBREDE: ${selectedSubrede}]`,
              codigo_supervisor: cliente.supervisor_code,
              nome_supervisor: cliente.supervisor_name,
              subrede_batch_id: subrede_batch_id,
              subrede_name: selectedSubrede,
              ...(descontoInfo && {
                discount_percent: descontoInfo.discount_percent,
                discounted_price: descontoInfo.discounted_price
              })
            };

            const res = await fetch(API_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify(req)
            });

            if (res.status === 401) {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.reload();
              return;
            }

            if (res.ok) {
              successCount++;
            } else {
              errorCount++;
            }
          } catch {
            errorCount++;
          }
        }

        fetchRequests(); // Atualiza lista completa
        setSuccess(`${successCount} solicitações criadas com sucesso para a subrede "${selectedSubrede}"!${errorCount > 0 ? ` (${errorCount} falharam)` : ''}`);
      }

      // Limpar formulário
      setSelectedProduct(null);
      setPrice('');
      setQuantity('');
      setNotes('');
      // Mantém o cliente/subrede selecionado para facilitar múltiplas solicitações
      
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar solicitação para o servidor.');
    } finally {
      setLoading(false);
    }
  }

  const handleConfirmBelowMinPrice = async () => {
    setPendingSubmit(true);
    setConfirmDialogOpen(false);
    await processSubmit();
  };

  const handleCancelBelowMinPrice = () => {
    setConfirmDialogOpen(false);
    setPendingSubmit(false);
  };

  const handleClosePromocionalDialog = () => {
    setConfirmPromocionalDialogOpen(false);
    setPromocionalWarningMessage('');
  };

  // Abrir dialog de cancelamento
  const handleOpenCancelDialog = (requestId: string) => {
    setSelectedRequestForCancel(requestId);
    setCancellationReason('');
    setCancelDialogOpen(true);
  };

  // Cancelar solicitação de cancelamento
  const handleCloseCancelDialog = () => {
    setCancelDialogOpen(false);
    setCancellationReason('');
    setSelectedRequestForCancel(null);
  };

  // Confirmar solicitação de cancelamento
  const handleConfirmCancellation = async () => {
    if (!selectedRequestForCancel) return;
    if (!cancellationReason.trim()) {
      setError('Por favor, informe o motivo do cancelamento.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${selectedRequestForCancel}/request-cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cancellation_reason: cancellationReason })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao solicitar cancelamento');
      }

      setSuccess('Solicitação de cancelamento enviada para aprovação do admin!');
      setTimeout(() => setSuccess(null), 3000);
      setCancelDialogOpen(false);
      setCancellationReason('');
      setSelectedRequestForCancel(null);
      fetchRequests(); // Atualizar lista
    } catch (err: any) {
      setError(err.message || 'Erro ao solicitar cancelamento');
      console.error('[RequestForm] Erro ao solicitar cancelamento:', err);
    }
  };

  // Exporta solicitações para CSV
  function exportCsv() {
    if (requests.length === 0) {
      setError('Nenhuma solicitação para exportar.');
      return;
    }
    setError(null);
    const rows = requests.map((r: any) => [
      r._id || r.id || '',
      r.requester_name,
      r.requester_id || '',
      r.customer_code,
      (r.customer_name || '').replace(/"/g, '""'),
      r.product_id,
      r.requested_price,
      r.currency,
      r.status,
      (r.notes || '').replace(/"/g, '""'),
      r.created_at,
      r.approved_by || '',
      r.approved_at || ''
    ]);
    const csv = rows.map((r: (string | number)[]) => r.map((c: string | number) => `"${c}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'price_requests.csv';
    a.click();
    URL.revokeObjectURL(url);
    setSuccess('Arquivo CSV exportado!');
  }

  // Renderização do componente
  return (
    <Box sx={{ maxWidth: { xs: '100%', sm: 500, md: 600 }, mx: 'auto', p: { xs: 0, sm: 1, md: 2 }, width: '100%' }}>
      {/* Botão Voltar ao Vale Tech */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/vendedor')}
        sx={{ 
          mb: 2, 
          textTransform: 'none', 
          fontWeight: 600,
          fontSize: { xs: '0.85rem', sm: '0.95rem' }
        }}
      >
        Voltar ao Vale Tech
      </Button>

      <Slide in direction="down">
        <Paper elevation={6} sx={{
          p: { xs: 1, sm: 2, md: 3 },
          borderRadius: { xs: 1, sm: 2, md: 4 },
          bgcolor: '#fff',
          mb: { xs: 1.5, sm: 2.5, md: 3 },
          boxShadow: '0 8px 32px 0 rgba(60,72,100,0.10)'
        }}>
          <Stack direction="row" alignItems="center" spacing={{ xs: 0.75, sm: 1.5, md: 2 }} mb={{ xs: 1.25, sm: 1.75, md: 2 }}>
            <PersonIcon color="primary" sx={{ fontSize: { xs: 22, sm: 28, md: 36 } }} />
            <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ fontSize: { xs: '0.9rem', sm: '1.05rem', md: '1.25rem' } }}>Solicitação de Preço</Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1} mb={{ xs: 1.25, sm: 1.75, md: 2 }}>
            <Button
              variant="outlined"
              startIcon={<CalculateIcon />}
              onClick={() => setCalculatorOpen(true)}
              size="small"
              sx={{
                fontSize: { xs: '0.75rem', sm: '0.85rem' },
                fontWeight: 600,
                textTransform: 'none',
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  borderColor: 'primary.dark',
                  bgcolor: 'primary.light',
                  color: 'white'
                }
              }}
            >
              Calculadora de Margem
            </Button>
          </Stack>
          <Divider sx={{ mb: { xs: 1.25, sm: 1.75, md: 2 } }} />
          
          {/* Botões de Toggle */}
          <Stack direction="row" spacing={{ xs: 0.5, sm: 1 }} mb={{ xs: 1.5, sm: 2.5, md: 3 }}>
            <Button
              variant={selectionMode === 'cliente' ? 'contained' : 'outlined'}
              onClick={() => {
                setSelectionMode('cliente');
                setSelectedSubrede(null);
                setSelectedCustomer(null);
              }}
              fullWidth
              size="small"
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                py: { xs: 0.75, sm: 1, md: 1.25 },
                fontWeight: 600
              }}
            >
              CLIENTE
            </Button>
            <Button
              variant={selectionMode === 'subrede' ? 'contained' : 'outlined'}
              onClick={() => {
                setSelectionMode('subrede');
                setSelectedCustomer(null);
                setSelectedSubrede(null);
              }}
              fullWidth
              size="small"
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                py: { xs: 0.75, sm: 1, md: 1.25 },
                fontWeight: 600
              }}
            >
              SUBREDE
            </Button>
          </Stack>

          <form onSubmit={submit} autoComplete="off">
            <Stack spacing={{ xs: 1, sm: 1.5, md: 2 }}>
              {error && <Alert severity="error" sx={{ fontSize: { xs: '0.85rem', sm: '0.875rem' } }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ fontSize: { xs: '0.85rem', sm: '0.875rem' } }}>{success}</Alert>}
              
              {selectionMode === 'cliente' ? (
                <>
                  <Autocomplete
                    options={clientes}
                    getOptionLabel={option => `${option.nome_fantasia} — ${option.codigo}`}
                    value={selectedCustomer}
                    onChange={(_, value) => {
                      setSelectedCustomer(value);
                      setSelectedProduct(null);
                      setPrice('');
                    }}
                    renderInput={params => (
                      <TextField 
                        {...params} 
                        label="Cliente" 
                        required 
                        placeholder="Buscar cliente..." 
                        size="small"
                        sx={{
                          '& .MuiInputBase-root': {
                            fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1rem' }
                          },
                          '& .MuiInputLabel-root': {
                            fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1rem' }
                          }
                        }}
                      />
                    )}
                    isOptionEqualToValue={(option, value) => option.codigo === value.codigo}
                    fullWidth
                  />
                  
                  {selectedCustomer && selectedCustomer.segmento && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        p: 1.5,
                        borderRadius: 1,
                        bgcolor: 'grey.100',
                        border: '1px solid',
                        borderColor: 'grey.300'
                      }}
                    >
                      <LocalOfferIcon 
                        sx={{ 
                          color: 'grey.600',
                          fontSize: '1.2rem'
                        }} 
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'text.secondary',
                            fontSize: '0.75rem',
                            display: 'block',
                            mb: 0.25
                          }}
                        >
                          Segmento
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'text.primary',
                            fontSize: '0.95rem',
                            fontWeight: 500
                          }}
                        >
                          {selectedCustomer.segmento}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </>
              ) : (
                <Autocomplete
                  options={subredes}
                  getOptionLabel={option => option}
                  value={selectedSubrede}
                  onChange={(_, value) => {
                    setSelectedSubrede(value);
                    setSelectedProduct(null);
                    setPrice('');
                  }}
                  renderInput={params => (
                    <TextField 
                      {...params} 
                      label="Subrede" 
                      required 
                      placeholder="Selecionar subrede..." 
                      size="small"
                      sx={{
                        '& .MuiInputBase-root': {
                          fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1rem' }
                        },
                        '& .MuiInputLabel-root': {
                          fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1rem' }
                        }
                      }}
                    />
                  )}
                  fullWidth
                />
              )}
              <Autocomplete
                options={produtos}
                getOptionLabel={option => `${option.nome_produto} — ${option.id}`}
                value={selectedProduct}
                onChange={(_, value) => setSelectedProduct(value)}
                renderInput={params => (
                  <TextField 
                    {...params} 
                    label="Produto" 
                    required 
                    placeholder="Buscar produto..." 
                    size="small"
                    sx={{
                      '& .MuiInputBase-root': {
                        fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1rem' }
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1rem' }
                      }
                    }}
                  />
                )}
                isOptionEqualToValue={(option, value ) => option.id === value.id}
                disabled={selectionMode === 'cliente' ? !selectedCustomer : !selectedSubrede}
                fullWidth
              />
              {selectedProduct && selectedProduct.promocional && selectedProduct.maximo && (
                <Alert severity="info" sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}>
                  Faixa de preço permitida: R$ {selectedProduct.minimo} até R$ {selectedProduct.maximo}
                </Alert>
              )}
              
              {/* Alerta de Preço Abaixo do Mínimo - PRIORIDADE: Aparece primeiro se violado */}
              {precoAbaixoDoMinimo && precoSugeridoMinimo && price && (
                <Alert 
                  severity="error" 
                  icon={<WarningIcon />}
                  sx={{ 
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    '& .MuiAlert-message': {
                      width: '100%'
                    }
                  }}
                >
                  <Stack spacing={0.5}>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                      {precoSugeridoMinimo.temDesconto ? (
                        <>🚨 Preço Sugerido Mínimo (com {precoSugeridoMinimo.percentualDesconto}% desconto): <strong>R$ {precoSugeridoMinimo.valor.toFixed(2)}</strong></>
                      ) : (
                        <>🚨 Preço Sugerido Mínimo  : <strong>R$ {precoSugeridoMinimo.valor.toFixed(2)}</strong></>
                      )}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
                      Preço Mínimo: R$ {precoSugeridoMinimo.precoReferencia.toFixed(2)}
                      {precoSugeridoMinimo.temDesconto && ` (antes do desconto de ${precoSugeridoMinimo.percentualDesconto}%)`}
                    </Typography>
                    <Typography variant="caption" color="error.dark" fontWeight={600} sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' }, mt: 0.5 }}>
                      🚨 O preço digitado está abaixo do {precoSugeridoMinimo.temDesconto ? 'mínimo com desconto' : 'mínimo'}
                    </Typography>
                  </Stack>
                </Alert>
              )}
              
              {/* Alerta de Preço Abaixo do Promocional - REMOVIDO */}

              <TextField
                label="Preço solicitado"
                value={price}
                onChange={e => setPrice(e.target.value)}
                required
                placeholder="0.00"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                disabled={selectionMode === 'cliente' ? !selectedCustomer : !selectedSubrede}
                fullWidth
                size="small"
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1rem' }
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1rem' }
                  }
                }}
              />
              
              {/* Mostrar desconto aplicado em tempo real */}
              {descontoAplicavel && precoComDesconto && (
                <Box sx={{ 
                  p: { xs: 1.5, sm: 2 }, 
                  bgcolor: '#e8f5e9', 
                  borderRadius: { xs: 1, sm: 2 }, 
                  border: '2px solid #4caf50',
                  animation: 'pulse 0.5s ease-in-out'
                }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1} flexWrap="wrap">
                    <LocalOfferIcon color="success" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                    <Typography variant="h6" color="success.main" fontWeight={700} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                      Desconto Aplicado! [V2]
                    </Typography>
                    <Chip 
                      label={`${precoComDesconto.percentual}%`} 
                      color="success" 
                      size="small" 
                      sx={{ fontWeight: 700, fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}
                    />
                  </Stack>
                  <Divider sx={{ mb: 1 }} />
                  <Stack spacing={0.5}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Preço original:</Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>R$ {parseFloat(price.replace(',', '.')).toFixed(2)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="success.main" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Desconto ({precoComDesconto.percentual}%):</Typography>
                      <Typography variant="body2" color="success.main" fontWeight={600} sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>- R$ {precoComDesconto.valorDesconto.toFixed(2)}</Typography>
                    </Box>
                    <Divider />
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body1" fontWeight={700} sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>Preço final:</Typography>
                      <Typography variant="h6" color="success.main" fontWeight={700} sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>R$ {precoComDesconto.precoFinal.toFixed(2)}</Typography>
                    </Box>
                  </Stack>
                  {descontoAplicavel.rede && (
                    <Typography variant="caption" color="text.secondary" display="block" mt={1} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                      💼 Desconto da rede: {descontoAplicavel.rede}
                    </Typography>
                  )}
                  {descontoAplicavel.subrede && (
                    <Typography variant="caption" color="text.secondary" display="block" mt={1} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                      🏪 Desconto da subrede: {descontoAplicavel.subrede}
                    </Typography>
                  )}
                </Box>
              )}

              <TextField
                label="Quantidade"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                required
                placeholder="1"
                type="number"
                inputProps={{ min: 1, step: 1 }}
                disabled={selectionMode === 'cliente' ? !selectedCustomer : !selectedSubrede}
                fullWidth
                size="small"
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1rem' }
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1rem' }
                  }
                }}
              />
              <TextField
                label="Justificativa"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                multiline
                minRows={2}
                fullWidth
                size="small"
                required
                helperText={
                  !notes.trim() 
                    ? 'Justificativa é obrigatória (mínimo 10 caracteres)' 
                    : notes.trim().length < 10 
                    ? `Mínimo 10 caracteres (${notes.trim().length}/10)` 
                    : ''
                }
                error={!notes.trim() || notes.trim().length < 10}
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1rem' }
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1rem' }
                  }
                }}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                endIcon={<SendIcon sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }} />}
                disabled={
                  (selectionMode === 'cliente' ? !selectedCustomer : !selectedSubrede) ||
                  !selectedProduct ||
                  !price || isNaN(Number(price)) || Number(price) <= 0 ||
                  !quantity || isNaN(Number(quantity)) || Number(quantity) <= 0 ||
                  !notes.trim() || notes.trim().length < 10 ||
                  loading
                }
                fullWidth
                sx={{ 
                  fontWeight: 700, 
                  borderRadius: { xs: 1.5, sm: 2 }, 
                  py: { xs: 1.25, sm: 1.5 }, 
                  fontSize: { xs: '0.85rem', sm: '1rem', md: '1.125rem' },
                  minHeight: { xs: 48, sm: 52 }
                }}
              >
                {loading ? 'Enviando...' : 'Enviar solicitação'}
              </Button>
            </Stack>
          </form>
        </Paper>
      </Slide>
      <Slide in direction="up">
        <Paper elevation={3} sx={{
          p: { xs: 1.5, sm: 2, md: 3 },
          borderRadius: { xs: 2, sm: 3, md: 4 },
          bgcolor: '#f7fafc',
          mb: 2,
          boxShadow: '0 4px 16px 0 rgba(60,72,100,0.07)'
        }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={{ xs: 1.5, sm: 2 }} flexWrap="wrap" gap={1}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <ShoppingCartIcon color="primary" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
              <Typography variant="subtitle1" fontWeight={700} color="primary.main" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>Minhas Solicitações</Typography>
            </Stack>
            <IconButton onClick={exportCsv} color="success" size="small" sx={{ p: { xs: 0.5, sm: 1 } }}>
              <DownloadIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
            </IconButton>
          </Stack>
          {loading ? (
            <Typography color="text.secondary">Carregando solicitações...</Typography>
          ) : (
            <Stack spacing={{ xs: 1, sm: 1.5 }}>
              {requests.length === 0 && <Typography color="text.secondary" sx={{ fontSize: { xs: '0.85rem', sm: '0.875rem' } }}>Nenhuma solicitação registrada.</Typography>}
              {requests.map((r: any) => (
                <Box key={r._id || r.id} sx={{
                  p: { xs: 1, sm: 1.5 },
                  border: 
                    r.status === 'Cancelado' ? '2px solid #000' :
                    r.status === 'Alterado' ? '2px solid #2196f3' : 
                    r.status === 'Aprovado' || r.status === 'Aprovado pela Gerência' ? '2px solid #4caf50' : 
                    r.status === 'Reprovado' || r.status === 'Reprovado pela Gerência' ? '2px solid #f44336' :
                    r.status === 'Aguardando Gerência' ? '2px solid #ff9800' :
                    '1px solid #e3e6f0',
                  borderRadius: { xs: 1, sm: 2 },
                  mb: 1,
                  bgcolor: 
                    r.status === 'Cancelado' ? '#000' :
                    r.status === 'Alterado' ? '#bbdefb' : 
                    r.status === 'Aprovado' || r.status === 'Aprovado pela Gerência' ? '#c8e6c9' : 
                    r.status === 'Reprovado' || r.status === 'Reprovado pela Gerência' ? '#ffcdd2' :
                    r.status === 'Aguardando Gerência' ? '#fff3e0' :
                    '#fff',
                  boxShadow: '0 2px 8px 0 rgba(60,72,100,0.04)'
                }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={{ xs: 0.5, sm: 0 }}>
                    <Typography variant="subtitle2" fontWeight={600} color={r.status === 'Cancelado' ? 'white' : 'primary.main'} sx={{ fontSize: { xs: '0.85rem', sm: '0.875rem' } }}>
                      {r.customer_name}
                    </Typography>
                    {r.status === 'Alterado' && (
                      <Typography variant="caption" sx={{ bgcolor: '#2196f3', color: 'white', px: { xs: 0.75, sm: 1 }, py: { xs: 0.4, sm: 0.5 }, borderRadius: 1, fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                        ✓ ALTERADO
                      </Typography>
                    )}
                    {(r.status === 'Aprovado' || r.status === 'Aprovado pela Gerência') && (
                      <Typography variant="caption" sx={{ bgcolor: '#4caf50', color: 'white', px: { xs: 0.75, sm: 1 }, py: { xs: 0.4, sm: 0.5 }, borderRadius: 1, fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                        ✓ APROVADO
                      </Typography>
                    )}
                    {(r.status === 'Reprovado' || r.status === 'Reprovado pela Gerência') && (
                      <Typography variant="caption" sx={{ bgcolor: '#f44336', color: 'white', px: { xs: 0.75, sm: 1 }, py: { xs: 0.4, sm: 0.5 }, borderRadius: 1, fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                        ✗ REPROVADO
                      </Typography>
                    )}
                    {r.status === 'Aguardando Gerência' && (
                      <Typography variant="caption" sx={{ bgcolor: '#ff9800', color: 'white', px: { xs: 0.75, sm: 1 }, py: { xs: 0.4, sm: 0.5 }, borderRadius: 1, fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                        ⏳ AGUARDANDO GERÊNCIA
                      </Typography>
                    )}
                    {r.status === 'Pending' && (
                      <Typography variant="caption" sx={{ bgcolor: '#9e9e9e', color: 'white', px: { xs: 0.75, sm: 1 }, py: { xs: 0.4, sm: 0.5 }, borderRadius: 1, fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                        ⏱ PENDENTE
                      </Typography>
                    )}
                    {r.status === 'Cancelado' && (
                      <Typography variant="caption" sx={{ bgcolor: '#000', color: 'white', px: { xs: 0.75, sm: 1 }, py: { xs: 0.4, sm: 0.5 }, borderRadius: 1, fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                        ✗ CANCELADO
                      </Typography>
                    )}
                  </Stack>
                  <Typography variant="body2" color={r.status === 'Cancelado' ? 'white' : 'text.secondary'} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, mt: { xs: 0.5, sm: 0 } }}>
                    Produto: <b>{r.product_name || r.product_id}</b> — Preço: <b>R$ {Number(r.requested_price).toFixed(2)}</b> — Qtd: <b>{r.quantity || '—'}</b>
                  </Typography>
                  <Typography variant="caption" color={r.status === 'Cancelado' ? 'rgba(255,255,255,0.7)' : 'text.secondary'} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                    {new Date(r.created_at).toLocaleString()} {r.notes && `— ${r.notes}`}
                  </Typography>
                  {r.status === 'Reprovado' && r.approved_by && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#d32f2f', fontWeight: 600, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                      Motivo: {r.notes}
                    </Typography>
                  )}
                  {r.status !== 'Cancelado' && !r.cancellation_requested && (
                    <Box 
                      onClick={() => handleOpenCancelDialog(r._id || r.id)}
                      sx={{ 
                        mt: 1.5,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        fontSize: { xs: '0.7rem', sm: '0.75rem' },
                        color: '#666',
                        cursor: 'pointer',
                        transition: 'color 0.2s',
                        '&:hover': {
                          color: '#d32f2f'
                        }
                      }}
                    >
                      <CancelIcon sx={{ fontSize: '0.875rem' }} />
                      Solicitar cancelamento
                    </Box>
                  )}
                  {r.cancellation_requested && r.status !== 'Cancelado' && (
                    <Chip
                      label="Cancelamento Pendente"
                      size="small"
                      color="warning"
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>
              ))}
            </Stack>
          )}
        </Paper>
      </Slide>

      {/* Dialog de Confirmação para Preço Abaixo do Mínimo */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCancelBelowMinPrice}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          Confirmar Preço Abaixo do Mínimo
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            O preço solicitado <strong>R$ {price}</strong> está abaixo do preço mínimo permitido 
            <strong> R$ {selectedProduct?.minimo}</strong>.
          </DialogContentText>
          <DialogContentText sx={{ mt: 2 }}>
            Esta solicitação será encaminhada para aprovação do supervisor e gerência.
          </DialogContentText>
          <DialogContentText sx={{ mt: 2, fontWeight: 600, color: 'warning.main' }}>
            Deseja confirmar e enviar esta solicitação?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelBelowMinPrice} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmBelowMinPrice} 
            variant="contained" 
            color="warning"
            autoFocus
          >
            Confirmar e Enviar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Aviso para Preço Abaixo do Promocional (Bloqueio) */}
      <Dialog
        open={confirmPromocionalDialogOpen}
        onClose={handleClosePromocionalDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="error" />
          Preço Abaixo do Promocional - Bloqueado
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {promocionalWarningMessage}
          </DialogContentText>
          <DialogContentText sx={{ mt: 2, fontWeight: 600, color: 'error.main' }}>
            Esta solicitação não pode ser enviada. Por favor, ajuste o preço para um valor igual ou acima do promocional.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleClosePromocionalDialog} 
            variant="contained" 
            color="primary"
            autoFocus
          >
            Entendido
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Solicitação de Cancelamento */}
      <Dialog
        open={cancelDialogOpen}
        onClose={handleCloseCancelDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CancelIcon color="error" />
          Solicitar Cancelamento
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Por favor, informe o motivo do cancelamento desta solicitação. 
            A solicitação será enviada para aprovação do administrador.
          </DialogContentText>
          <TextField
            autoFocus
            required
            fullWidth
            multiline
            rows={4}
            label="Motivo do Cancelamento"
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            placeholder="Descreva o motivo do cancelamento..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelDialog} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmCancellation} 
            variant="contained" 
            color="error"
            disabled={!cancellationReason.trim()}
            startIcon={<CancelIcon />}
          >
            Confirmar Cancelamento
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal da Calculadora de Margem */}
      <Dialog
        open={calculatorOpen}
        onClose={() => setCalculatorOpen(false)}
        maxWidth="sm"
        fullWidth
        scroll="body"
        PaperProps={{
          sx: {
            borderRadius: 3,
            m: { xs: 1, sm: 2 },
            maxHeight: { xs: '95vh', sm: '90vh' },
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: 'primary.main',
          color: 'white',
          fontSize: { xs: '1.1rem', sm: '1.4rem' },
          fontWeight: 600,
          py: { xs: 2, sm: 2.5 },
          px: { xs: 2, sm: 3 },
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5
        }}>
          <CalculateIcon sx={{ fontSize: { xs: 24, sm: 32 } }} />
          Calculadora de Margem
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2, px: { xs: 2, sm: 3 }, overflow: 'visible' }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Custo"
              value={calcCusto}
              onChange={(e) => handleCalcCustoChange(e.target.value)}
              type="number"
              placeholder="0.00"
              inputProps={{ min: 0, step: 0.01 }}
              fullWidth
              size="small"
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: ultimosCampos.includes('custo') ? '#fff3e0' : 'white',
                  transition: 'all 0.3s ease',
                  fontSize: '1.05rem',
                  '&:hover': {
                    backgroundColor: ultimosCampos.includes('custo') ? '#ffe0b2' : '#f5f5f5',
                  },
                  '&.Mui-focused': {
                    backgroundColor: ultimosCampos.includes('custo') ? '#ffcc80' : 'white',
                  }
                },
                '& .MuiInputLabel-root': {
                  fontSize: '1rem',
                  '&.Mui-focused': {
                    color: ultimosCampos.includes('custo') ? '#e65100' : 'primary.main',
                    fontWeight: ultimosCampos.includes('custo') ? 600 : 400,
                  }
                }
              }}
            />

            <TextField
              label="Margem de lucro"
              value={calcMargem}
              onChange={(e) => handleCalcMargemChange(e.target.value)}
              type="number"
              placeholder="0"
              inputProps={{ min: 0, max: 99.99, step: 0.01 }}
              fullWidth
              size="small"
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: ultimosCampos.includes('margem') ? '#fff3e0' : 'white',
                  transition: 'all 0.3s ease',
                  fontSize: '1.05rem',
                  '&:hover': {
                    backgroundColor: ultimosCampos.includes('margem') ? '#ffe0b2' : '#f5f5f5',
                  },
                  '&.Mui-focused': {
                    backgroundColor: ultimosCampos.includes('margem') ? '#ffcc80' : 'white',
                  }
                },
                '& .MuiInputLabel-root': {
                  fontSize: '1rem',
                  '&.Mui-focused': {
                    color: ultimosCampos.includes('margem') ? '#e65100' : 'primary.main',
                    fontWeight: ultimosCampos.includes('margem') ? 600 : 400,
                  }
                }
              }}
            />

            <TextField
              label="Mark up"
              value={calcMarkup}
              onChange={(e) => handleCalcMarkupChange(e.target.value)}
              type="number"
              placeholder="0"
              inputProps={{ min: 0, step: 0.01 }}
              fullWidth
              size="small"
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: ultimosCampos.includes('markup') ? '#fff3e0' : '#e3f2fd',
                  transition: 'all 0.3s ease',
                  fontSize: '1.05rem',
                  '&:hover': {
                    backgroundColor: ultimosCampos.includes('markup') ? '#ffe0b2' : '#bbdefb',
                  },
                  '&.Mui-focused': {
                    backgroundColor: ultimosCampos.includes('markup') ? '#ffcc80' : '#90caf9',
                  }
                },
                '& .MuiInputLabel-root': {
                  fontSize: '1rem',
                  '&.Mui-focused': {
                    color: ultimosCampos.includes('markup') ? '#e65100' : '#1976d2',
                    fontWeight: ultimosCampos.includes('markup') ? 600 : 400,
                  }
                }
              }}
            />

            <TextField
              label="Renda (Preço de Venda)"
              value={calcRenda}
              onChange={(e) => handleCalcRendaChange(e.target.value)}
              type="number"
              placeholder="0.00"
              inputProps={{ min: 0, step: 0.01 }}
              fullWidth
              size="small"
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: ultimosCampos.includes('renda') ? '#fff3e0' : '#e8f5e9',
                  transition: 'all 0.3s ease',
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: ultimosCampos.includes('renda') ? '#ffe0b2' : '#c8e6c9',
                  },
                  '&.Mui-focused': {
                    backgroundColor: ultimosCampos.includes('renda') ? '#ffcc80' : '#a5d6a7',
                  }
                },
                '& .MuiInputLabel-root': {
                  fontSize: '1rem',
                  '&.Mui-focused': {
                    color: ultimosCampos.includes('renda') ? '#e65100' : '#2e7d32',
                    fontWeight: ultimosCampos.includes('renda') ? 600 : 400,
                  }
                }
              }}
            />

            <TextField
              label="Lucro"
              value={calcLucro}
              onChange={(e) => handleCalcLucroChange(e.target.value)}
              type="number"
              placeholder="0.00"
              inputProps={{ min: 0, step: 0.01 }}
              fullWidth
              size="small"
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: ultimosCampos.includes('lucro') ? '#fff3e0' : '#e1f5fe',
                  transition: 'all 0.3s ease',
                  fontSize: '1.05rem',
                  '&:hover': {
                    backgroundColor: ultimosCampos.includes('lucro') ? '#ffe0b2' : '#b3e5fc',
                  },
                  '&.Mui-focused': {
                    backgroundColor: ultimosCampos.includes('lucro') ? '#ffcc80' : '#81d4fa',
                  }
                },
                '& .MuiInputLabel-root': {
                  fontSize: '1rem',
                  '&.Mui-focused': {
                    color: ultimosCampos.includes('lucro') ? '#e65100' : '#0277bd',
                    fontWeight: ultimosCampos.includes('lucro') ? 600 : 400,
                  }
                }
              }}
            />

            {/* Indicador visual dos campos fixos */}
            {ultimosCampos.length >= 2 && (
              <Box sx={{ 
                mt: 1, 
                p: 2, 
                backgroundColor: '#fff3e0',
                borderRadius: 2,
                border: '2px solid #ff9800',
              }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#e65100', mb: 0.5 }}>
                  📌 Campos Fixos (Base do Cálculo):
                </Typography>
                <Typography variant="body2" sx={{ color: '#ef6c00' }}>
                  {ultimosCampos.map(c => 
                    c === 'custo' ? 'Custo' :
                    c === 'margem' ? 'Margem de lucro' :
                    c === 'markup' ? 'Mark up' :
                    c === 'renda' ? 'Renda' : 'Lucro'
                  ).join(' + ')}
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button 
            onClick={limparCalculadora}
            variant="outlined"
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.95rem'
            }}
          >
            🗑️ Limpar
          </Button>
          <Button 
            onClick={() => setCalculatorOpen(false)} 
            variant="contained"
            color="primary"
            sx={{ 
              borderRadius: 2,
              fontSize: '0.95rem',
            }}
          >
            ✓ Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

