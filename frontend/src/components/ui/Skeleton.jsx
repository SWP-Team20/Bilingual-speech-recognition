import { colors, radius } from '../../theme';

// Shimmering placeholder block.
export function Skeleton({ height = '16px', width = '100%', style = {} }) {
  return (
    <div
      style={{
        height,
        width,
        borderRadius: radius.sm,
        background: `linear-gradient(90deg, #ececec 25%, #f5f5f5 37%, #ececec 63%)`,
        backgroundSize: '400% 100%',
        animation: 'skeletonShimmer 1.4s ease infinite',
        ...style,
      }}
    />
  );
}

// A skeleton shaped like one audio row card.
export function AudioRowSkeleton() {
  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      <style>{`@keyframes skeletonShimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }`}</style>
      <Skeleton width="160px" height="14px" style={{ marginBottom: '8px' }} />
      <div style={{ backgroundColor: colors.surface, padding: '14px', borderRadius: radius.md, border: `1px solid ${colors.border}`, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Skeleton width="40px" height="40px" style={{ borderRadius: '50%', flexShrink: 0 }} />
        <Skeleton width="70px" height="14px" style={{ flexShrink: 0 }} />
        <Skeleton height="22px" style={{ flex: 1 }} />
        <Skeleton width="40px" height="40px" style={{ flexShrink: 0 }} />
      </div>
    </div>
  );
}
