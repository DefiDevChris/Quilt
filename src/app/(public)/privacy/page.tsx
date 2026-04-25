import type { Metadata } from 'next';
import PublicNav from '@/components/landing/PublicNav';
import Footer from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy - QuiltCorgi',
  description: 'QuiltCorgi Privacy Policy',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <PublicNav />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <h1
            className="text-4xl font-bold mb-4 text-default"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Privacy Policy
          </h1>
          <p className="text-dim mb-12">Last updated: April 15, 2025</p>

          <div className="prose prose-neutral max-w-none space-y-8 text-default">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-default" style={{ fontFamily: 'var(--font-heading)' }}>1. Information We Collect</h2>
              <p>We collect information you provide directly to us when you create an account, such as:</p>
              <ul className="list-disc pl-6 mt-3 space-y-1">
                <li>Name and email address</li>
                <li>Authentication data such as your password</li>
                <li>Quilt design data (block configurations, fabric selections, project metadata)</li>
                <li>Usage data and logs</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-default" style={{ fontFamily: 'var(--font-heading)' }}>2. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 mt-3 space-y-1">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices and support messages</li>
                <li>Respond to comments and questions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-default" style={{ fontFamily: 'var(--font-heading)' }}>3. Information Sharing</h2>
              <p>
                We do not share, sell, rent, or trade your personal information with third parties except as described in this
                policy. We may share information with service providers who assist in our operations and are bound by
                confidentiality agreements.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-default" style={{ fontFamily: 'var(--font-heading)' }}>4. Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your personal information against
                unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-default" style={{ fontFamily: 'var(--font-heading)' }}>5. Cookies</h2>
              <p>
                We use cookies and similar tracking technologies to track activity on our service and hold certain
                information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being
                sent.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-default" style={{ fontFamily: 'var(--font-heading)' }}>6. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 mt-3 space-y-1">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to processing of your data</li>
                <li>Request restriction of processing</li>
                <li>Request transfer of your data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-default" style={{ fontFamily: 'var(--font-heading)' }}>7. Children&rsquo;s Privacy</h2>
              <p>
                Our service does not address anyone under the age of 13. We do not knowingly collect personally
                identifiable information from children under 13.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-default" style={{ fontFamily: 'var(--font-heading)' }}>8. Changes to This Policy</h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the
                new Privacy Policy on this page.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-default" style={{ fontFamily: 'var(--font-heading)' }}>9. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at:
                <a href="mailto:privacy@quiltcorgi.com" className="text-primary">
                  privacy@quiltcorgi.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
