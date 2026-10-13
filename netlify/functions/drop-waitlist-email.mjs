import { processSubmission } from '../lib/drop-waitlist-email.mjs';

// Only the platform event is exposed. There is no public HTTP email-sending route.
// Netlify verifies the event's JWS before invoking formSubmitted.
export default {
  async formSubmitted(event) {
    await processSubmission(event);
  },
};
