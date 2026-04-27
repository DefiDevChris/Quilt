import type { Metadata } from 'next';
import PublicNav from '@/components/landing/PublicNav';
import Footer from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'Terms of Service - QuiltCorgi',
  description: 'QuiltCorgi Terms of Service',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <PublicNav />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <h1
            className="text-4xl font-bold mb-4 text-default"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Terms of Service
          </h1>
          <p className="text-dim mb-12">Last updated: April 15, 2025</p>

          <div className="prose prose-neutral max-w-none space-y-8 text-default">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-default" style={{ fontFamily: 'var(--font-heading)' }}>1. Acceptance of Terms</h2>
              <p>
                By accessing and using QuiltCorgi, you accept and agree to be bound by the terms and provisions of this
                agreement. If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-default" style={{ fontFamily: 'var(--font-heading)' }}>2. Use of Service</h2>
              <p>QuiltCorgi provides a cloud-based quilt design tool. You agree to:</p>
              <ul className="list-disc pl-6 mt-3 space-y-1">
                <li>Use the service only for lawful purposes</li>
                <li>Not violate any rights of third parties</li>
                <li>Not attempt to gain unauthorized access</li>
                <li>Not use the service in any way that may harm or disrupt it</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-default" style={{ fontFamily: 'var(--font-heading)' }}>3. Accounts</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account and password and for restricting
                access to your computer. You agree to accept responsibility for all activities that occur under your
                account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-default" style={{ fontFamily: 'var(--font-heading)' }}>4. Intellectual Property</h2>
              <p>
                The service and its original content, features, and functionality are owned by QuiltCorgi and are protected
                by international copyright, trademark, patent, trade secret, and other intellectual property rights. You
                retain ownership of all designs and content you create using the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-default" style={{ fontFamily: 'var(--font-heading)' }}>5. Subscriptions and Payments</h2>
              <p>
                QuiltCorgi offers both free and paid subscription plans. Paid subscriptions are billed in advance on a
                monthly or annual basis. You may cancel your subscription at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-default" style={{ fontFamily: 'var(--font-heading)' }}>6. Disclaimer of Warranties</h2>
              <p>
                The service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without any warranties
                of any kind.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-default" style={{ fontFamily: 'var(--font-heading)' }}>7. Limitation of Liability</h2>
              <p>
                In no event shall QuiltCorgi be liable for any indirect, incidental, special, consequential, or punitive
                damages.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-default" style={{ fontFamily: 'var(--font-heading)' }}>8. Governing Law</h2>
              <p>
                These terms shall be governed by and construed in accordance with the laws of the United States, without
                regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-default" style={{ fontFamily: 'var(--font-heading)' }}>9. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. We will provide notice of significant changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-default" style={{ fontFamily: 'var(--font-heading)' }}>10. Contact Us</h2>
              <p>
                If you have any questions about these Terms, please contact us at:
                <a href="mailto:legal@quiltcorgi.com" className="text-primary">
                  legal@quiltcorgi.com
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
