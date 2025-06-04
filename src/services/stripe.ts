import { initStripe } from '@stripe/stripe-react-native';

export const initializeStripe = async () => {
  await initStripe({
    publishableKey: 'pk_live_51RO3hkP75gpLzYJq5v0Z2AJVfeIOWvGfWjUGJMKTLgRl4r6Yei2G8oN3lvTqBWm4vsGGTsP3bLdDEz5hmBT9cByg00pdGe0mA0',
  });
};

export const createSubscription = async (priceId: string) => {
  // Subscription Logic hier
};