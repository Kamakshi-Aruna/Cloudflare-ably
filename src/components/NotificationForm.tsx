'use client';

import { useState, useEffect } from 'react';
import * as Ably from 'ably';
import { pushNotifications } from '@/lib/push-notifications';

interface Notification {
  id: string;
  message: string;
  timestamp: number;
}

export default function NotificationForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ably, setAbly] = useState<Ably.Realtime | null>(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Initialize push notifications
    const initPushNotifications = async () => {
      const supported = pushNotifications.isSupported();
      setPushSupported(supported);

      if (supported) {
        await pushNotifications.registerServiceWorker();
        setPushEnabled(pushNotifications.getPermission() === 'granted');
      }
    };

    initPushNotifications();

    // Initialize Ably client
    const ablyClient = new Ably.Realtime({ authUrl: '/api/ably-auth' });

    ablyClient.connection.on('connected', () => {
      console.log('✅ Connected to Ably');
    });

    ablyClient.connection.on('failed', (error) => {
      console.error('❌ Failed to connect to Ably:', error);
    });

    ablyClient.connection.on('disconnected', () => {
      console.warn('⚠️ Disconnected from Ably');
    });

    const channel = ablyClient.channels.get('notifications');

    channel.subscribe('form-submission', async (message) => {
      console.log('📩 Received message:', message);
      const notification: Notification = {
        id: Date.now().toString(),
        message: message.data.message,
        timestamp: message.data.timestamp || Date.now(),
      };
      setNotifications((prev) => [notification, ...prev]);

      // Show browser push notification
      if (pushNotifications.getPermission() === 'granted') {
        await pushNotifications.showNotification('New Form Submission', {
          body: message.data.message,
          tag: 'form-submission',
          requireInteraction: false,
        });
      }
    });

    setAbly(ablyClient);

    return () => {
      channel.unsubscribe();
      ablyClient.close();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/submit-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage(data.message || 'Form submitted successfully! 🎉');
        setName('');
        setEmail('');
        setMessage('');

        // Hide success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
      } else {
        const errorData = await response.json();
        setSuccessMessage(`Error: ${errorData.error || 'Failed to submit form'}`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSuccessMessage('Error: Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleEnablePushNotifications = async () => {
    const permission = await pushNotifications.requestPermission();
    setPushEnabled(permission === 'granted');

    if (permission === 'granted') {
      console.log('✅ Push notifications enabled');
    } else {
      console.log('❌ Push notifications denied');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Submit Form
          </h2>

          {/* Success/Error Message */}
          {successMessage && (
            <div className={`mb-4 p-3 rounded-md border ${
              successMessage.startsWith('Error')
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            }`}>
              <p className={`text-sm font-medium ${
                successMessage.startsWith('Error')
                  ? 'text-red-800 dark:text-red-200'
                  : 'text-green-800 dark:text-green-200'
              }`}>
                {successMessage}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter your message"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </div>

        {/* Notifications Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Real-time Notifications
          </h2>
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No notifications yet. Submit the form to see real-time updates!
              </p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3 relative animate-fade-in"
                >
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    ✕
                  </button>
                  <p className="text-sm text-green-800 dark:text-green-200 pr-6">
                    {notification.message}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}