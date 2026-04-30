const DAYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

function fmt(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const p = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return m ? `${hr}:${String(m).padStart(2, '0')}${p}` : `${hr}${p}`;
}

export function getOpenStatus(operatingHours) {
  if (!operatingHours || Object.keys(operatingHours).length === 0) return null;
  const now = new Date();
  const h = operatingHours[DAYS[now.getDay()]];
  if (!h) return null;
  if (h.closed) return { isOpen: false, label: 'Closed today' };

  const [oH, oM] = (h.open || '').split(':').map(Number);
  const [cH, cM] = (h.close || '').split(':').map(Number);
  if (isNaN(oH) || isNaN(cH)) return null;

  const cur = now.getHours() * 60 + now.getMinutes();
  const open = oH * 60 + oM;
  const close = cH * 60 + cM;

  if (cur >= open && cur < close) {
    const left = close - cur;
    return { isOpen: true, label: left <= 60 ? `Closes ${fmt(h.close)}` : 'Open Now' };
  }
  return { isOpen: false, label: `Opens ${fmt(h.open)}` };
}

export const DEFAULT_HOURS = () => {
  const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  return Object.fromEntries(days.map((d) => [d, { closed: false, open: '10:00', close: '22:00' }]));
};
