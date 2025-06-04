// Premium Tier Definitionen
export type PremiumTier = 'basic' | 'silver' | 'gold';

export interface PremiumTierInfo {
  id: PremiumTier;
  name: string;
  price: number;
  yearlyPrice?: number;
  features: string[];
  color: string;
  icon: string;
  packageInfo?: string;
}

export const PREMIUM_TIERS: Record<PremiumTier, PremiumTierInfo> = {
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 0,
    features: [
      'Basis Hautanalyse',
      '3 Analysen pro Monat',
      'Basis-Produktempfehlungen',
      'Kostenlose DIY-Rezepte'
    ],
    color: '#6b7280',
    icon: 'person-outline'
  },
  silver: {
    id: 'silver',
    name: 'Silber',
    price: 15,
    features: [
      'Unbegrenzte KI-Analysen',
      'Erweiterte Beauty-Tipps',
      'Verlaufsstatistiken',
      'Alle DIY-Rezepte kostenlos',
      'Personalisierte Routinen',
      'Priority Support'
    ],
    color: '#9ca3af',
    icon: 'star-outline'
  },
  gold: {
    id: 'gold',
    name: 'Gold',
    price: 25,
    yearlyPrice: 250,
    features: [
      'Alles aus Silber-Paket',
      '2x jährlich exklusives Selfcare-Set',
      'VIP Beauty-Beratung',
      'Early Access zu neuen Features',
      'Persönlicher Beauty-Coach (Chat)',
      'Exklusive Gold-Community'
    ],
    color: '#fbbf24',
    icon: 'crown',
    packageInfo: 'Als Gold-Mitglied erhältst du 2× jährlich ein exklusives Selfcare-Set – abgestimmt auf deine aktuelle Haut- & Haaranalyse ✨'
  }
};

// Recipe Types
export interface Recipe {
  id: string;
  title: string;
  description: string;
  skinTypes: string[];
  hairTypes: string[];
  ingredients: Record<string, string>;
  instructions: string[];
  prepTime: number;
  difficulty: 'einfach' | 'mittel' | 'schwer';
  price: number;
  isFree: boolean;
  freeForPremium: PremiumTier[];
  imageUrl?: string;
  category: string;
  benefits: string[];
  createdAt: string;
}

export interface PackageShipment {
  id: string;
  userId: string;
  scheduledDate: string;
  sentDate?: string;
  trackingNumber?: string;
  status: 'scheduled' | 'preparing' | 'sent' | 'delivered';
  packageContents?: any;
  createdAt: string;
}

// Stripe Price IDs (ersetzen Sie diese mit Ihren echten Stripe Price IDs)
export const STRIPE_PRICE_IDS = {
  silver_monthly: 'price_silver_monthly_id',
  gold_monthly: 'price_gold_monthly_id', 
  gold_yearly: 'price_gold_yearly_id'
};