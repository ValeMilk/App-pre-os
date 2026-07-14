import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

interface StatusHistoryItem {
  status: string;
  timestamp: string;
  changed_by?: string;
}

interface Props {
  statusHistory?: StatusHistoryItem[];
  createdAt?: string;
}

const statusColorMap: { [key: string]: 'success' | 'error' | 'warning' | 'info' | 'default' } = {
  'Pendente': 'info',
  'Aguardando Gerência': 'warning',
  'Aprovado': 'success',
  'Reprovado': 'error',
  'Aprovado pela Gerência': 'success',
  'Reprovado pela Gerência': 'error',
  'Alterado': 'warning',
  'Cancelado': 'error',
};

const statusIconMap: { [key: string]: React.ReactNode } = {
  'Pendente': <HourglassEmptyIcon />,
  'Aguardando Gerência': <HourglassEmptyIcon />,
  'Aprovado': <CheckCircleIcon />,
  'Reprovado': <CancelIcon />,
  'Aprovado pela Gerência': <CheckCircleIcon />,
  'Reprovado pela Gerência': <CancelIcon />,
  'Alterado': <EditIcon />,
  'Cancelado': <CancelIcon />,
};

export default function StatusHistoryDialog({ statusHistory, createdAt }: Props) {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const formatTime = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const calculateDuration = (from: string | undefined, to: string | undefined) => {
    if (!from || !to) return 'N/A';
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const diffMs = toDate.getTime() - fromDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins}min`;
    }
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return `${diffHours}h ${diffMins % 60}min`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ${(diffHours % 24)}h`;
  };

  const history = statusHistory || [];

  return (
    <>
      <IconButton
        size="small"
        onClick={handleOpen}
        title="Ver histórico de status"
        sx={{ ml: 1 }}
      >
        <InfoIcon fontSize="small" />
      </IconButton>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Histórico de Status</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {history.length === 0 ? (
            <Typography color="text.secondary" align="center">
              Nenhum histórico disponível
            </Typography>
          ) : (
            <Timeline>
              {history.map((item, index) => (
                <TimelineItem key={index}>
                  <TimelineOppositeContent color="text.secondary" sx={{ flex: 0.15 }}>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                      {formatTime(item.timestamp)}
                    </Typography>
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot
                      sx={{
                        bgcolor: statusColorMap[item.status] === 'success' ? '#4caf50' : 
                                 statusColorMap[item.status] === 'error' ? '#f44336' : 
                                 statusColorMap[item.status] === 'warning' ? '#ff9800' : '#2196f3'
                      }}
                    >
                      {statusIconMap[item.status]}
                    </TimelineDot>
                    {index < history.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent sx={{ flex: 1.5 }}>
                    <Box>
                      <Chip
                        label={item.status}
                        size="small"
                        variant="outlined"
                        color={statusColorMap[item.status]}
                        sx={{ mb: 0.5 }}
                      />
                      {item.changed_by && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          por {item.changed_by}
                        </Typography>
                      )}
                      {index > 0 && history[index - 1].timestamp && (
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                          ⏱️ {calculateDuration(history[index - 1].timestamp, item.timestamp)}
                        </Typography>
                      )}
                    </Box>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          )}
          <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="caption" display="block" fontWeight={600} mb={0.5}>
              📅 Data: {formatDate(createdAt)}
            </Typography>
            {history.length > 0 && (
              <>
                <Typography variant="caption" display="block" fontWeight={600} mb={0.5}>
                  ⏱️ Tempo Total: {calculateDuration(createdAt, history[history.length - 1].timestamp)}
                </Typography>
                <Typography variant="caption" display="block" fontWeight={600}>
                  📊 Etapas: {history.length}
                </Typography>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
