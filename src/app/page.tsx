import Form from '@/components/Form';

export default function Home() {
  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
              ⚡ Powered by Ably & Cloudflare
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent mb-4">
            Real-time Notifications
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experience instant updates with our cutting-edge real-time messaging platform
          </p>
        </div>
        <Form />
      </div>
    </div>
  );
}