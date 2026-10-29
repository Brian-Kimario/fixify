import { z } from 'zod';

// z.guid accepts any 8-4-4-4-12 hex id; z.uuid would also reject ids whose version bits are not RFC 9562.
export const uuid = z.guid({ message: 'Invalid id' });
