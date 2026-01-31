/**
 * Beta Banner Component
 * Shows beta status and links to feedback
 */

import { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';

export function BetaBanner() {
    const [isDismissed, setIsDismissed] = useState(() => {
        return localStorage.getItem('beta-banner-dismissed') === 'true';
    });

    const handleDismiss = () => {
        localStorage.setItem('beta-banner-dismissed', 'true');
        setIsDismissed(true);
    };

    if (isDismissed) return null;

    return (
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 text-center text-sm relative">
            <div className="flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">BETA VERSION</span>
                <span className="hidden sm:inline">
                    - You're using an early version. Help us improve by{' '}
                    <button
                        className="underline hover:no-underline font-semibold"
                        onClick={() => {
                            const feedbackBtn = document.getElementById('feedback-button');
                            if (feedbackBtn) feedbackBtn.click();
                        }}
                    >
                        sharing feedback
                    </button>
                </span>
            </div>

            <button
                onClick={handleDismiss}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded transition-colors"
                aria-label="Dismiss banner"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
