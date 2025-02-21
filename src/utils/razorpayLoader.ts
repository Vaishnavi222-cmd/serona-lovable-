
export const loadRazorpayScript = (): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    if (typeof (window as any).Razorpay !== 'undefined') {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;

    script.onload = () => {
      console.log('Razorpay script loaded successfully');
      resolve();
    };

    script.onerror = (error) => {
      console.error('Failed to load Razorpay script:', error);
      reject(new Error('Failed to load payment system'));
    };

    document.body.appendChild(script);
  });
};
