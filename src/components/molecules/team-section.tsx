import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/swiper-bundle.css";
import { Icons } from "../ui/icons";

export function TeamSection() {
  const teamMembers = [
    {
      name: "Jill",
      role: "Founder",
      image: "assets/team/jill.png",
      socialLinks: [
        {
          platform: "Twitter",
          href: "https://x.com/Jilljoe77",
          icon: Icons.twitter,
        },
        {
          platform: "Telegram",
          href: "https://t.me/jillna",
          icon: Icons.telegram,
        },
      ],
    },
    {
      name: "Jehnny",
      role: "KOL Manager",
      image: "assets/team/jhenny.png",
      socialLinks: [
        {
          platform: "Twitter",
          href: "https://x.com/Jehnnygems",
          icon: Icons.twitter,
        },
        {
          platform: "Telegram",
          href: "https://t.me/jehnnygems",
          icon: Icons.telegram,
        },
      ],
    },
    {
      name: "James",
      role: "Smart Contract Engineer",
      image: "assets/team/james.png",
      socialLinks: [
        {
          platform: "Telegram",
          href: "https://t.me/jamesx6",
          icon: Icons.telegram,
        },
      ],
    },
  ];

  return (
    <section
      id="team"
      className="relative flex items-center w-full py-20 px-8 bg-[#0f110f]"
    >
      <div className="max-w-[1350px] mx-auto flex-1 overflow-hidden">
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
                <div className="relative h-[400px] overflow-hidden rounded-lg group">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 transition-opacity duration-300 bg-black/50"></div>
                  <div className="absolute flex flex-col items-start space-y-2 text-white bottom-8 left-4">
                    <h4 className="relative font-semibold md:text-2xl">
                      {member.name}
                      <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-white transition-all duration-300 group-hover:w-full"></span>
                    </h4>
                    <p>{member.role}</p>
                    <div className="flex space-x-3">
                      {member.socialLinks.map((link, linkIndex) => (
                        <a
                          key={linkIndex}
                          href={link.href}
                          target="_blank"
                          className="grid w-8 h-8 bg-black/80 place-items-center"
                          rel="noopener noreferrer"
                        >
                          <link.icon className="w-6 h-6" />
                        </a>
                      ))}
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
