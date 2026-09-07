import React from 'react';
import { Card, styled } from '@mui/material';
import type { CardProps } from '@mui/material/Card';

const StyledCard = styled(Card)(({ theme }) => ({
  width: '100%',
  maxWidth: '100%',
  boxSizing: 'border-box',
  backgroundColor: '#141923',
  border: '1px solid #1E2638',
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
  borderRadius: theme.shape.borderRadius,
  position: 'relative',
  overflow: 'hidden',
  transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1)',

  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 10px -1px rgba(0, 0, 0, 0.6)',
  }
}));

export const MetallicCard: React.FC<CardProps> = (props) => {
  return <StyledCard {...props} />;
};
