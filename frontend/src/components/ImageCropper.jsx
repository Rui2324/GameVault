// src/components/ImageCropper.jsx
import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../utils/cropUtils";

// Botão Retro local para não dar erro de imports
function RetroButton({ children, onClick, color = "cyan", className="" }) {
  const colors = {
    cyan: "border-cyan-400 bg-cyan-50 text-cyan-600 dark:bg-cyan-400/20 dark:text-cyan-400 hover:bg-cyan-400 hover:text-slate-900 shadow-[2px_2px_0px_0px_rgba(34,211,238,0.6)]",
    rose: "border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 hover:bg-rose-500 hover:text-white shadow-[2px_2px_0px_0px_rgba(244,63,94,0.6)]",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-2 font-bold px-4 py-2 text-sm uppercase transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${colors[color]} ${className}`}
    >
      {children}
    </button>
  );
}

export default function ImageCropper({ imageSrc, onCancel, onCropComplete }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropChange = (crop) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom) => {
    setZoom(zoom);
  };

  const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImageBlob);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border-2 border-fuchsia-500 w-full max-w-lg flex flex-col shadow-[0_0_40px_rgba(217,70,239,0.3)]">
        
        {/* Cabeçalho */}
        <div className="p-4 border-b-2 border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
          <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-2">
            <span className="text-fuchsia-500">✂️</span> Ajustar Imagem
          </h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-rose-500 font-bold transition-colors">✕</button>
        </div>

        {/* Área de Corte */}
        <div className="relative h-80 w-full bg-[#1a1a1a]">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1} // Força o quadrado (1:1)
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteHandler}
            showGrid={true}
            cropShape="rect" // Podes mudar para "round" se quiseres ver círculo
            style={{
                containerStyle: { backgroundColor: "#0f172a" },
                cropAreaStyle: { border: "2px solid #22d3ee", boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.7)" }
            }}
          />
        </div>

        {/* Controlos */}
        <div className="p-6 space-y-6 bg-white dark:bg-slate-900">
          <div>
            <div className="flex justify-between mb-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Zoom</label>
                <span className="text-xs font-mono text-cyan-500">{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-800 accent-fuchsia-500 hover:accent-fuchsia-400"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t-2 border-slate-100 dark:border-slate-800">
            <RetroButton onClick={onCancel} color="rose">Cancelar</RetroButton>
            <RetroButton onClick={handleSave} color="cyan">Guardar Corte</RetroButton>
          </div>
        </div>
      </div>
    </div>
  );
}