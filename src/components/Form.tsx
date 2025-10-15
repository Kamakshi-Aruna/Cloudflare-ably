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
        <div className="w-full max-w-6xl mx-auto p-6">
            <div className="grid lg:grid-cols-2 gap-8">
                {/* Form Section */}
                <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-xl">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800">
                            Submit Form
                        </h2>
                    </div>

                    {/* Success/Error Message */}
                    {successMessage && (
                        <div className={`mb-6 p-4 rounded-xl border-2 ${
                            successMessage.startsWith('Error')
                                ? 'bg-red-50 border-red-300'
                                : 'bg-green-50 border-green-300'
                        } transform transition-all duration-300`}>
                            <div className="flex items-center gap-2">
                                <span className="text-xl">
                                    {successMessage.startsWith('Error') ? '❌' : '✅'}
                                </span>
                                <p className={`text-sm font-semibold ${
                                    successMessage.startsWith('Error')
                                        ? 'text-red-700'
                                        : 'text-green-700'
                                }`}>
                                    {successMessage}
                                </p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative">
                            <label htmlFor="name" className="block text-sm font-semibold mb-2 text-gray-700">
                                👤 Full Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-300 focus:border-purple-500 bg-white text-gray-900 transition-all"
                                placeholder="John Doe"
                            />
                        </div>

                        <div className="relative">
                            <label htmlFor="email" className="block text-sm font-semibold mb-2 text-gray-700">
                                📧 Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-300 focus:border-purple-500 bg-white text-gray-900 transition-all"
                                placeholder="john@example.com"
                            />
                        </div>

                        <div className="relative">
                            <label htmlFor="message" className="block text-sm font-semibold mb-2 text-gray-700">
                                💬 Your Message
                            </label>
                            <textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                required
                                rows={5}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-300 focus:border-purple-500 bg-white text-gray-900 transition-all resize-none"
                                placeholder="Tell us what's on your mind..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 disabled:scale-100 shadow-lg disabled:shadow-none"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Submitting...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <span>🚀</span>
                                    Submit Message
                                </span>
                            )}
                        </button>
                    </form>
                </div>

                {/* Notifications Section */}
                <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-xl">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800">
                            Live Updates
                        </h2>
                    </div>

                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">📭</div>
                                <p className="text-gray-500 text-base">
                                    No notifications yet
                                </p>
                                <p className="text-gray-400 text-sm mt-2">
                                    Submit the form to see real-time magic!
                                </p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 relative transform transition-all duration-300 hover:scale-102 hover:shadow-md"
                                >
                                    <button
                                        onClick={() => removeNotification(notification.id)}
                                        className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm"
                                    >
                                        ✕
                                    </button>
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">🔔</span>
                                        <div className="flex-1 pr-8">
                                            <p className="text-sm font-medium text-gray-800 leading-relaxed">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <p className="text-xs text-green-700 font-semibold">
                                                    {new Date(notification.timestamp).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}