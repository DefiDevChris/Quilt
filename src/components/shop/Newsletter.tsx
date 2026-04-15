'use client';

import { useState } from 'react';
import { COLORS, darkenHex } from '@/lib/design-system';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      setEmail('');
    }
  };

  return (
    <section className="py-20 lg:py-28" style={{ backgroundColor: COLORS.surface }}>
      <div className="w-full px-6 lg:px-12">
        <div className="max-w-2xl mx-auto text-center">
          <h2
            className="text-4xl lg:text-5xl mb-4"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 300,
              color: COLORS.text,
              fontStyle: 'italic',
            }}
          >
            Get first dibs on new fabrics.
          </h2>
          <p
            className="text-lg mb-10"
            style={{ color: COLORS.textDim }}
          >
            Weekly drops, pattern ideas, and studio notes—no spam, just sewing joy.
          </p>

          {isSubmitted ? (
            <div
              className="rounded-2xl p-8"
              style={{ backgroundColor: `${COLORS.primary}33` }}
            >
              <p
                className="text-2xl mb-2"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 300,
                  color: COLORS.text,
                  fontStyle: 'italic',
                }}
              >
                You&apos;re on the list!
              </p>
              <p style={{ color: COLORS.textDim }}>
                Watch your inbox for fabric inspiration.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="flex-1 px-6 py-4 bg-white border rounded-full"
                style={{
                  borderColor: `${COLORS.text}1a`,
                  color: COLORS.text,
                }}
                required
              />
              <button
                type="submit"
                className="px-8 py-4 text-sm font-medium rounded-full transition-colors duration-200"
                style={{
                  backgroundColor: COLORS.primary,
                  color: COLORS.text,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = darkenHex(COLORS.primary, 0.1);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.primary;
                }}
              >
                Subscribe
              </button>
            </form>
          )}

          <p className="text-xs mt-4" style={{ color: `${COLORS.textDim}99` }}>
            Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  );
}
