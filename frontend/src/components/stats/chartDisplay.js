export function getChartDisplayValue(count, displayMode, total) {
  if (displayMode === 'percent') {
    return total > 0 ? (count / total) * 100 : 0;
  }
  return count;
}

export function formatChartLabel(count, displayMode, total) {
  if (displayMode === 'percent') {
    const pct = total > 0 ? (count / total) * 100 : 0;
    return `${pct.toFixed(1)}%`;
  }
  return String(count);
}

export function formatChartTitle(label, count, displayMode, total) {
  if (displayMode === 'percent') {
    const pct = total > 0 ? (count / total) * 100 : 0;
    return `${label} · ${pct.toFixed(1)}% (${count})`;
  }
  return `${label} · ${count}`;
}
