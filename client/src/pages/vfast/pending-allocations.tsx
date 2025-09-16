import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function PendingAllocationsRedirect() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation('/vfast/allocation-dashboard');
  }, []);

  return null;
}