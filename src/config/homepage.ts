/**
 * Homepage presentation settings. Marketplace records are never configured here: products,
 * manufacturers, RFQs, auctions and counts all load from the database.
 */

/**
 * Licensed photograph of an international port or cargo logistics scene, served from /public,
 * for example '/images/home/port-hero.jpg'. Leave empty to show the hero without a photo.
 */
export const HERO_IMAGE_SRC = '';
export const HERO_IMAGE_ALT = 'Container ships and cargo cranes at an international port';

/**
 * Reference list for the trade section. These are real ports. They are not shipping routes,
 * schedules or live cargo movements.
 */
export const REFERENCE_PORTS: ReadonlyArray<{ name: string; country: string }> = [
  { name: 'Nhava Sheva (JNPT)', country: 'India' },
  { name: 'Mundra', country: 'India' },
  { name: 'Chennai', country: 'India' },
  { name: 'Kandla (Deendayal)', country: 'India' },
  { name: 'Shanghai', country: 'China' },
  { name: 'Singapore', country: 'Singapore' },
  { name: 'Jebel Ali', country: 'United Arab Emirates' },
  { name: 'Rotterdam', country: 'Netherlands' },
];
