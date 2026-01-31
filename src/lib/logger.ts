/**
 * Logger utility for structured logging
 * Provides consistent logging interface across the application
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
    [key: string]: unknown;
}

class Logger {
    private isDevelopment = import.meta.env.DEV;
    private appName = import.meta.env.VITE_APP_NAME || 'StackFlow';

    private formatMessage(level: LogLevel, message: string, context?: LogContext) {
        const timestamp = new Date().toISOString();
        return {
            timestamp,
            level,
            app: this.appName,
            message,
            ...context,
        };
    }

    debug(message: string, context?: LogContext) {
        if (this.isDevelopment) {
            console.debug('[DEBUG]', this.formatMessage('debug', message, context));
        }
    }

    info(message: string, context?: LogContext) {
        console.info('[INFO]', this.formatMessage('info', message, context));
    }

    warn(message: string, context?: LogContext) {
        console.warn('[WARN]', this.formatMessage('warn', message, context));
    }

    error(message: string, error?: Error, context?: LogContext) {
        const errorContext = {
            ...context,
            error: error ? {
                message: error.message,
                stack: error.stack,
                name: error.name,
            } : undefined,
        };
        console.error('[ERROR]', this.formatMessage('error', message, errorContext));
    }

    // Wallet-specific logging
    logWalletConnect(address: string) {
        this.info('Wallet connected', { address, event: 'wallet_connect' });
    }

    logWalletDisconnect() {
        this.info('Wallet disconnected', { event: 'wallet_disconnect' });
    }

    // Transaction logging
    logTransaction(txId: string, type: string, amount?: number) {
        this.info('Transaction initiated', {
            txId,
            type,
            amount,
            event: 'transaction_initiated'
        });
    }

    logTransactionSuccess(txId: string) {
        this.info('Transaction successful', {
            txId,
            event: 'transaction_success'
        });
    }

    logTransactionError(txId: string, error: Error) {
        this.error('Transaction failed', error, {
            txId,
            event: 'transaction_failed'
        });
    }

    // Pool activity logging
    logPoolJoin(poolId: string, amount: number) {
        this.info('User joined pool', {
            poolId,
            amount,
            event: 'pool_join'
        });
    }

    // Sentiment logging
    logSentimentUpdate(score: number, confidence: number) {
        this.debug('Sentiment data updated', {
            score,
            confidence,
            event: 'sentiment_update'
        });
    }
}

export const logger = new Logger();
