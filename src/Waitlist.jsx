import { useState } from 'react';
import { merch, previewSizes } from './content';
import { submitWaitlist, waitlistMessage } from './waitlist.js';

export function Waitlist({ item, onSuccess }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const handleSubmit = async event => {
    event.preventDefault();
    if (pending) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setPending(true);
    setError('');
    try {
      await submitWaitlist(values);
      onSuccess(waitlistMessage);
    } catch (failure) {
      setError(failure.name === 'TimeoutError' || failure instanceof TypeError
        ? 'We could not reach the signup service. Your signup is not confirmed. Please try again.'
        : failure.message);
    } finally { setPending(false); }
  };
  return <form name="drop-waitlist" method="POST" action="/__forms.html" data-netlify="true" netlify-honeypot="bot-field" onSubmit={handleSubmit} className="waitlist-form" aria-busy={pending}>
    <input type="hidden" name="form-name" value="drop-waitlist" />
    <p hidden><label>Leave this empty<input name="bot-field" tabIndex="-1" autoComplete="off" /></label></p>
    <label>Your name<input name="name" autoComplete="name" maxLength="100" required placeholder="First name" /></label>
    <label>Email address<input type="email" name="email" autoComplete="email" maxLength="254" required placeholder="you@example.com" /></label>
    <div className="form-row"><label>Preferred style<select name="style" defaultValue={item?.id || ''} required><option value="" disabled>Choose your design</option>{merch.map(product => <option value={product.id} key={product.id}>{product.name}</option>)}</select></label><label>Preferred size<select name="size" defaultValue="" required><option value="" disabled>Select size</option>{previewSizes.map(size => <option key={size}>{size}</option>)}</select></label></div>
    <label className="consent"><input type="checkbox" name="consent" value="yes" required /><span>Email me about DualBore Media’s Drop 01. I can opt out by replying to an update.</span></label>
    <p className="form-privacy">Your name, email, and preferences are stored by Netlify Forms for DualBore Media’s drop updates. This records interest, not an order or size reservation.</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="button" type="submit" disabled={pending}>{pending ? 'Joining the list…' : 'Join Drop Alert'}</button>
  </form>;
}
