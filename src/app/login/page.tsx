'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/actions/auth';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import styles from './Login.module.css';
import { KeyRound, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await login(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className={styles.container}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Card glass className={styles.loginCard}>
          <div className={styles.logoContainer}>
            <span className={styles.logoIcon}>🕌</span>
            <h1 className={styles.title}>Namazdayım</h1>
            <p className={styles.subtitle}>Sisteme giriş yapın</p>
          </div>

          <CardContent>
            <form onSubmit={handleSubmit} className={styles.form}>
              {error && <div className={styles.errorAlert}>{error}</div>}
              
              <div className={styles.inputGroup}>
                <User className={styles.inputIcon} size={20} />
                <Input 
                  name="username" 
                  placeholder="Kullanıcı Adı" 
                  required 
                  autoComplete="username"
                  className={styles.inputWithIcon}
                />
              </div>
              
              <div className={styles.inputGroup}>
                <KeyRound className={styles.inputIcon} size={20} />
                <Input 
                  type="password" 
                  name="password" 
                  placeholder="Şifre" 
                  required 
                  autoComplete="current-password"
                  className={styles.inputWithIcon}
                />
              </div>

              <label className={styles.rememberMeContainer}>
                <input type="checkbox" name="remember" />
                <span>Beni Hatırla</span>
              </label>

              <Button type="submit" fullWidth disabled={loading} size="lg" className={styles.loginBtn}>
                {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
      
      <div className={styles.decorativeBg}></div>
    </div>
  );
}
