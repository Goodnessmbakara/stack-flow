import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/swiper-bundle.css";
import { Icons } from "../ui/icons";

export function TeamSection() {
  const teamMembers = [
    {
      name: "Goodness Mbakara",
      role: "Full Stack Software Engineer",
      twitter: "@goodnesmbakara",
      twitterUrl: "https://x.com/goodnesmbakara",
      image: "assets/team/goodness.jpg",
    },
    {
      name: "Wiseman Umanah",
      role: "Full Stack Software Engineer",
      twitter: "@0xwisemanumanah",
      twitterUrl: "https://x.com/0xwisemanumanah",
      image: "assets/team/wiseman.png",
    },
    {
      name: "Mfoniso Ukpabio",
      role: "Full Stack Software Engineer",
      twitter: "@Mfonisoh1",
      twitterUrl: "https://x.com/Mfonisoh1",
      image: "assets/team/mfoniso.jpg",
    },
    {
      name: "Tom Udoh",
      role: "Full Stack Software Engineer",
      twitter: "@0xtomdan",
      twitterUrl: "https://x.com/0xtomdan",
      image: "assets/team/tom.png",
    },
  ];

  return (
    <section
      id="team"
      className="relative flex flex-col items-center w-full py-20 px-8 bg-[#0f110f]"
    >
      {/* Section Title */}
      <div className="mb-12 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Meet the <span className="text-[#82e01e]">Team</span>
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Full Stack Software Engineers building the future of DeFi on Stacks
        </p>
      </div>

      <div className="max-w-[1350px] mx-auto flex-1 overflow-hidden w-full">
        <div className="relative flex-1 overflow-hidden max-w-[1116px] mx-auto">
          <Swiper
            className="mySwiper"
            modules={[Navigation, Pagination, Autoplay]}
            slidesPerView={1}
            spaceBetween={30}
            loop={true}
            autoplay={{
              delay: 2500,
              disableOnInteraction: false,
            }}
            navigation={{
              nextEl: ".control.next",
              prevEl: ".control.prev",
            }}
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
          >
            {teamMembers.map((member, index) => (
              <SwiperSlide key={index}>
                <div className="relative h-[400px] overflow-hidden rounded-lg group border border-[#82e01e]/20 hover:border-[#82e01e]/50 transition-all duration-300">
                  {/* Photo or Gradient Background */}
                  {member.image ? (
                    <>
                      <img
                        src={member.image}
                        alt={member.name}
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1f1a] to-[#0d120c]">
                        <div className={`absolute inset-0 bg-gradient-to-br ${member.gradient} opacity-20`}></div>
                      </div>
                      {/* Avatar Circle for members without photos */}
                      <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
                        <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${member.gradient} flex items-center justify-center text-white text-4xl font-bold shadow-lg`}>
                          {member.initials}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Content */}
                  <div className="absolute flex flex-col items-center space-y-3 text-white bottom-8 left-0 right-0 px-4">
                    <h4 className="relative font-bold text-xl md:text-2xl text-center">
                      {member.name}
                      <span className="absolute left-1/2 transform -translate-x-1/2 -bottom-1 w-0 h-[2px] bg-[#82e01e] transition-all duration-300 group-hover:w-full"></span>
                    </h4>
                    <p className="text-gray-300 text-sm text-center">{member.role}</p>
                    <div className="flex items-center space-x-2">
                      <a
                        href={member.twitterUrl}
                        target="_blank"
                        className="flex items-center gap-2 px-4 py-2 bg-[#82e01e]/10 hover:bg-[#82e01e]/20 border border-[#82e01e]/30 rounded-full transition-all duration-300 group/link"
                        rel="noopener noreferrer"
                      >
                        <Icons.twitter className="w-5 h-5 text-[#82e01e] group-hover/link:scale-110 transition-transform" />
                        <span className="text-sm text-gray-300 group-hover/link:text-white">{member.twitter}</span>
                      </a>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Controls */}
        <div className="absolute z-10 items-center hidden gap-4 transform -translate-y-1/2 lg:flex left-10 top-1/2">
          <button
            type="button"
            role="presentation"
            className="text-white control prev"
          >
            <ChevronLeftIcon className="w-10 h-10" />
          </button>
          <button
            type="button"
            role="presentation"
            className="text-white control next"
          >
            <ChevronRightIcon className="w-10 h-10" />
          </button>
        </div>

        {/* Mobile Controls */}
        <div className="flex lg:hidden items-center gap-4 absolute left-1/2 transform -translate-x-1/2 top-[90%] z-10">
          <button
            type="button"
            role="presentation"
            className="text-white control prev"
          >
            <ChevronLeftIcon className="w-8 h-8" />
          </button>
          <button
            type="button"
            role="presentation"
            className="text-white control next"
          >
            <ChevronRightIcon className="w-8 h-8" />
          </button>
        </div>
      </div>
    </section>
  );
}
