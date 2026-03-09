
import { toast } from 'sonner';

/**
 * Zoho Payments Integration Service
 * 
 * This service handles the integration with Zoho Payments India.
 * It uses the Checkout Widget (zpayments.js) to process payments.
 */

declare global {
    interface Window {
        ZohoPayments?: any;
    }
}

interface PaymentSessionParams {
    amount: number;
    orderNumber: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    projectId: string;
}

// These are the possible URLs for the Zoho SDK
const ZOHO_SCRIPT_URLS = [
    'https://static.zohocdn.in/zpay/zpay-js/v1/zpayments.js',
    'https://static.zohocdn.com/zpay/zpay-js/v1/zpayments.js',
    'https://js.zohocdn.com/zpay/zpay-js/v1/zpayments.js' // Potential alternative
];

export const zohoService = {
    /**
     * Dynamically load the Zoho Payments script with total fallback logic
     */
    async loadScript(): Promise<boolean> {
        if (window.ZohoPayments) return true;

        for (const url of ZOHO_SCRIPT_URLS) {
            console.log(`ZohoService: Trying to load script from ${url}`);

            const success = await new Promise<boolean>((resolve) => {
                const script = document.createElement('script');
                script.src = url;
                script.async = true;
                script.onload = () => {
                    if (window.ZohoPayments) {
                        console.log(`ZohoService: Successfully loaded from ${url}`);
                        resolve(true);
                    } else {
                        console.warn(`ZohoService: Script loaded from ${url} but window.ZohoPayments is not defined`);
                        resolve(false);
                    }
                };
                script.onerror = () => {
                    console.warn(`ZohoService: Failed to reach ${url}`);
                    resolve(false);
                };
                document.head.appendChild(script);
            });

            if (success) return true;
        }

        return false;
    },

    /**
     * Initialize Zoho Payments instance
     */
    async initInstance() {
        console.log('ZohoService: Starting initialization...');

        const isLoaded = await this.loadScript();

        if (!isLoaded || !window.ZohoPayments) {
            console.error('Zoho Payments SDK failed to load from all known sources.');
            toast.error('Payment system failed to load. Please check if your network blocks zoho.in or zoho.com.');
            return null;
        }

        const apiKey = import.meta.env.VITE_ZOHO_PAYMENTS_API_KEY;
        const accountId = import.meta.env.VITE_ZOHO_PAYMENTS_ACCOUNT_ID;

        try {
            console.log('ZohoService: Instantiating with Account ID:', accountId);
            return new window.ZohoPayments({
                domain: 'IN', // For Zoho.in
                api_key: apiKey || 'demo_key',
                account_id: accountId || 'demo_id',
            });
        } catch (err) {
            console.error('ZohoService: Instance creation error:', err);
            toast.error('Failed to initialize local payment bridge.');
            return null;
        }
    },

    async createPaymentSession(params: PaymentSessionParams): Promise<string> {
        console.log('ZohoService: Mocking session for', params.orderNumber);
        return `sess_${Math.random().toString(36).substring(2, 10)}`;
    },

    async processPayment(params: PaymentSessionParams): Promise<any> {
        const zp = await this.initInstance();
        if (!zp) return null;

        try {
            const sessionId = await this.createPaymentSession(params);
            console.log('ZohoService: Launching widget...');

            return new Promise((resolve, reject) => {
                try {
                    zp.initiatePayment({
                        payments_session_id: sessionId,
                        amount: params.amount,
                        currency_code: 'INR',
                        description: `Payment for Order ${params.orderNumber}`,
                        customer_details: {
                            first_name: params.customerName.split(' ')[0] || 'Customer',
                            last_name: params.customerName.split(' ')[1] || '',
                            email: params.customerEmail || '',
                            phone: params.customerPhone || '',
                        },
                        handler: (response: any) => {
                            console.log('Zoho: Success!', response);
                            resolve(response);
                        },
                        modal_closed: () => {
                            console.log('Zoho: Modal closed');
                            reject(new Error('Payment canceled'));
                        }
                    });
                } catch (innerErr) {
                    console.error('ZohoService: Widget launch error:', innerErr);
                    reject(innerErr);
                }
            });
        } catch (error) {
            console.error('ZohoService: Process error:', error);
            throw error;
        }
    }
};
