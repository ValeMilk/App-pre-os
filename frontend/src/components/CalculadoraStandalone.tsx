import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Stack, Dialog, DialogTitle, DialogContent, DialogActions, Container, Paper, InputAdornment } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CalculateIcon from '@mui/icons-material/Calculate';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function CalculadoraStandalone() {
  const navigate = useNavigate();
  
  const [calcCusto, setCalcCusto] = useState('');
  const [calcMargem, setCalcMargem] = useState('');
  const [calcMarkup, setCalcMarkup] = useState('');
  const [calcRenda, setCalcRenda] = useState('');
  const [calcLucro, setCalcLucro] = useState('');
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
    valores[campo] = parseFloat(valor);

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
    setUltimosCampos([]);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/vendedor')}
        sx={{ mb: 3, textTransform: 'none', fontWeight: 600 }}
      >
        Voltar ao Vale Tech
      </Button>

      <Paper 
        elevation={3}
        sx={{ 
          borderRadius: 3,
          overflow: 'hidden'
        }}
      >
        <Box sx={{ 
          bgcolor: 'success.main',
          color: 'white',
          p: 4,
          textAlign: 'center'
        }}>
          <CalculateIcon sx={{ fontSize: 60, mb: 1 }} />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Calculadora de Margem
          </Typography>
          <Typography variant="body1" sx={{ mt: 1, opacity: 0.9 }}>
            Digite em 2 campos e os outros serão calculados automaticamente
          </Typography>
        </Box>

        <Box sx={{ p: 4 }}>
          <Stack spacing={3}>
            <TextField
              label="Custo"
              value={calcCusto}
              onChange={(e) => handleCalcCustoChange(e.target.value)}
              type="number"
              placeholder="0.00"
              inputProps={{ min: 0, step: 0.01 }}
              fullWidth
              size="medium"
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: ultimosCampos.includes('custo') ? '#fff3e0' : 'white',
                  transition: 'all 0.3s ease',
                  fontSize: '1.1rem',
                  '&:hover': {
                    backgroundColor: ultimosCampos.includes('custo') ? '#ffe0b2' : '#f5f5f5',
                  },
                  '&.Mui-focused': {
                    backgroundColor: ultimosCampos.includes('custo') ? '#ffcc80' : 'white',
                  }
                },
                '& .MuiInputLabel-root': {
                  fontSize: '1.05rem',
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
              size="medium"
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: ultimosCampos.includes('margem') ? '#fff3e0' : 'white',
                  transition: 'all 0.3s ease',
                  fontSize: '1.1rem',
                  '&:hover': {
                    backgroundColor: ultimosCampos.includes('margem') ? '#ffe0b2' : '#f5f5f5',
                  },
                  '&.Mui-focused': {
                    backgroundColor: ultimosCampos.includes('margem') ? '#ffcc80' : 'white',
                  }
                },
                '& .MuiInputLabel-root': {
                  fontSize: '1.05rem',
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
              size="medium"
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: ultimosCampos.includes('markup') ? '#fff3e0' : '#e3f2fd',
                  transition: 'all 0.3s ease',
                  fontSize: '1.1rem',
                  '&:hover': {
                    backgroundColor: ultimosCampos.includes('markup') ? '#ffe0b2' : '#bbdefb',
                  },
                  '&.Mui-focused': {
                    backgroundColor: ultimosCampos.includes('markup') ? '#ffcc80' : '#90caf9',
                  }
                },
                '& .MuiInputLabel-root': {
                  fontSize: '1.05rem',
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
              size="medium"
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: ultimosCampos.includes('renda') ? '#fff3e0' : '#e8f5e9',
                  transition: 'all 0.3s ease',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: ultimosCampos.includes('renda') ? '#ffe0b2' : '#c8e6c9',
                  },
                  '&.Mui-focused': {
                    backgroundColor: ultimosCampos.includes('renda') ? '#ffcc80' : '#a5d6a7',
                  }
                },
                '& .MuiInputLabel-root': {
                  fontSize: '1.05rem',
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
              size="medium"
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: ultimosCampos.includes('lucro') ? '#fff3e0' : '#e1f5fe',
                  transition: 'all 0.3s ease',
                  fontSize: '1.1rem',
                  '&:hover': {
                    backgroundColor: ultimosCampos.includes('lucro') ? '#ffe0b2' : '#b3e5fc',
                  },
                  '&.Mui-focused': {
                    backgroundColor: ultimosCampos.includes('lucro') ? '#ffcc80' : '#81d4fa',
                  }
                },
                '& .MuiInputLabel-root': {
                  fontSize: '1.05rem',
                  '&.Mui-focused': {
                    color: ultimosCampos.includes('lucro') ? '#e65100' : '#0277bd',
                    fontWeight: ultimosCampos.includes('lucro') ? 600 : 400,
                  }
                }
              }}
            />

            {ultimosCampos.length >= 2 && (
              <Box sx={{ 
                mt: 1, 
                p: 2.5, 
                backgroundColor: '#fff3e0',
                borderRadius: 2,
                border: '2px solid #ff9800',
              }}>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#e65100', mb: 0.5 }}>
                  📌 Campos Fixos (Base do Cálculo):
                </Typography>
                <Typography variant="body1" sx={{ color: '#ef6c00', fontWeight: 500 }}>
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

          <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
            <Button 
              onClick={limparCalculadora}
              variant="outlined"
              fullWidth
              size="medium"
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem'
              }}
            >
              🗑️ Limpar Tudo
            </Button>
            <Button 
              onClick={() => navigate('/vendedor')}
              variant="contained"
              color="success"
              fullWidth
              size="medium"
              sx={{ 
                borderRadius: 2,
                fontSize: '1rem',
              }}
            >
              ✓ Voltar ao Menu
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
