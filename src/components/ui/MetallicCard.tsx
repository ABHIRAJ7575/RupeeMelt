import React from 'react';
import { Card, styled } from '@mui/material';
import type { CardProps } from '@mui/material/Card';

const StyledCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.8))',
  boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.2)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  borderTop: '1px solid rgba(255, 255, 255, 0.12)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)', // Safari support
  borderRadius: theme.shape.borderRadius,
  position: 'relative',
  overflow: 'hidden',
  transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1)',

  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
  },
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 12px 40px rgba(0,0,0,0.06)',
  }
}));

export const MetallicCard: React.FC<CardProps> = (props) => {
  return <StyledCard {...props} />;
};
