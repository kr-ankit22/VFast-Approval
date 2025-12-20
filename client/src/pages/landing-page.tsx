import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Bed, Wifi, Utensils, Info, ChevronRight, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

export default function LandingPage() {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const getBookingLink = () => {
    if (!user) return "/auth";

    switch (user.role) {
      case UserRole.BOOKING:
        return "/booking/create";
      case UserRole.ADMIN:
        return "/admin";
      case UserRole.VFAST:
        return "/vfast";
      default:
        return "/auth";
    }
  };

  const vfastImages = [
    { src: "/images/vfast_lawn.jpg", caption: "VFast Lush Green Lawns" },
    { src: "/images/vfast_conference_room.jpg", caption: "Professional Conference Facilities" },
    { src: "/images/vfast_dining_hall.jpg", caption: "Elegant Dining Experience" },
  ];

  const instructions = [
    {
      category: "Check-in & Departure",
      details: [
        "24/7 Reception services available.",
        "24-hour check-out cycle from time of arrival.",
        "Government-approved ID mandatory.",
        "International guests must provide valid passport/visa and complete 'Form C'.",
      ]
    },
    {
      category: "Dining Experience",
      details: [
        "Pure Vegetarian meals only.",
        "Breakfast: 08:00 AM – 09:30 AM",
        "Lunch: 01:00 PM – 02:00 PM",
        "Dinner: 08:00 PM – 09:30 PM",
        "Tea/Coffee: 07:00 AM – 07:00 PM (except mealtimes).",
      ]
    },
    {
      category: "Stay Policies",
      details: [
        "Quiet Hours: 10:00 PM to 07:00 AM.",
        "Strictly Prohibited: Smoking, alcohol, pets, outside eatables.",
        "Eco-Friendly: Please switch off appliances when not in use.",
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <section
          className="relative bg-cover bg-center h-[500px]"
          style={{
            backgroundImage: "linear-gradient(rgba(0, 51, 102, 0.7), rgba(0, 51, 102, 0.7)), url('/images/vfast_lawn.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        >
          <div className="container mx-auto px-4 h-full flex items-center relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-center w-full gap-8">
              <div className="max-w-2xl text-white">
                <h1 className="text-4xl md:text-5xl font-bold font-poppins mb-4">Welcome to VFast Hostel</h1>
                <p className="text-xl mb-6">Premium accommodation at BITS Pilani for students, faculty, and distinguished visitors.</p>
                <div className="flex flex-wrap gap-3">
                  <Link href={getBookingLink()}>
                    <Button variant="secondary" className="font-medium px-8 py-6 text-lg">Book Your Stay</Button>
                  </Link>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="bg-white text-primary hover:bg-gray-100 px-8 py-6 text-lg">
                        <Info className="mr-2 h-5 w-5" /> View Instructions
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-md">
                      <SheetHeader>
                        <SheetTitle className="text-2xl text-primary font-bold">Stay Instructions</SheetTitle>
                        <SheetDescription>
                          Essential details for your comfortable stay at VFast.
                        </SheetDescription>
                      </SheetHeader>
                      <ScrollArea className="h-[calc(100vh-120px)] mt-6 pr-4">
                        <div className="space-y-6">
                          {instructions.map((item, idx) => (
                            <div key={idx} className="border-b pb-4 last:border-0">
                              <h3 className="font-bold text-primary mb-2 flex items-center">
                                <ChevronRight className="h-4 w-4 mr-1" />
                                {item.category}
                              </h3>
                              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                {item.details.map((detail, dIdx) => (
                                  <li key={dIdx}>{detail}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white" id="facilities">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold font-poppins text-center text-primary mb-12">Our Facilities</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="w-16 h-16 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bed className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold font-poppins mb-3">Comfortable Rooms</h3>
                <p className="text-gray-600">Modern rooms equipped with all the basic amenities for a comfortable stay.</p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="w-16 h-16 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wifi className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold font-poppins mb-3">High-Speed WiFi</h3>
                <p className="text-gray-600">Stay connected with our campus-wide high-speed internet connection.</p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="w-16 h-16 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Utensils className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold font-poppins mb-3">Dining Options</h3>
                <p className="text-gray-600">Multiple dining options available within the campus for your convenience.</p>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="py-16 bg-background" id="about">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="md:w-1/2">
                <Carousel className="w-full max-w-lg mx-auto">
                  <CarouselContent>
                    {vfastImages.map((image, index) => (
                      <CarouselItem key={index}>
                        <div className="p-1">
                          <Card className="overflow-hidden">
                            <CardContent className="flex flex-col aspect-video items-center justify-center p-0">
                              <img
                                src={image.src}
                                alt={image.caption}
                                className="w-full h-full object-cover"
                              />
                              <div className="bg-primary text-white w-full py-3 px-4 text-center font-medium">
                                {image.caption}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <div className="hidden md:block">
                    <CarouselPrevious className="left-2" />
                    <CarouselNext className="right-2" />
                  </div>
                </Carousel>
              </div>
              <div className="md:w-1/2">
                <h2 className="text-3xl font-bold font-poppins text-primary mb-4">About VFast Hostel</h2>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  The Visiting Faculty and Student Transit (VFAST) Hostel offers premium, pure vegetarian accommodation within the serene BITS Pilani campus. Designed for top-tier comfort, it caters to visiting faculty, researchers, alumni, and parents.
                </p>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  Located in the heart of the institute, VFAST provides seamless access to academic halls, libraries, and campus recreational centers, all within a professional and tranquil ambiance.
                </p>
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white" asChild>
                  <a href="/#facilities">Explore Facilities</a>
                </Button>
              </div>
            </div>
          </div>
        </section>



        {/* CTA Section */}
        <section className="py-16 bg-primary">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold font-poppins text-white mb-6">Ready to Book Your Stay?</h2>
            <p className="text-white text-lg mb-8 max-w-2xl mx-auto">
              Experience hassle-free accommodation booking for your visit to BITS Pilani campus.
            </p>
            <Link href={getBookingLink()}>
              <Button variant="secondary" className="font-medium">Book Now</Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
