'use client';

import { motion } from 'motion/react';

const regions = [
  // { id: 2, name: 'Árboles', x: '68%', y: '16%', color: '#FF6B6B' },
  // { id: 3, name: 'Grafos', x: '25%', y: '28%', color: '#00D2D3' },
  // { id: 4, name: 'Pilas y Colas', x: '65%', y: '40%', color: '#FF4444' },
  // { id: 5, name: 'Estructuras de Datos', x: '28%', y: '52%', color: '#7B68EE' },
  // { id: 6, name: 'Funciones', x: '68%', y: '65%', color: '#00A3FF' },
  // { id: 7, name: 'Control de Flujo', x: '25%', y: '78%', color: '#FF9600' },
  { id: 1, name: 'Fundamentos', x: '29%', y: '25%', color: '#58CC02' },
  { id: 2, name: 'Control de Flujo', x: '44%', y: '34%', color: '#FF6B6B' },
  { id: 3, name: 'Funciones', x: '38%', y: '44%', color: '#00D2D3' },
  { id: 8, name: 'OIA', x: '65%', y: '90%', color: '#F7D44A' },
];

const pathD = `
  M 25 6
  C 48 9, 55 12, 68 16
  C 48 20, 38 24, 25 28
  C 48 32, 55 36, 65 40
  C 48 44, 40 48, 28 52
  C 50 56, 55 60, 68 65
  C 45 70, 40 74, 25 78
  C 50 82, 55 86, 65 90
`;

export default function PathMarkers() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path
          d={pathD}
          stroke="#94a3b8"
          strokeWidth="0.4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="2 1.5"
          opacity="0.5"
        />
      </svg>
      {regions.map((region, i) => (
        <motion.div
          key={region.id}
          className="absolute pointer-events-auto"
          style={{ left: region.x, top: region.y }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 + i * 0.08, duration: 0.4, ease: 'easeOut' }}
        >
          <motion.div
            className="group relative flex items-center justify-center"
            animate={{
              boxShadow: [
                `0 0 0 0 ${region.color}40`,
                `0 0 0 8px ${region.color}10`,
                `0 0 0 0 ${region.color}40`,
              ],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
          >
            <div
              className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-white text-xs md:text-sm font-bold shadow-md border-2 border-white/80"
              style={{ backgroundColor: region.color }}
            >
              {region.id}
            </div>
            <div
              className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-2 py-0.5 rounded-md text-xs font-semibold text-white pointer-events-none"
              style={{ backgroundColor: region.color }}
            >
              {region.name}
            </div>
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}
