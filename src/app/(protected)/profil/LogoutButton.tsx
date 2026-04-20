'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { logout } from '@/actions/auth';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
  const handleLogout = async () => {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
      await logout();
    }
  };

  return (
    <Button 
      variant="danger" 
      fullWidth 
      onClick={handleLogout} 
      style={{ 
        border: 'none', 
        background: 'transparent', 
        color: 'var(--danger)', 
        justifyContent: 'flex-start', 
        padding: '1rem',
        fontWeight: '600'
      }}
    >
      <LogOut size={20} style={{ marginRight: '1rem' }} /> Oturumu Kapat
    </Button>
  );
}
