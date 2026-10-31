import { useEffect, useState } from 'react';
import {
  DEFAULT_DELIVERY_POLICY,
  DELIVERY_POLICY_URL,
  type DeliveryPolicy,
  parseDeliveryPolicy,
} from '@/config/deliveryPolicy';

/** Delivery terms from the editable policy file. The bundled default shows until the file loads. */
export function useDeliveryPolicy(): DeliveryPolicy {
  const [policy, setPolicy] = useState<DeliveryPolicy>(DEFAULT_DELIVERY_POLICY);

  useEffect(() => {
    let active = true;
    fetch(DELIVERY_POLICY_URL, { headers: { Accept: 'application/json' } })
      .then((response) => (response.ok ? response.json() : null))
      .then((raw) => {
        const parsed = parseDeliveryPolicy(raw);
        if (active && parsed) setPolicy(parsed);
      })
      .catch(() => {
        // Keep the bundled default when the file is missing or is not valid JSON.
      });
    return () => {
      active = false;
    };
  }, []);

  return policy;
}
