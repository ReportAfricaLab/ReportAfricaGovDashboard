'use client';
import { useState, useEffect } from 'react';

export function useJurisdiction() {
  const [country, setCountry] = useState('NG');
  const [state, setState] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const check = () => {
      const gov = (window as any).__govUser;
      const j = (window as any).__govJurisdiction;
      if (j?.country) setCountry(j.country);
      if (j?.state) setState(j.state);
      if (gov?.role === 'super_admin' || gov?.role === 'admin') setIsAdmin(true);
      if (gov) setLoaded(true);
    };
    check();
    const interval = setInterval(check, 500);
    if (loaded) clearInterval(interval);
    return () => clearInterval(interval);
  }, [loaded]);

  return { country, state, isAdmin, loaded };
}
