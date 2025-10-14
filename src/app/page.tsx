import NotificationForm from '@/components/NotificationForm';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Real-time Notifications with Ably
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Submit the form and see real-time notifications powered by Ably
          </p>
        </div>
        <NotificationForm />
      </div>
    </div>
  );
}