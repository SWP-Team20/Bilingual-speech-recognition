import HorizontalBarChart from './HorizontalBarChart';

/** Words / language bars — horizontal preview + expand. */
function VerticalBarChart({ items = [], displayMode = 'count', total = 0, title = 'Частые слова', toolbar = null }) {
  return (
    <HorizontalBarChart
      items={items}
      displayMode={displayMode}
      total={total}
      title={title}
      showLanguageLegend
      toolbar={toolbar}
    />
  );
}

export default VerticalBarChart;
