import React from 'react';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export const AreaChartComp = ({ data, dataKey = "value", xKey = "name", color = "#3B82F6" }) => (
  <ResponsiveContainer width="100%" height={300}>
    <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={color} stopOpacity={0.1}/>
          <stop offset="95%" stopColor={color} stopOpacity={0}/>
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
      <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} />
      <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} />
      <Tooltip 
        contentStyle={{ 
          backgroundColor: 'var(--bg)', 
          border: '1px solid var(--border)', 
          borderRadius: '1rem',
          boxShadow: 'var(--shadow-lg)'
        }} 
      />
      <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
    </AreaChart>
  </ResponsiveContainer>
);

export const BarChartComp = ({ data, dataKey = "value", xKey = "name", color = "#3B82F6" }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
      <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} />
      <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} />
      <Tooltip 
        cursor={{fill: 'var(--bg-subtle)'}}
        contentStyle={{ 
          backgroundColor: 'var(--bg)', 
          border: '1px solid var(--border)', 
          borderRadius: '1rem'
        }} 
      />
      <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} barSize={40} />
    </BarChart>
  </ResponsiveContainer>
);

export const DonutChartComp = ({ data }) => (
  <ResponsiveContainer width="100%" height={300}>
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        innerRadius={60}
        outerRadius={80}
        paddingAngle={5}
        dataKey="value"
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip 
        contentStyle={{ 
          backgroundColor: 'var(--bg)', 
          border: '1px solid var(--border)', 
          borderRadius: '1rem'
        }} 
      />
      <Legend verticalAlign="bottom" height={36}/>
    </PieChart>
  </ResponsiveContainer>
);

export const FunnelChartComp = ({ data }) => {
  const maxVal = Math.max(...data.map(d => d.value));
  
  return (
    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {data.map((step, idx) => (
        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>{step.name}</span>
            <span>{step.value}</span>
          </div>
          <div style={{ 
            height: '32px', 
            background: 'var(--bg-subtle)', 
            borderRadius: '4px', 
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(step.value / maxVal) * 100}%` }}
              style={{ 
                height: '100%', 
                background: COLORS[idx % COLORS.length],
                opacity: 0.8,
                borderRadius: '4px'
              }}
            />
          </div>
          {idx < data.length - 1 && (
             <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {Math.round((data[idx+1].value / step.value) * 100)}% conversion
             </div>
          )}
        </div>
      ))}
    </div>
  );
};
