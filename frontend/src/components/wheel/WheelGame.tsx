'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';

interface WheelSegment {
  label: string;
  type: string;
  value: number | string;
  color: string;
}

interface WheelConfig {
  enabled: boolean;
  title?: string;
  description?: string;
  segments?: WheelSegment[];
}

interface CanSpinResponse {
  canSpin: boolean;
  reason?: string;
}

export function WheelGame({ onClose }: { onClose: () => void }) {
  const [config, setConfig] = useState<WheelConfig | null>(null);
  const [canSpin, setCanSpin] = useState<boolean | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [prize, setPrize] = useState<{ type: string; value: number | string; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      const res = await api.get('/wheel/config');
      setConfig(res.data.data);
    } catch {
      setConfig({ enabled: false });
    }
  }, []);

  const checkCanSpin = useCallback(async () => {
    try {
      const res = await api.get('/wheel/can-spin');
      const data: CanSpinResponse = res.data.data;
      setCanSpin(data.canSpin);
    } catch {
      setCanSpin(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
    checkCanSpin();
  }, [loadConfig, checkCanSpin]);

  const handleSpin = async () => {
    if (!canSpin || isSpinning || !config?.segments?.length) return;
    setError(null);
    setIsSpinning(true);
    try {
      const res = await api.post('/wheel/spin');
      const { prize: wonPrize, segmentIndex } = res.data.data;
      const segments = config.segments!;
      const segmentAngle = 360 / segments.length;
      const targetAngle = 360 - segmentIndex * segmentAngle - segmentAngle / 2;
      const spins = 5;
      const totalRotation = rotation + spins * 360 + targetAngle;
      setRotation(totalRotation);
      await new Promise((r) => setTimeout(r, 4000));
      setPrize(wonPrize);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Bir hata oluştu');
    } finally {
      setIsSpinning(false);
    }
  };

  if (!config || !config.enabled) return null;
  if (canSpin === false && !prize) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{config.title}</h3>
          <p className="text-gray-600 mb-4">
            {canSpin === false ? 'Bugün zaten çevirdiniz. Yarın tekrar deneyin!' : config.description}
          </p>
          <Button onClick={onClose}>Kapat</Button>
        </div>
      </div>
    );
  }

  const segments = config.segments || [];
  const segmentAngle = segments.length ? 360 / segments.length : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{config.title}</h3>
            {config.description && (
              <p className="text-sm text-gray-600 mt-1">{config.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Kapat"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {prize ? (
          <div className="text-center py-8">
            <div className="text-2xl font-bold text-primary-600 mb-2">🎉 Tebrikler!</div>
            <p className="text-lg text-gray-900 mb-4">
              {prize.type === 'subscription_days' && prize.value
                ? `${prize.label} - Premium denemeniz başladı!`
                : prize.label}
            </p>
            <Button onClick={onClose}>Kapat</Button>
          </div>
        ) : (
          <>
            <div className="relative mx-auto mb-6" style={{ width: 280, height: 280 }}>
              <div
                className="relative w-full h-full rounded-full border-4 border-gray-300 overflow-hidden"
                style={{
                  background: `conic-gradient(${segments
                    .map((seg, i) => `${seg.color} ${i * segmentAngle}deg ${(i + 1) * segmentAngle}deg`)
                    .join(', ')})`,
                  transform: `rotate(${rotation}deg)`,
                  transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
                }}
              >
                {segments.map((seg, i) => (
                  <div
                    key={i}
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      transform: `rotate(${i * segmentAngle + segmentAngle / 2}deg)`,
                      transformOrigin: '50% 50%'
                    }}
                  >
                    <span
                      className="text-xs font-bold text-white text-center block"
                      style={{
                        transform: `rotate(${-i * segmentAngle - segmentAngle / 2}deg)`,
                        width: 70,
                        textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                      }}
                    >
                      {seg.label}
                    </span>
                  </div>
                ))}
              </div>
              <div
                className="absolute top-1/2 left-1/2 w-4 h-4 rounded-full bg-gray-800 border-2 border-white -translate-x-1/2 -translate-y-1/2 z-10"
                style={{ pointerEvents: 'none' }}
              />
              <div
                className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[24px] border-l-transparent border-r-transparent border-t-red-500 z-20"
                style={{ pointerEvents: 'none' }}
              />
            </div>

            {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}

            <Button
              onClick={handleSpin}
              disabled={isSpinning || !canSpin}
              className="w-full"
            >
              {isSpinning ? 'Çevriliyor...' : 'Çevir'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
