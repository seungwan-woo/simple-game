interface ImportStatusBadgeProps {
  isLoading: boolean;
  loaded: number;
  total: number;
}

export const ImportStatusBadge = ({ isLoading, loaded, total }: ImportStatusBadgeProps) => {
  if (total === 0) {
    return <span className="import-status idle">No CSV loaded</span>;
  }

  return (
    <span className={`import-status ${isLoading ? 'loading' : 'complete'}`}>
      {isLoading ? '⏳ 로딩 중...' : '✅ 로딩 완료'} {loaded} / {total}
    </span>
  );
};
