import { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { createFx } from '../lib/fx';

const FxContext = createContext(null);
export const useFx = () => useContext(FxContext);

// Cria o canvas de efeitos (fogos e confete) e distribui o motor para as telas.
export function FxProvider({ children }) {
  const canvasRef = useRef(null);
  const fx = useMemo(() => createFx(), []);

  useEffect(() => {
    fx.attach(canvasRef.current);
    return () => fx.detach();
  }, [fx]);

  return (
    <FxContext.Provider value={fx}>
      <canvas ref={canvasRef} className="fx" aria-hidden="true" />
      {children}
    </FxContext.Provider>
  );
}
