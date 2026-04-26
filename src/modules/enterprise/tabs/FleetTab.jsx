import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Truck, Fuel, Wrench, Calendar, MapPin, 
  ChevronRight, Plus, Search, Filter, 
  Activity, BarChart3, TrendingUp, AlertTriangle,
  CheckCircle2, Info, Gauge
} from 'lucide-react';
import KpiCard from '../../../components/KpiCard';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, scale: 0.98 }, show: { opacity: 1, scale: 1 } };

const FleetTab = ({ data, formatCurrency, onOpenDetail }) => {
  const fleet = data?.fleet || { vehicles: [], maintenance: [] };
  const { vehicles, maintenance } = fleet;

  const fleetStats = useMemo(() => {
    const totalKm = vehicles.reduce((s, v) => s + (v.odo || 0), 0);
    const inService = vehicles.filter(v => v.status === 'En service').length;
    const maintenanceCosts = maintenance.reduce((s, m) => s + (m.cost || 0), 0);
    const avgConsumption = 12.5; // Mock L/100km
    return { totalKm, inService, maintenanceCosts, avgConsumption };
  }, [vehicles, maintenance]);

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Fleet Excellence KPIs */}
      <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '1.5rem' }}>
        <KpiCard title="Disponibilité Fleet" value={`${Math.round((fleetStats.inService / vehicles.length) * 100 || 0)}%`} trend={0} trendType="up" icon={<Activity size={22} />} color="#0D9488" sparklineData={[]} />
        <KpiCard title="Consommation Moy." value={`${fleetStats.avgConsumption} L/100`} trend={0} trendType="down" icon={<Fuel size={22} />} color="#6366F1" sparklineData={[]} />
        <KpiCard title="Kilométrage Total" value={`${(fleetStats.totalKm / 1000).toFixed(1)}k KM`} trend={0} trendType="up" icon={<Gauge size={22} />} color="#8B5CF6" sparklineData={[]} />
        <KpiCard title="Coût Maintenance YTD" value={formatCurrency(fleetStats.maintenanceCosts, true)} trend={0} trendType="up" icon={<Wrench size={22} />} color="#F59E0B" sparklineData={[]} />
      </motion.div>

      {/* Vehicles Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <div>
              <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem' }}>Parc Automobile Actif</h3>
              <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Suivi télémétrique et opérationnel de vos actifs mobiles.</p>
           </div>
           <button 
             onClick={() => onOpenDetail && onOpenDetail(null, 'fleet', 'vehicles')}
             className="btn-primary" style={{ padding: '0.7rem 1.75rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900, background: '#0D9488', borderColor: '#0D9488', cursor: 'pointer' }}>
              <Plus size={20} /> Nouveau Véhicule
           </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: '1.5rem' }}>
           {vehicles.map(v => (
             <motion.div 
               key={v.id} 
               variants={item}
               whileHover={{ y: -5 }}
               onClick={() => onOpenDetail(v, 'fleet', 'vehicles')}
               className="glass"
               style={{ padding: '1.5rem', borderRadius: '1.75rem', border: '1px solid var(--border)', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
             >
                <div style={{ position: 'absolute', top: 0, right: 0, width: '4px', height: '100%', background: v.status === 'En service' ? '#10B981' : '#EF4444' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                   <div style={{ background: 'var(--bg-subtle)', padding: '10px', borderRadius: '0.8rem', color: 'var(--accent)' }}>
                      <Truck size={20} />
                   </div>
                   <div style={{ 
                      padding: '4px 10px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase',
                      background: v.status === 'En service' ? '#10B98115' : '#EF444415', 
                      color: v.status === 'En service' ? '#10B981' : '#EF4444'
                   }}>
                      {v.status}
                   </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                   <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 900 }}>{v.name}</h4>
                   <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>{v.plate}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1rem', marginBottom: '1.25rem' }}>
                   <div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Chauffeur</div>
                      <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{v.driver}</div>
                   </div>
                   <div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Localisation</div>
                      <div style={{ fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} color="#0D9488" /> {v.location}
                      </div>
                   </div>
                </div>

                <div style={{ padding: '0.8rem', borderRadius: '1rem', background: 'var(--bg-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 800 }}>
                      <Gauge size={14} color="var(--text-muted)" /> {v.odo.toLocaleString()} KM
                   </div>
                   <ChevronRight size={16} color="var(--accent)" />
                </div>
             </motion.div>
           ))}
        </div>
      </div>

      {/* Maintenance History & Smart Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '1.5rem' }}>
         <motion.div variants={item} className="glass" style={{ padding: '2rem', borderRadius: '2.5rem', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
               <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem' }}>Journal de Maintenance</h4>
               <button onClick={() => alert('Affichage de l\'historique complet...')} className="glass" style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
                  Voir Tout l'Historique
               </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)', borderRadius: '1.25rem', overflow: 'hidden', border: '1px solid var(--border)' }}>
               {maintenance.slice(0, 4).map((m, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 100px', padding: '1.25rem', background: 'var(--bg)', alignItems: 'center' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--bg-subtle)' }}><Wrench size={16} /></div>
                        <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{m.vehicle}</div>
                     </div>
                     <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{m.type}</div>
                     <div style={{ fontWeight: 900, fontSize: '0.9rem' }}>{formatCurrency(m.cost, true)}</div>
                     <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#10B981', fontWeight: 900, fontSize: '0.7rem', textTransform: 'uppercase' }}>{m.status}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{m.date}</div>
                     </div>
                  </div>
               ))}
            </div>
         </motion.div>

         <motion.div variants={item} className="glass" style={{ padding: '2.5rem', borderRadius: '2.5rem', border: '1px solid var(--border)', background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', color: 'white', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#0D9488', fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '1px' }}>
               <AlertTriangle size={16} /> Alertes Flotte
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
               <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)' }}><CheckCircle2 size={18} color="#10B981" /></div>
                  <div>
                     <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>Contrôle Technique Valide</div>
                     <p style={{ margin: '4px 0 0 0', fontSize: '0.7rem', opacity: 0.6 }}>95% de la flotte est en conformité réglementaire.</p>
                  </div>
               </div>
               
               <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)' }}><Wrench size={18} color="#F59E0B" /></div>
                  <div>
                     <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>Maintenance Imminente</div>
                     <p style={{ margin: '4px 0 0 0', fontSize: '0.7rem', opacity: 0.6 }}>2 Camions de livraison (CE-034/035) approchent de la révision des 100k KM.</p>
                  </div>
               </div>
            </div>

            <div style={{ marginTop: '2rem', padding: '1.5rem', borderRadius: '1.5rem', background: '#0D948820', border: '1px solid #0D948830' }}>
               <div style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', color: '#0D9488', marginBottom: '8px' }}>Efficacité Carburant</div>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>-12% <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Coût/KM</span></div>
                  <TrendingUp size={24} color="#10B981" />
               </div>
            </div>
         </motion.div>
      </div>
    </motion.div>
  );
};

export default FleetTab;
