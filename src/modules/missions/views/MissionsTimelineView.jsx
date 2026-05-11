import React, { useMemo, useRef } from 'react';
import { projectTimeline, PRIORITY_META, statusColor } from '../engine/transforms';

// ── Constants ─────────────────────────────────────────────────────────────────

const ROW_H = 38;      // px per row
const LABEL_W = 220;   // px for left label column
const DAY_W = 28;      // px per day cell
const HEADER_H = 56;   // px for date header

// ── Date helpers ──────────────────────────────────────────────────────────────

const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => new Date(d.getTime() + n * 86_400_000);
const diffDays = (a, b) => Math.round((startOfDay(b) - startOfDay(a)) / 86_400_000);

const FR_MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const FR_DAYS   = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

// ── Build date range covering all cards + 7d padding each side ────────────────

function buildDateRange(cards) {
  const today = startOfDay(new Date());
  if (!cards.length) {
    return { start: addDays(today, -7), days: 60 };
  }
  const min = cards.reduce((m, c) => (c._start < m ? c._start : m), cards[0]._start);
  const max = cards.reduce((m, c) => (c._end   > m ? c._end   : m), cards[0]._end);
  const start = addDays(startOfDay(min), -7);
  const end   = addDays(startOfDay(max),  7);
  const days  = Math.max(30, diffDays(start, end));
  return { start, days };
}

// ── SVG Gantt bar ─────────────────────────────────────────────────────────────

const GanttBar = ({ card, rowIdx, start, onCardClick }) => {
  const barLeft   = diffDays(start, card._start) * DAY_W;
  const barWidth  = Math.max(DAY_W, diffDays(card._start, card._end) * DAY_W);
  const y         = rowIdx * ROW_H + ROW_H * 0.2;
  const height    = ROW_H * 0.6;
  const color     = statusColor(card.status);
  const pct       = card.completionPct;
  const rx        = 4;

  return (
    <g
      onClick={() => onCardClick?.(card)}
      style={{ cursor: 'pointer' }}
    >
      {/* Background bar */}
      <rect
        x={barLeft}
        y={y}
        width={barWidth}
        height={height}
        rx={rx}
        fill={color + '30'}
        stroke={color}
        strokeWidth={1.5}
      />
      {/* Progress fill */}
      {pct > 0 && (
        <rect
          x={barLeft}
          y={y}
          width={Math.min(barWidth, barWidth * pct / 100)}
          height={height}
          rx={rx}
          fill={color + '80'}
        />
      )}
      {/* Label inside bar */}
      {barWidth > 50 && (
        <text
          x={barLeft + 6}
          y={y + height / 2 + 1}
          dominantBaseline="middle"
          fontSize={10}
          fontWeight={600}
          fill={color}
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          {card.title.length > Math.floor(barWidth / 7) - 2
            ? card.title.slice(0, Math.floor(barWidth / 7) - 2) + '…'
            : card.title}
        </text>
      )}
    </g>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

export default function MissionsTimelineView({ cards: rawCards = [], onCardClick }) {
  const svgRef = useRef(null);
  const today  = useMemo(() => startOfDay(new Date()), []);

  // Project & sort cards with startDate/endDate
  const cards = useMemo(() => projectTimeline(rawCards), [rawCards]);
  const { start, days } = useMemo(() => buildDateRange(cards), [cards]);

  const svgW = days * DAY_W;
  const svgH = HEADER_H + cards.length * ROW_H + 16;

  // Today marker position
  const todayX = diffDays(start, today) * DAY_W;

  // Generate day array
  const dayArr = useMemo(() => Array.from({ length: days }, (_, i) => addDays(start, i)), [start, days]);

  // Group days by month for header
  const monthGroups = useMemo(() => {
    const groups = [];
    let cur = null;
    dayArr.forEach((d, i) => {
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!cur || cur.key !== key) {
        cur = { key, label: `${FR_MONTHS[d.getMonth()]} ${d.getFullYear()}`, startI: i, count: 1 };
        groups.push(cur);
      } else {
        cur.count++;
      }
    });
    return groups;
  }, [dayArr]);

  return (
    <div style={{ flex: 1, overflow: 'auto', display: 'flex' }}>
      {/* ── Left: row labels ── */}
      <div style={{
        width: LABEL_W, flexShrink: 0, borderRight: '1px solid var(--border)',
        position: 'sticky', left: 0, zIndex: 10, background: 'var(--bg)',
      }}>
        {/* Header spacer */}
        <div style={{ height: HEADER_H, borderBottom: '1px solid var(--border)' }} />

        {/* Row labels */}
        {cards.length === 0 ? (
          <div style={{
            padding: '2rem', color: 'var(--text-muted)',
            fontSize: '0.83rem', textAlign: 'center',
          }}>
            Aucune mission avec date dans les filtres actifs.
          </div>
        ) : (
          cards.map(card => (
            <div
              key={card.id}
              onClick={() => onCardClick?.(card)}
              style={{
                height: ROW_H, display: 'flex', alignItems: 'center',
                padding: '0 0.75rem', gap: '0.5rem',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer', overflow: 'hidden',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Priority dot */}
              <div style={{
                width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                background: PRIORITY_META[card.priority]?.color ?? '#9CA3AF',
              }} />
              <span style={{
                fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                flex: 1,
              }}>
                {card.title}
              </span>
              {/* Assignee mini avatars */}
              {card.assignees.slice(0, 2).map(a => (
                <div key={a.uid} title={a.name} style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                  background: a.color, color: 'white', fontSize: '0.55rem',
                  fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {a.initials}
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* ── Right: SVG Gantt ── */}
      <div style={{ overflow: 'auto', flex: 1 }}>
        <svg
          ref={svgRef}
          width={svgW}
          height={svgH}
          style={{ display: 'block' }}
        >
          {/* ── Month header ── */}
          {monthGroups.map(mg => (
            <g key={mg.key}>
              <rect
                x={mg.startI * DAY_W}
                y={0}
                width={mg.count * DAY_W}
                height={26}
                fill="var(--bg-subtle)"
                stroke="var(--border)"
                strokeWidth={0.5}
              />
              <text
                x={mg.startI * DAY_W + (mg.count * DAY_W) / 2}
                y={16}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={11}
                fontWeight={700}
                fill="var(--text)"
                style={{ userSelect: 'none' }}
              >
                {mg.label}
              </text>
            </g>
          ))}

          {/* ── Day headers ── */}
          {dayArr.map((d, i) => {
            const isToday = diffDays(today, d) === 0;
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            return (
              <g key={i}>
                {/* Column background */}
                <rect
                  x={i * DAY_W}
                  y={26}
                  width={DAY_W}
                  height={svgH - 26}
                  fill={isToday ? 'var(--accent)08' : isWeekend ? 'var(--bg-subtle)' : 'transparent'}
                />
                {/* Day label */}
                <text
                  x={i * DAY_W + DAY_W / 2}
                  y={43}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={9}
                  fontWeight={isToday ? 900 : 400}
                  fill={isToday ? 'var(--accent)' : isWeekend ? 'var(--text-muted)' : 'var(--text-muted)'}
                  style={{ userSelect: 'none' }}
                >
                  {d.getDate()}
                </text>
                {/* Grid line */}
                <line
                  x1={i * DAY_W}
                  y1={HEADER_H}
                  x2={i * DAY_W}
                  y2={svgH}
                  stroke="var(--border)"
                  strokeWidth={0.5}
                />
              </g>
            );
          })}

          {/* ── Row lines ── */}
          {cards.map((_, i) => (
            <line
              key={i}
              x1={0}
              y1={HEADER_H + i * ROW_H}
              x2={svgW}
              y2={HEADER_H + i * ROW_H}
              stroke="var(--border)"
              strokeWidth={0.5}
            />
          ))}

          {/* ── Gantt bars ── */}
          <g transform={`translate(0, ${HEADER_H})`}>
            {cards.map((card, i) => (
              <GanttBar
                key={card.id}
                card={card}
                rowIdx={i}
                start={start}
                onCardClick={onCardClick}
              />
            ))}
          </g>

          {/* ── Today marker ── */}
          {todayX >= 0 && todayX <= svgW && (
            <g>
              <line
                x1={todayX}
                y1={26}
                x2={todayX}
                y2={svgH}
                stroke="var(--accent)"
                strokeWidth={2}
                strokeDasharray="4 3"
              />
              <polygon
                points={`${todayX - 5},26 ${todayX + 5},26 ${todayX},34`}
                fill="var(--accent)"
              />
              <text
                x={todayX + 6}
                y={34}
                fontSize={9}
                fontWeight={700}
                fill="var(--accent)"
                style={{ userSelect: 'none' }}
              >
                Auj.
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
