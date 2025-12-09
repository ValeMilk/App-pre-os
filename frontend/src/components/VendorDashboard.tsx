import React from 'react';
import { Box, Card, CardContent, Typography, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import CalculateIcon from '@mui/icons-material/Calculate';

interface VendorDashboardProps {
  userName: string;
}

export default function VendorDashboard({ userName }: VendorDashboardProps) {
  const navigate = useNavigate();

  const apps = [
    {
      id: 'solicitacao-precos',
      title: 'Solicitação de Preços',
      description: 'Solicitar aprovação de preços especiais',
      icon: RequestQuoteIcon,
      color: '#006FAD', // Azul 300C principal
      route: '/vendedor/solicitacao-precos'
    },
    {
      id: 'calculadora',
      title: 'Calculadora de Margem',
      description: 'Calcular margem, markup e lucro',
      icon: CalculateIcon,
      color: '#28A745', // Verde sucesso
      route: '/vendedor/calculadora'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 5, textAlign: 'center' }}>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 700,
            color: 'primary.main',
            mb: 1,
            fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
          }}
        >
          Bem-vindo ao Vale Hub
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
          Olá, {userName}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Escolha uma das ferramentas abaixo
        </Typography>
      </Box>

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(2, 1fr)' },
        gap: 4,
        maxWidth: 800,
        mx: 'auto'
      }}>
        {apps.map((app) => {
          const IconComponent = app.icon;
          return (
            <Card
              key={app.id}
              onClick={() => navigate(app.route)}
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 6,
                },
                borderRadius: 3,
                overflow: 'hidden',
                border: `2px solid ${app.color}15`,
              }}
            >
              <Box
                sx={{
                  background: app.color,
                  height: 140,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: -50,
                    right: -50,
                    width: 150,
                    height: 150,
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '50%',
                  }
                }}
              >
                <IconComponent 
                  sx={{ 
                    fontSize: 80, 
                    color: 'white',
                    filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.2))'
                  }} 
                />
              </Box>
              <CardContent sx={{ p: 3 }}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 700, 
                    mb: 1.5,
                    fontSize: { xs: '1.25rem', sm: '1.5rem' }
                  }}
                >
                  {app.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {app.description}
                </Typography>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          💡 Mais ferramentas serão adicionadas em breve
        </Typography>
      </Box>
    </Container>
  );
}
