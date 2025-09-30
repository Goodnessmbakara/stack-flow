const Loader = () => {
  return (
    <div className="flex gap-1">
      <div className="w-3 h-3 bg-white/80 rounded-full animate-[flash_0.5s_ease-out_infinite_alternate]" />
      <div className="w-3 h-3 bg-white/80 rounded-full animate-[flash_0.5s_ease-out_infinite_alternate] delay-200" />
    </div>
  );
};

export default Loader;
