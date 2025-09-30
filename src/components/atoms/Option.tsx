type OptionProps = {
  image: string;
  title: string;
  description: string;
};

const Option = ({ image, title, description }: OptionProps) => {
  return (
    <div className="bg-[#1a1a1a] rounded-lg p-8">
      <div className="project-thumb">
        <img src={image} alt={title} className="w-full" />
      </div>

      <div className="flex flex-col gap-2 pt-4">
        <h3 className="text-white text-2xl font-bold">{title}</h3>
        <p className="font-bold text-gray-500">Profitable if</p>
        <p className="text-white text-xl">{description}</p>
      </div>
    </div>
  );
};

export default Option;
