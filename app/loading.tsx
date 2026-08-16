export default function Loading() {
  return (
    <div
      className="site-container min-h-[65vh] py-16"
      aria-label="Загрузка страницы"
    >
      <div className="h-3 w-28 animate-pulse bg-black/10" />
      <div className="mt-7 h-24 max-w-3xl animate-pulse bg-black/10" />
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="aspect-[4/5] animate-pulse bg-black/10" />
        ))}
      </div>
    </div>
  );
}
