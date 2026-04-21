import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip as RTCooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const TrelloDashboard = ({ tasks, project }) => {
  // Stats calculations
  const columnsData = useMemo(() => {
    return project?.colonnes?.map(c => ({
      name: c.title,
      value: tasks.filter(t => t.colonneId === c.id).length
    })) || [];
  }, [tasks, project]);

  const prioriteData = useMemo(() => {
    const counts = { 'Haute': 0, 'Moyenne': 0, 'Basse': 0 };
    tasks.forEach(t => { if(counts[t.priorite] !== undefined) counts[t.priorite]++; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [tasks]);
  
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h4 style={{ color: 'var(--text-muted)', margin: '0 0 0.5rem 0' }}>Total des tâches</h4>
          <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{tasks.length}</div>
        </div>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h4 style={{ color: 'var(--text-muted)', margin: '0 0 0.5rem 0' }}>Tâches Terminées</h4>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#10B981' }}>
            {columnsData[columnsData.length - 1]?.value || 0}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Bar Chart 1 */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: '350px' }}>
           <h3 style={{ margin: '0 0 1rem 0' }}>Cartes par liste</h3>
           <ResponsiveContainer width="100%" height="90%">
              <BarChart data={columnsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <RTCooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}/>
                <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
           </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: '350px' }}>
           <h3 style={{ margin: '0 0 1rem 0' }}>Priorités</h3>
           <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie data={prioriteData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {prioriteData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <RTCooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}/>
              </PieChart>
           </ResponsiveContainer>
           <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '-1rem' }}>
              {prioriteData.map((entry, idx) => (
                 <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                   <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[idx % COLORS.length] }}/>
                   {entry.name} ({entry.value})
                 </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default TrelloDashboard;
