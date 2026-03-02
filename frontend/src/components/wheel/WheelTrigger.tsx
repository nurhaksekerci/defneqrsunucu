'use client';

import { useEffect, useState } from 'react';
import { WheelGame } from './WheelGame';
import api from '@/lib/api';

export function WheelTrigger() {
  const [showWheel, setShowWheel] = useState(false);
  const [canSpin, setCanSpin] = useState<boolean | null>(null);
  const [config, setConfig] = useState<{ enabled: boolean } | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const [configRes, canSpinRes] = await Promise.all([
          api.get('/wheel/config'),
          api.get('/wheel/can-spin')
        ]);
        const cfg = configRes.data.data;
        const cs = canSpinRes.data.data;
        setConfig(cfg);
        setCanSpin(cs.canSpin);
        if (cfg?.enabled && cs.canSpin) {
          const dismissed = sessionStorage.getItem('wheelDismissed');
          if (!dismissed) setShowWheel(true);
        }
      } catch {
        setConfig({ enabled: false });
        setCanSpin(false);
      }
    };
    check();
  }, []);

  const handleClose = () => {
    setShowWheel(false);
    sessionStorage.setItem('wheelDismissed', '1');
  };

  if (!config?.enabled || canSpin === null) return null;
  if (!showWheel) {
    if (canSpin) {
      return (
        <button
          onClick={() => setShowWheel(true)}
          className="fixed bottom-20 right-6 z-40 p-3 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg transition-all animate-bounce"
          title="Şansını Dene!"
        >
          <span className="text-2xl">🎡</span>
        </button>
      );
    }
    return null;
  }

  return <WheelGame onClose={handleClose} />;
}
