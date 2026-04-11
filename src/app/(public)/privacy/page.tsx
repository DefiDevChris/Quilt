import type { Metadata } from 'next';
import PublicNav from '@/components/landing/PublicNav';
import Footer from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Quilt Studio Privacy Policy — how we collect, use, and protect your personal information.',
};

export default function PrivacyPage() {
  return (
    <>
      <PublicNav />
      <main className="max-w-3xl mx-auto px-6 py-16 lg:py-24">
        <div className="mb-20">
          <h1
            className="text-[40px] leading-[52px] font-normal text-[#1a1a1a] mb-6"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Privacy Policy
          </h1>
          <div className="flex items-center gap-4">
            <div className="h-0.5 w-12 bg-[#1a1a1a]" />
            <p className="text-[14px] leading-[20px] font-normal text-[#4a4a4a]">Effective: March 30, 2026</p>
          </div>
        </div>

        <div className="text-[#4a4a4a] space-y-10 max-w-2xl mx-auto text-[0.95rem] leading-relaxed">
          <p>
            Your privacy matters to us. This Privacy Policy explains how Quilt Studio LLC
            (&ldquo;Quilt Studio,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;)
            collects, uses, shares, and protects your personal information when you use our website,
            design studio, community features, and related services (collectively, the
            &ldquo;Service&rdquo;).
          </p>
          <p>
            By using the Service, you agree to the practices described in this policy. If you do not
            agree, please do not use the Service.
          </p>

          {/* 1. Information We Collect */}
          <section>
            <h2 className="text-[24px] leading-[32px] font-normal text-[#1a1a1a] mb-6 flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-[#ff8d49]/60 rounded-lg" />
              1. Information We Collect
            </h2>

            <h3 className="text-[24px] leading-[32px] font-normal text-[#1a1a1a] mt-5 mb-2">
              Information You Provide to Us
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Account information.</strong> We collect only your name and email address.
                That is all we require to create an account. Account authentication is handled by
                AWS Cognito.
              </li>
              <li>
                <strong>Profile information.</strong> If you choose to set up a community profile,
                we collect your display name, username, bio, avatar image, location, website URL,
                and optional social media handles (Instagram, YouTube, TikTok). You may also provide
                a public email address.
              </li>
              <li>
                <strong>Payment information.</strong> All billing and payment processing is handled
                entirely by Stripe. We never see, collect, or store your credit card number, bank
                account details, or any other payment instrument. What we receive from Stripe is
                limited to a customer ID, your subscription plan, billing period dates, and
                subscription status&mdash;just enough to know whether your Pro subscription is
                active.
              </li>
              <li>
                <strong>Quilt designs and project data.</strong> We store the quilt designs you
                create in the studio, including canvas data, grid settings, dimensions, and
                thumbnails. If you choose to share projects publicly, they will be visible to other
                users.
              </li>
              <li>
                <strong>Fabric images.</strong> Pro subscribers can upload custom fabric images,
                which are stored securely on AWS S3 and served via CloudFront CDN.
              </li>
              <li>
                <strong>Community content.</strong> When you post in Social Threads, leave comments,
                or like content, we collect and store that content along with your user identifier.
              </li>
              <li>
                <strong>Communications.</strong> If you contact us for support, we collect your
                email address and the content of your message.
              </li>
            </ul>

            <h3 className="text-[24px] leading-[32px] font-normal text-[#1a1a1a] mt-5 mb-2">
              Information Collected Automatically
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Authentication cookies.</strong> We use HTTP-only cookies to maintain your
                session and authenticate your requests. These cookies are essential to the Service
                and cannot be disabled while using the Service. See Section 7 for details.
              </li>
              <li>
                <strong>Usage data.</strong> Our servers automatically log technical information
                such as your IP address, browser type, device type, and pages visited. We use this
                information for security, rate limiting, and to ensure the Service operates
                correctly.
              </li>
            </ul>

            <h3 className="text-[24px] leading-[32px] font-normal text-[#1a1a1a] mt-5 mb-2">
              Information We Do <em>Not</em> Collect
            </h3>
            <p>
              We do not use third-party analytics services, advertising trackers, or social media
              pixels. We do not track your browsing activity on other websites. We do not collect
              biometric data, precise geolocation, or sensitive personal information beyond your
              name and email address (which are all we need to create your account).
            </p>
          </section>

          {/* 2. How We Use Your Information */}
          <section>
            <h2 className="text-[24px] leading-[32px] font-normal text-[#1a1a1a] mb-6 flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-[#ff8d49]/60 rounded-lg" />
              2. How We Use Your Information
            </h2>
            <p className="mb-3">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, maintain, and improve the Service.</li>
              <li>Create and manage your account.</li>
              <li>Process subscriptions and payments through Stripe.</li>
              <li>Store and sync your quilt designs, fabric libraries, and project data.</li>
              <li>Enable community features such as Social Threads, comments, and profiles.</li>
              <li>
                Send you transactional emails (account verification, password resets, billing
                notifications).
              </li>
              <li>Respond to your questions and provide customer support.</li>
              <li>Detect, prevent, and address fraud, abuse, and security incidents.</li>
              <li>Enforce rate limits and ensure fair use of the Service.</li>
              <li>Comply with legal obligations.</li>
            </ul>
            <p className="mt-3">
              We do not use your personal information for targeted advertising, profiling, or
              automated decision-making.
            </p>
          </section>

          {/* 3. How We Share Your Information */}
          <section>
            <h2 className="text-[24px] leading-[32px] font-normal text-[#1a1a1a] mb-6 flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-[#ff8d49]/60 rounded-lg" />
              3. How We Share Your Information
            </h2>
            <p className="mb-3">
              <strong>We do not sell your personal information.</strong> We share data only in the
              following limited circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Service providers.</strong> We share data with trusted third-party providers
                who help us operate the Service:
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>
                    <strong>Stripe</strong> &mdash; payment processing and subscription management.
                  </li>
                  <li>
                    <strong>Amazon Web Services (AWS)</strong> &mdash; cloud infrastructure,
                    database hosting, file storage (S3), and content delivery (CloudFront).
                  </li>
                  <li>
                    <strong>AWS Cognito</strong> &mdash; user authentication and identity
                    management.
                  </li>
                  <li>
                    <strong>Upstash</strong> &mdash; rate limiting to protect the Service from
                    abuse.
                  </li>
                </ul>
                These providers are contractually obligated to use your data only for the services
                they provide to us.
              </li>
              <li>
                <strong>Community content.</strong> Content you post publicly in Social Threads
                (including posts, comments, your profile, and shared project thumbnails) is visible
                to other users of the Service.
              </li>
              <li>
                <strong>Legal requirements.</strong> We may disclose your information if required by
                law, regulation, legal process, or governmental request, or if we believe disclosure
                is necessary to protect the rights, property, or safety of Quilt Studio, our users, or
                the public.
              </li>
              <li>
                <strong>Business transfers.</strong> In the event of a merger, acquisition, or sale
                of all or a portion of our assets, your information may be transferred as part of
                that transaction. We will notify you before your information is transferred and
              </li>
              <li>
                <strong>With your consent.</strong> We may share your information with third parties
                when you explicitly direct us to do so.
              </li>
            </ul>
          </section>

          {/* 4. Data Retention */}
          <section>
            <h2 className="text-[24px] leading-[32px] font-normal text-[#1a1a1a] mb-6 flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-[#ff8d49]/60 rounded-lg" />4. Data Retention</h2>
            <p className="mb-3">
              We retain your information for as long as your account is active or as needed to
              provide you the Service. Specifically:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Account data</strong> is retained for the lifetime of your account.
              </li>
              <li>
                <strong>Project and design data</strong> is retained while your account exists or
                until you delete individual projects.
              </li>
              <li>
                <strong>Community content</strong> (posts, comments) may persist after account
                deletion if it has been interacted with by other users (e.g., replies exist).
              </li>
              <li>
                <strong>Payment records</strong> are retained as required by applicable tax and
                financial regulations.
              </li>
              <li>
                <strong>Server logs</strong> are retained for a limited period for security and
                debugging purposes.
              </li>
            </ul>
            <p className="mt-3">
              When you delete your account, we will delete or anonymize your personal information
              within a reasonable timeframe, except where retention is required by law or for the
              exercise or defense of legal claims.
            </p>
          </section>

          {/* 5. Security */}
          <section>
            <h2 className="text-[24px] leading-[32px] font-normal text-[#1a1a1a] mb-6 flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-[#ff8d49]/60 rounded-lg" />5. Data Security</h2>
            <p className="mb-3">
              We take the security of your data seriously. Our security measures include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Encryption in transit.</strong> All connections to the Service use TLS
                encryption (HTTPS).
              </li>
              <li>
                <strong>HTTP-only cookies.</strong> Authentication tokens are stored in HTTP-only
                cookies that are inaccessible to JavaScript, protecting against cross-site scripting
                attacks.
              </li>
              <li>
                <strong>Security headers.</strong> We enforce Content-Security-Policy, HSTS,
                X-Frame-Options, and other security headers to protect against common web
                vulnerabilities.
              </li>
              <li>
                <strong>Rate limiting.</strong> All API endpoints are protected by rate limiting to
                prevent brute-force attacks and abuse.
              </li>
              <li>
                <strong>Access controls.</strong> We restrict internal access to your data to
                authorized personnel who need it to operate the Service.
              </li>
              <li>
                <strong>AWS infrastructure.</strong> Your data is stored on Amazon Web Services,
                which provides industry-standard physical and network security.
              </li>
            </ul>
            <p className="mt-3">
              No method of transmission over the Internet or electronic storage is 100% secure.
              While we strive to protect your personal information, we cannot guarantee its absolute
              security.
            </p>
          </section>

          {/* 6. Your Rights & Choices */}
          <section>
            <h2 className="text-[24px] leading-[32px] font-normal text-[#1a1a1a] mb-6 flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-[#ff8d49]/60 rounded-lg" />
              6. Your Rights &amp; Choices
            </h2>
            <p className="mb-3">
              Depending on your location, you may have certain rights regarding your personal
              information. We extend these rights to all users, regardless of where you live:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Access.</strong> You can request a copy of the personal information we hold
                about you.
              </li>
              <li>
                <strong>Correction.</strong> You can update your account and profile information at
                any time through your account settings.
              </li>
              <li>
                <strong>Deletion.</strong> You can delete your projects and account. Upon account
                deletion, we will remove your personal data in accordance with our retention policy.
              </li>
              <li>
                <strong>Data portability.</strong> You can export your quilt designs in multiple
                formats (PDF, PNG, SVG).
              </li>
              <li>
                <strong>Restriction.</strong> You can request that we restrict the processing of
                your information in certain circumstances.
              </li>
              <li>
                <strong>Objection.</strong> You can object to the processing of your personal
                information where we rely on legitimate interests.
              </li>
              <li>
                <strong>Withdraw consent.</strong> Where we rely on your consent to process data,
                you may withdraw that consent at any time.
              </li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at{' '}
              <a
                href="mailto:support@quiltcorgi.com"
                className="text-[#1a1a1a] underline underline-offset-4 hover:text-[#ff8d49] transition-colors duration-150"
              >
                support@quiltcorgi.com
              </a>
              . We will respond to your request within 30 days.
            </p>
          </section>

          {/* 7. Cookies */}
          <section>
            <h2 className="text-[24px] leading-[32px] font-normal text-[#1a1a1a] mb-6 flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-[#ff8d49]/60 rounded-lg" />
              7. Cookies &amp; Authentication
            </h2>
            <p className="mb-3">
              Quilt Studio uses only essential cookies that are necessary for the Service to function.
              We do not use cookies for advertising, analytics, or tracking purposes.
            </p>
            <p className="mb-3">The cookies we use are:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <code className="text-sm bg-[#fdfaf7] px-1.5 py-0.5 rounded">
                  qc_id_token
                </code>{' '}
                &mdash; Your authentication token (expires with your session, typically 1 hour).
              </li>
              <li>
                <code className="text-sm bg-[#fdfaf7] px-1.5 py-0.5 rounded">
                  qc_access_token
                </code>{' '}
                &mdash; API access token (expires with your session).
              </li>
              <li>
                <code className="text-sm bg-[#fdfaf7] px-1.5 py-0.5 rounded">
                  qc_refresh_token
                </code>{' '}
                &mdash; Used to renew your session (max age: 30 days).
              </li>
              <li>
                <code className="text-sm bg-[#fdfaf7] px-1.5 py-0.5 rounded">
                  qc_user_role
                </code>{' '}
                &mdash; Stores your account role for access control (max age: 1 hour).
              </li>
            </ul>
            <p className="mt-3">
              All cookies are set as{' '}
              <code className="text-sm bg-[#fdfaf7] px-1.5 py-0.5 rounded">
                HttpOnly
              </code>
              ,{' '}
              <code className="text-sm bg-[#fdfaf7] px-1.5 py-0.5 rounded">
                Secure
              </code>{' '}
              (in production), and{' '}
              <code className="text-sm bg-[#fdfaf7] px-1.5 py-0.5 rounded">
                SameSite=Lax
              </code>
              . They cannot be accessed by client-side JavaScript.
            </p>
            <p className="mt-3">
              Because we only use essential cookies, there is no cookie consent banner&mdash;these
              cookies are strictly necessary for authentication and cannot be disabled while using
              the Service.
            </p>
          </section>

          {/* 8. International Data Transfers */}
          <section>
            <h2 className="text-[24px] leading-[32px] font-normal text-[#1a1a1a] mb-6 flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-[#ff8d49]/60 rounded-lg" />
              8. International Data Transfers
            </h2>
            <p className="mb-3">
              Quilt Studio is operated in the United States. If you are accessing the Service from
              outside the United States, please be aware that your information may be transferred
              to, stored, and processed in the United States or other jurisdictions where our
              service providers operate.
            </p>
            <p>
              Data protection laws in the United States may differ from those in your country of
              residence. By using the Service, you consent to the transfer of your information to
              the United States and other jurisdictions as described in this policy.
            </p>
          </section>

          {/* 9. GDPR Rights (European Economic Area) */}
          <section>
            <h2 className="text-[24px] leading-[32px] font-normal text-[#1a1a1a] mb-6 flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-[#ff8d49]/60 rounded-lg" />
              9. European Economic Area (EEA) &amp; UK Users
            </h2>
            <p className="mb-3">
              If you are located in the European Economic Area, the United Kingdom, or Switzerland,
              you have additional rights under the General Data Protection Regulation (GDPR).
            </p>

            <h3 className="text-[24px] leading-[32px] font-normal text-[#1a1a1a] mt-5 mb-2">
              Legal Bases for Processing
            </h3>
            <p className="mb-3">
              We process your personal data based on the following legal grounds:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Performance of a contract.</strong> Processing necessary to provide the
                Service you signed up for (account management, design tools, community features,
                payment processing).
              </li>
              <li>
                <strong>Legitimate interests.</strong> Processing necessary for our legitimate
                interests in operating, securing, and improving the Service, provided these are not
                overridden by your rights (rate limiting, fraud prevention, server logs).
              </li>
              <li>
                <strong>Consent.</strong> Where you have given us specific consent to process your
                data for a particular purpose (optional profile fields, public community content).
                You may withdraw consent at any time.
              </li>
              <li>
                <strong>Legal obligation.</strong> Processing necessary to comply with applicable
                laws (tax records, lawful requests from authorities).
              </li>
            </ul>

            <h3 className="text-[24px] leading-[32px] font-normal text-[#1a1a1a] mt-5 mb-2">
              International Transfers
            </h3>
            <p>
              When we transfer personal data from the EEA or UK to countries that have not been
              deemed to provide an adequate level of data protection, we rely on appropriate
              safeguards such as Standard Contractual Clauses approved by the European Commission.
            </p>
          </section>

          {/* 10. Children's Privacy */}
          <section>
            <h2 className="text-[24px] leading-[32px] font-normal text-[#1a1a1a] mb-6 flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-[#ff8d49]/60 rounded-lg" />
              10. Children&rsquo;s Privacy
            </h2>
            <p>
              Quilt Studio is not directed to children under the age of 13. We do not knowingly
              collect personal information from children under 13. If we learn that we have
              inadvertently collected personal information from a child under 13, we will delete
              that information as quickly as possible. If you believe a child under 13 has provided
              us with personal information, please contact us at{' '}
              <a
                href="mailto:support@quiltcorgi.com"
                className="text-[#1a1a1a] underline underline-offset-4 hover:text-[#ff8d49] transition-colors duration-150"
              >
                support@quiltcorgi.com
              </a>
              .
            </p>
          </section>

          {/* 11. Changes to This Policy */}
          <section>
            <h2 className="text-[24px] leading-[32px] font-normal text-[#1a1a1a] mb-6 flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-[#ff8d49]/60 rounded-lg" />
              11. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. If we make material changes, we
              will notify you by email or by posting a notice on the Service prior to the change
              becoming effective. We encourage you to review this policy periodically. Your
              continued use of the Service after any changes constitutes your acceptance of the
              updated policy.
            </p>
          </section>

          {/* 12. Contact */}
          <section>
            <h2 className="text-[24px] leading-[32px] font-normal text-[#1a1a1a] mb-6 flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-[#ff8d49]/60 rounded-lg" />12. Contact Us</h2>
            <p>
              If you have questions, concerns, or requests regarding this Privacy Policy or our data
              practices, please reach out:{' '}
              <a
                href="mailto:support@quiltcorgi.com"
                className="text-[#1a1a1a] underline underline-offset-4 hover:text-[#ff8d49] transition-colors duration-150"
              >
                support@quiltcorgi.com
              </a>
            </p>
            <p className="mt-3">
              Quilt Studio LLC
              <br />
              Wyoming, United States
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
