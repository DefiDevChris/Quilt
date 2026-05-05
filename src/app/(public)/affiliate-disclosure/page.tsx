import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'Affiliate Disclosure - QuiltCorgi',
  description:
    'QuiltCorgi affiliate link disclosure — how we earn commissions and what it means for you.',
};

export default function AffiliateDisclosurePage() {
  return (
    <>
      <div className="flex-1 bg-[var(--color-bg)]">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <h1
            className="text-4xl font-bold mb-4 text-[var(--color-text)]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Affiliate Disclosure
          </h1>
          <p className="text-[var(--color-text-dim)] mb-12">
            Last updated: May 5, 2026
          </p>

          <div className="prose prose-neutral max-w-none space-y-8 text-[var(--color-text)]">
            <section>
              <h2
                className="text-2xl font-semibold mb-4 text-[var(--color-text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                How QuiltCorgi Earns Revenue
              </h2>
              <p>
                QuiltCorgi is a <strong>completely free</strong> quilt design tool. We do not
                charge subscription fees, and all features are available to every user at no
                cost.
              </p>
              <p>
                To keep QuiltCorgi free, we participate in affiliate marketing programmes.
                When you click a &ldquo;Buy at&rdquo; link in our{' '}
                <Link href="/fabrics" className="text-[var(--color-primary)] hover:underline">
                  Fabric Library
                </Link>{' '}
                or from within the design studio, you may be redirected to a
                third-party retailer through an affiliate link. If you make a purchase after
                clicking one of these links, QuiltCorgi may earn a small commission at{' '}
                <strong>no extra cost to you</strong>.
              </p>
            </section>

            <section>
              <h2
                className="text-2xl font-semibold mb-4 text-[var(--color-text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Awin Affiliate Network
              </h2>
              <p>
                QuiltCorgi is a publisher member of the{' '}
                <a
                  href="https://www.awin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-primary)] hover:underline"
                >
                  Awin
                </a>{' '}
                affiliate network. Awin connects publishers (like QuiltCorgi) with
                advertisers (fabric retailers). When you follow an affiliate link, Awin
                tracks the referral and attributes any resulting commission to QuiltCorgi.
              </p>
              <p>
                Awin may set cookies on your device to track referrals. These cookies are
                governed by{' '}
                <a
                  href="https://www.awin.com/gb/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-primary)] hover:underline"
                >
                  Awin&apos;s Privacy Policy
                </a>
                . QuiltCorgi does not control or have access to these cookies.
              </p>
            </section>

            <section>
              <h2
                className="text-2xl font-semibold mb-4 text-[var(--color-text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                What This Means for You
              </h2>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>
                  <strong>No extra cost:</strong> Affiliate links do not increase the
                  price you pay. The commission comes from the retailer, not from you.
                </li>
                <li>
                  <strong>No influence on curation:</strong> Our fabric library is curated
                  for quality and relevance to quilting. Affiliate relationships do not
                  influence which fabrics appear or how they are ranked.
                </li>
                <li>
                  <strong>Clearly labelled:</strong> Affiliate links are always identified
                  with a notice such as &ldquo;Affiliate link — QuiltCorgi may earn a
                  commission at no extra cost to you.&rdquo;
                </li>
                <li>
                  <strong>Your choice:</strong> You are never required to click an
                  affiliate link. You can always visit the retailer directly.
                </li>
              </ul>
            </section>

            <section>
              <h2
                className="text-2xl font-semibold mb-4 text-[var(--color-text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Click Tracking
              </h2>
              <p>
                When you click an affiliate link, QuiltCorgi records a minimal click event
                for analytics purposes. This includes:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-1">
                <li>Which fabric was clicked</li>
                <li>Which retailer the link points to</li>
                <li>The referring page on QuiltCorgi</li>
                <li>A one-way hash of your IP address (not your actual IP)</li>
                <li>Your browser&apos;s user-agent string</li>
              </ul>
              <p className="mt-3">
                We respect{' '}
                <a
                  href="https://en.wikipedia.org/wiki/Do_Not_Track"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-primary)] hover:underline"
                >
                  Do Not Track (DNT)
                </a>{' '}
                and{' '}
                <a
                  href="https://globalprivacycontrol.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-primary)] hover:underline"
                >
                  Global Privacy Control (GPC)
                </a>{' '}
                signals. If your browser sends either signal, no click event is recorded.
              </p>
            </section>

            <section>
              <h2
                className="text-2xl font-semibold mb-4 text-[var(--color-text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Pricing Information
              </h2>
              <p>
                Fabric prices displayed on QuiltCorgi are sourced from third-party
                retailers and are updated periodically. Prices may change at any time
                without notice. QuiltCorgi does not guarantee the accuracy of pricing
                information. Always verify the final price on the retailer&apos;s website
                before purchasing.
              </p>
            </section>

            <section>
              <h2
                className="text-2xl font-semibold mb-4 text-[var(--color-text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Contact
              </h2>
              <p>
                If you have questions about our affiliate relationships, please contact us
                at{' '}
                <a
                  href="mailto:hello@quiltcorgi.com"
                  className="text-[var(--color-primary)] hover:underline"
                >
                  hello@quiltcorgi.com
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
