import shape_icon from "../../assets/images/resource/icon.png";

const Metric = () => {
  const metrics = [
    { value: "10", suffix: "M", label: "Total Supply" },
    { value: "5", suffix: "%", label: "Buy Tax" },
    { value: "5", suffix: "%", label: "Sell Tax" },
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
          <div className="absolute about-shape">
            <div className="dream-shape5">
              <img src={shape_icon} alt="Icon" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Metric;
