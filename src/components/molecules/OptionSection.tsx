import Option from "../atoms/Option";

const options = [
  {
    image: "./src/assets/Graph/1.png",
    title: "Call",
    description: "The price rises sharply",
  },
  {
    image: "./src/assets/Graph/2.png",
    title: "Bull Call Spread",
    description: "The price rises to a certain level",
  },
  {
    image: "./src/assets/Graph/3.png",
    title: "Bull Put Spread",
    description: "The price stays at a certain level",
  },
  {
    image: "./src/assets/Graph/4.png",
    title: "Put",
    description: "The price falls sharply",
  },
  {
    image: "./src/assets/Graph/5.png",
    title: "Bear Put Spread",
    description: "The price falls to a certain level",
  },
  {
    image: "./src/assets/Graph/6.png",
    title: "Bear Call Spread",
    description: "The price stays at a certain level",
  },
  {
    image: "./src/assets/Graph/7.png",
    title: "Straddle",
    description: "The price rises or falls sharp",
  },
  {
    image: "./src/assets/Graph/8.png",
    title: "Strangle",
    description: "The price rises or falls significantly",
  },
  {
    image: "./src/assets/Graph/9.png",
    title: "Long Butterfly",
    description: "The price is about a strike price",
  },
];

const Options = () => {
  return (
    <section id="options" className="py-16 bg-[#0d120c]">
      <div className="container px-4 mx-auto md:px-7 lg:px-12">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-white">Our Options</h1>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {options.map((option, index) => (
            <Option key={index} {...option} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Options;
