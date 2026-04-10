import React from 'react';
import CalendarView from '../components/CalendarView';

const Calendar = () => {
  return (
    <div style={{ padding: '2.5rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Agenda Collaboratif</h1>
        <p style={{ color: 'var(--text-muted)' }}>Visualisez et planifiez vos rendez-vous, réunions et tâches de production.</p>
      </div>
      
      <CalendarView />
    </div>
  );
};

export default Calendar;
