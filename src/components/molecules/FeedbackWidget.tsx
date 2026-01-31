/**
 * Feedback Widget Component
 * Floating button and modal for user feedback
 */

import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { logger } from '../../lib/logger';

type FeedbackType = 'bug' | 'feature' | 'general';

export function FeedbackWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [feedbackType, setFeedbackType] = useState<FeedbackType>('general');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!message.trim()) {
            toast.error('Please enter your feedback');
            return;
        }

        setIsSubmitting(true);

        try {
            // In production, this would submit to a backend or service like Formspree
            // For now, we'll just log it and simulate submission
            const feedback = {
                type: feedbackType,
                message: message.trim(),
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href,
            };

            logger.info('Feedback submitted', { feedback });

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            toast.success('Thank you for your feedback!');
            setMessage('');
            setIsOpen(false);
        } catch (error) {
            logger.error('Failed to submit feedback', error as Error);
            toast.error('Failed to submit feedback. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <button
                id="feedback-button"
                onClick={() => setIsOpen(true)}
                className="fixed bottom-24 right-6 z-50 bg-[#0d120c]/80 backdrop-blur-md border border-[#37F741]/20 text-white p-3 rounded-full shadow-[0_0_20px_rgba(55,247,65,0.15)] hover:scale-110 hover:shadow-[0_0_30px_rgba(55,247,65,0.3)] hover:border-[#37F741]/50 transition-all duration-300 group"
                aria-label="Give feedback"
            >
                <div className="absolute inset-0 bg-[#37F741]/10 rounded-full animate-pulse group-hover:animate-none"></div>
                <MessageCircle className="w-6 h-6 relative z-10" />
                <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-[#0d120c]/90 border border-white/10 text-white px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none backdrop-blur-md">
                    Feedback
                </span>
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#0d120c] border border-[#37F741]/20 rounded-2xl max-w-md w-full p-6 shadow-[0_0_50px_rgba(55,247,65,0.1)]">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <span className="text-[#37F741]">Feedback</span>
                            </h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-white transition-colors bg-white/5 p-1 rounded-full hover:bg-white/10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {/* Feedback Type */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-400 mb-3">
                                    Type
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFeedbackType('bug')}
                                        className={`py-2 px-3 rounded-xl text-sm font-medium transition-all border ${feedbackType === 'bug'
                                            ? 'bg-red-500/10 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                                            : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        🐛 Bug
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFeedbackType('feature')}
                                        className={`py-2 px-3 rounded-xl text-sm font-medium transition-all border ${feedbackType === 'feature'
                                            ? 'bg-[#37F741]/10 border-[#37F741] text-[#37F741] shadow-[0_0_15px_rgba(55,247,65,0.2)]'
                                            : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        💡 Feature
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFeedbackType('general')}
                                        className={`py-2 px-3 rounded-xl text-sm font-medium transition-all border ${feedbackType === 'general'
                                            ? 'bg-blue-500/10 border-blue-500 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                                            : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        💬 General
                                    </button>
                                </div>
                            </div>

                            {/* Message */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Message
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Tell us what you think..."
                                    className="w-full h-32 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#37F741]/50 focus:ring-1 focus:ring-[#37F741]/50 resize-none transition-all"
                                    disabled={isSubmitting}
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 bg-white/5 text-gray-400 px-4 py-3 rounded-xl font-medium hover:bg-white/10 transition-all"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-[#37F741] text-black px-4 py-3 rounded-xl font-bold hover:brightness-110 transition-all shadow-[0_0_20px_rgba(55,247,65,0.3)] disabled:opacity-50 disabled:shadow-none"
                                    disabled={isSubmitting}
                                    style={{ textShadow: "none" }}
                                >
                                    {isSubmitting ? 'Sending...' : 'Send Feedback'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
