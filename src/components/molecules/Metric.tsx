
const Metric = () => {
  const metrics = [
    { value: "12", suffix: "+", label: "Trading Strategies" },
    { value: "0", suffix: "%", label: "Platform Fee" },
    { value: "100", suffix: "%", label: "Self-Custody" },
  ];

  return (
    <div className="bg-[#0d120c]">
      <div className="container px-4 py-16 mx-auto md:px-7 lg:px-12">
        <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-3">
          {metrics.map((metric, index) => (
            <div key={index} className="flex flex-col flex-wrap items-center">
              <div className="flex items-baseline">
                <h1 className="text-[3rem] font-bold text-white">
                  {metric.value}
                </h1>
                <h1 className="text-[3rem] font-bold text-white">
                  {metric.suffix}
                </h1>
              </div>
              <div className="mt-2">
                <p className="text-gray-500">{metric.label}</p>
              </div>
            </div>
          ))}

          {/* Shape/Icon */}
         
        </div>
      </div>
    </div>
  );
};

export default Metric;
