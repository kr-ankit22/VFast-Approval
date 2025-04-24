import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Bed, Wifi, Utensils, Star, StarHalf } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";

export default function LandingPage() {
  const { user } = useAuth();

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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section 
          className="relative bg-cover bg-center h-[500px]" 
          style={{ 
            backgroundImage: "linear-gradient(rgba(0, 51, 102, 0.7), rgba(0, 51, 102, 0.7)), url('https://images.unsplash.com/photo-1496864137062-a12b5defe6be?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        >
          <div className="container mx-auto px-4 h-full flex items-center relative z-10">
            <div className="max-w-2xl text-white">
              <h1 className="text-4xl md:text-5xl font-bold font-poppins mb-4">Welcome to VFast Hostel Booking</h1>
              <p className="text-xl mb-6">Streamlined accommodation booking for BITS Pilani students, faculty, and visitors.</p>
              <div className="flex flex-wrap gap-3">
                <Link href={getBookingLink()}>
                  <Button variant="secondary" className="font-medium">Book Now</Button>
                </Link>
                <Link href="/#facilities">
                  <Button variant="outline" className="bg-white text-primary hover:bg-gray-100">Learn More</Button>
                </Link>
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
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="md:w-1/2">
                <img 
                  src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
                  alt="BITS Pilani Campus" 
                  className="rounded-lg shadow-lg w-full h-auto"
                />
              </div>
              <div className="md:w-1/2">
                <h2 className="text-3xl font-bold font-poppins text-primary mb-4">About VFast Hostel</h2>
                <p className="text-gray-700 mb-6">VFast Hostel at BITS Pilani provides convenient accommodation for visitors, faculty, alumni, students, and staff. Our modern facility offers a comfortable stay with all necessary amenities.</p>
                <p className="text-gray-700 mb-6">Located in the heart of the campus, our hostel provides easy access to academic buildings, libraries, and recreational facilities.</p>
                <Button variant="outline">Learn More About Us</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold font-poppins text-center text-primary mb-12">What People Say</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Testimonial 1 */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mr-4">RS</div>
                  <div>
                    <h4 className="font-semibold">Rahul Sharma</h4>
                    <p className="text-sm text-gray-500">BITS Alumni</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  "The VFast hostel booking system made my campus visit seamless. I could easily book a room for my alumni meet visit."
                </p>
                <div className="mt-3 text-yellow-500 flex">
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                </div>
              </div>
              
              {/* Testimonial 2 */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mr-4">PP</div>
                  <div>
                    <h4 className="font-semibold">Priya Patel</h4>
                    <p className="text-sm text-gray-500">Visiting Faculty</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  "Clean rooms, efficient service, and a simple booking process. My stay at VFast hostel during my guest lecture was very comfortable."
                </p>
                <div className="mt-3 text-yellow-500 flex">
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <StarHalf className="h-4 w-4 fill-current" />
                </div>
              </div>
              
              {/* Testimonial 3 */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mr-4">AS</div>
                  <div>
                    <h4 className="font-semibold">Arjun Singh</h4>
                    <p className="text-sm text-gray-500">Parent</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  "As a parent visiting for the convocation, the VFast hostel provided convenient accommodation right on campus. The booking process was straightforward."
                </p>
                <div className="mt-3 text-yellow-500 flex">
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 text-gray-300" />
                </div>
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
