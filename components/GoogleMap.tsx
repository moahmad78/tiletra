export default function GoogleMap() {
  return (
    <section className="bg-white">
      <div className="container mx-auto px-4 max-w-7xl py-12 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Visit Our Office</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          We welcome you to visit our Bangalore office to discuss your project in detail, view our portfolio, and plan your installation. Feel free to drop by or schedule an appointment with us!
        </p>
      </div>
      <div className="w-full h-[500px] bg-gray-200 relative">
        <iframe 
          title="Tiletra Office Location"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3889.3787768560136!2d77.6224368!3d12.8795551!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae14b62db4a1c5%3A0x6b68e9f5e04e9c73!2s41%2C%2010th%20A%20Cross%20Rd%2C%20Janapriya%20Layout%2C%20Classic%20Paradise%20Layout%2C%20Begur%2C%20Bengaluru%2C%20Karnataka%20560114!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin" 
          className="absolute inset-0 w-full h-full border-0 grayscale hover:grayscale-0 transition-all duration-500"
          allowFullScreen
          loading="lazy" 
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </section>
  );
}
