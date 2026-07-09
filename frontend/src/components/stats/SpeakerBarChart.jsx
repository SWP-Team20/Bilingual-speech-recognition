import HorizontalBarChart from './HorizontalBarChart';

/** Speaker / date bars — horizontal preview + expand. */
function SpeakerBarChart({ items = [], displayMode = 'count', total = 0, title = 'Статистика', toolbar = null }) {
  return (
    <HorizontalBarChart
      items={items}
      displayMode={displayMode}
      total={total}
      title={title}
      showLanguageLegend={false}
      toolbar={toolbar}
    />
  );
}

export default SpeakerBarChart;
