import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';

interface ScoreGaugeProps {
  score: number;
  label: string;
}

const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, label }) => {
  // Dynamic color and glow based on score
  const getColor = (score: number) => {
    if (score >= 80) return { color: '#34d399', glow: 'shadow-[0_0_20px_#34d399]' }; // Green
    if (score >= 50) return { color: '#fbbf24', glow: 'shadow-[0_0_20px_#fbbf24]' }; // Yellow
    return { color: '#f87171', glow: 'shadow-[0_0_20px_#f87171]' }; // Red
  };

  const { color, glow } = getColor(score);
  const data = [{ name: 'score', value: score, fill: color }];

  return (
    <div
      className={`relative bg-gradient-to-br from-slate-800/80 via-slate-900/80 to-black/80 
                  border border-slate-700/70 rounded-2xl p-6 flex flex-col items-center 
                  justify-center text-center transition-all duration-500 hover:scale-105 hover:shadow-xl ${glow}`}
    >
      {/* Chart Section */}
      <div className="w-full h-36 relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="70%"
            outerRadius="90%"
            data={data}
            startAngle={180}
            endAngle={0}
            barSize={14}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              background={{ fill: '#1e293b' }}
              dataKey="value"
            />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* Center Score */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center">
          <span
            className="text-4xl font-extrabold drop-shadow-md transition-all duration-500"
            style={{ color }}
          >
            {score}
          </span>
          <span className="text-xs text-slate-400">/ 100</span>
        </div>
      </div>

      {/* Label */}
      <p className="text-sm font-semibold text-slate-200 mt-3 tracking-wide uppercase">
        {label}
      </p>
    </div>
  );
};

export default ScoreGauge;