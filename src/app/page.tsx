import Form from '@/components/Form';

export default function Home() {
  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent mb-4">
            Real-time Notifications
          </h1>
        </div>
        <Form />
      </div>
    </div>
  );
}