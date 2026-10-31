export interface DeliveryPolicy {
  headline: string;
  charges: string;
  points: string[];
  /** Optional line shown under the offer. Leave empty to show nothing. */
  note: string;
}

/** Editable content. Changing this file updates the homepage on the next deploy, with no code change. */
export const DELIVERY_POLICY_URL = '/content/delivery-policy.json';

/** Used until the policy file loads, and if the file is missing or invalid. Keep it in step with the JSON. */
export const DEFAULT_DELIVERY_POLICY: DeliveryPolicy = {
  headline: 'Free Delivery on Every Order',
  charges: '₹0 Delivery Charges',
  points: ['All Product Categories', 'Any Eligible Quantity', 'Doorstep Delivery', 'Shipment Tracking'],
  note: '',
};

export function parseDeliveryPolicy(raw: unknown): DeliveryPolicy | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Record<string, unknown>;
  const points = Array.isArray(value.points)
    ? value.points.filter((point): point is string => typeof point === 'string' && point.trim() !== '')
    : [];
  if (typeof value.headline !== 'string' || typeof value.charges !== 'string' || points.length === 0) {
    return null;
  }
  return {
    headline: value.headline.trim(),
    charges: value.charges.trim(),
    points: points.map((point) => point.trim()),
    note: typeof value.note === 'string' ? value.note.trim() : '',
  };
}
