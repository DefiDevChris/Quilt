import type { Metadata } from 'next';
import PublicNav from '@/components/landing/PublicNav';
import Footer from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Quilt Studio Terms of Service — the rules for using our quilt design studio and community.',
};

export default function TermsPage() {
  return (
    <>
      <PublicNav />
      <main className="max-w-3xl mx-auto px-6 py-16 lg:py-24">
        <div className="mb-20">
          <h1
            className="text-[40px] leading-[52px] font-normal text-[#1a1a1a] mb-6"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Terms of Service
          </h1>
          <div className="flex items-center gap-4">
            <div className="h-0.5 w-12 bg-[#1a1a1a]" />
            <p className="text-[14px] leading-[20px] font-normal text-[#4a4a4a]">Effective: March 30, 2026</p>
          </div>
        </div>

        <div className="text-[#4a4a4a] space-y-10 max-w-2xl mx-auto text-[0.95rem] leading-relaxed">
          <p>
            Welcome to Quilt Studio! These Terms of Service (&ldquo;Terms&rdquo;) govern your access
            to and use of the Quilt Studio website, design studio, community features, and related
            services (collectively, the &ldquo;Service&rdquo;). The Service is operated by
            Quilt Studio LLC (&ldquo;Quilt Studio,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or
            &ldquo;our&rdquo;), a Wyoming limited liability company.
          </p>
          <p>
            By creating an account, accessing, or using the Service, you agree to be bound by these
            Terms. If you do not agree, do not use the Service.
          </p>

          {/* 1. Eligibility */}
          <section>
            <h2 className="text-[24px] leading-[32px] font-normal text-[#1a1a1a] mb-6 flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-[#ff8d49]/60 rounded-lg" />1. Eligibility</h2>
            <p>
              You must be at least 13 years old to create an account or use the Service. If you are
              under 18, you represent that you have your parent or legal guardian&rsquo;s permission
              to use the Service. By using Quilt Studio, you represent and warrant that you meet these
              requirements and have the legal capacity to enter into these Terms.
            </p>
          </section>

          {/* 2. Accounts & Security */}
          <section>
            <h2 className="text-[24px] leading-[32px] font-normal text-[#1a1a1a] mb-6 flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-[#ff8d49]/60 rounded-lg" />
              2. Accounts &amp; Security
            </h2>
            <p className="mb-3">
              To access certain features, you must create an account. When you do:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                You must provide accurate, current, and complete information during registration.
              </li>
              <li>
                You are responsible for safeguarding your password and for all activity that occurs
                under your account.
              </li>
              <li>You agree not to share your login credentials with any third party.</li>
              <li>
                You must notify us immediately at{' '}
                <a
                  href="mailto:support@quiltcorgi.com"
                  className="text-[#1a1a1a] underline underline-offset-4 hover:text-[#ff8d49] transition-colors duration-150"
                >
                  support@quiltcorgi.com
                </a>{' '}
                if you suspect unauthorized access to your account.
              </li>
            </ul>
            <p className="mt-3">
              We are not liable for any loss or damage arising from your failure to maintain the
              confidentiality of your account credentials.
            </p>
          </section>

          {/* 3. Subscriptions, Payments & Billing */}
          <section>
            <h2 className="text-[24px] leading-[32px] font-normal text-[#1a1a1a] mb-6 flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-[#ff8d49]/60 rounded-lg" />
              3. Subscriptions, Payments &amp; Billing
            </h2>
            <p className="mb-3">
              Quilt Studio offers a free tier and a paid Pro subscription. The free tier includes
              access to all design tools with limits on saved blocks, fabrics, and pattern library
              size. The Pro subscription unlocks unlimited saving, the full block library, fabric
              uploads, all export formats, and community posting.
            </p>
            <p className="mb-3">Pro subscription plans:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Monthly:</strong> $8 per month, billed monthly.
              </li>
              <li>
                <strong>Annual:</strong> $60 per year, billed annually (37% savings).
              </li>
            </ul>
            <p className="mt-3">
              All billing and payment processing is handled entirely by Stripe, a third-party
              payment processor. Quilt Studio does not collect, process, or store your credit card
              number, bank details, or any other payment instrument on its servers. By subscribing,
              you agree to Stripe&rsquo;s{' '}
              <a
                href="https://stripe.com/legal/ssa"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1a1a1a] underline underline-offset-4 hover:text-[#ff8d49] transition-colors duration-150"
              >
                Services Agreement
              </a>{' '}
              and acknowledge Stripe&rsquo;s{' '}
              <a
                href="https://stripe.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1a1a1a] underline underline-offset-4 hover:text-[#ff8d49] transition-colors duration-150"
              >
                Privacy Policy
              </a>
              .
            </p>
            <p className="mt-3">
              Subscriptions automatically renew at the end of each billing period until you cancel.
              You may cancel your subscription at any time through your account billing page. Upon
              cancellation, your Pro access continues through the end of the current billing period.
              We do not provide refunds or credits for partial billing periods.
            </p>
            <p className="mt-3">
              If a payment fails, we may suspend Pro features after a brief grace period. Continued
              non-payment may result in account downgrade to the free tier.
            </p>
          </section>

          {/* 4. User Content & Intellectual Property */}
          <section>
            <h2 className="text-[24px] leading-[32px] font-normal text-[#1a1a1a] mb-6 flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-[#ff8d49]/60 rounded-lg" />
              4. User Content &amp; Intellectual Property
            </h2>
            <p className="mb-3">
              <strong>Your content is yours.</strong> You retain all intellectual property rights to
              the quilt designs, patterns, fabric images, and any other content you create or upload
              using the Service (&ldquo;User Content&rdquo;).
            </p>
            <p className="mb-3">
              By posting or sharing User Content in the community features (such as Social Threads),
              you grant Quilt Studio a non-exclusive, worldwide, royalty-free license to host,
              display, and distribute that content within the Service for the purpose of operating
              and improving the platform. This license ends when you delete your content or your
              account, except where the content has been shared with others and they have not
              deleted it, or where we are required to retain it by law.
            </p>
            <p className="mb-3">
              You may set your projects as private or public. Private projects are visible only to
              you and will not be shared in the community.
            </p>
            <p>
              Quilt Studio&rsquo;s name, logo, the design studio interface, and all related software
              are the property of Quilt Studio LLC. You may not copy, modify, distribute, or create
              derivative works of our proprietary software or branding without our prior written
              consent.
            </p>
          </section>

          {/* 5. Community Guidelines & Acceptable Use */}
          <section>
            <h2 className="text-[24px] leading-[32px] font-normal text-[#1a1a1a] mb-6 flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-[#ff8d49]/60 rounded-lg" />
              5. Community Guidelines &amp; Acceptable Use
            </h2>
            <p className="mb-3">
              Quilt Studio is a community built by and for quilters. We want everyone to feel welcome.
              By using the community features, you agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Treat other quilters with kindness and respect.</li>
              <li>Only post content you have the right to share.</li>
              <li>Keep your posts relevant to quilting, sewing, and related creative topics.</li>
              <li>Respect rate limits and community posting guidelines.</li>
            </ul>
            <p className="mt-3">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Harass, bully, threaten, or intimidate other users.</li>
              <li>Post spam, advertisements, or commercial solicitation.</li>
              <li>Upload malicious code, viruses, or harmful content.</li>
              <li>
                Impersonate any person or entity, or falsely represent your affiliation with any
                person or entity.
              </li>
              <li>
                Use the Service for any unlawful purpose or in violation of any applicable law.
              </li>
              <li>
                Attempt to circumvent rate limits, access controls, or other security measures.
              </li>
              <li>
                Scrape, data-mine, or systematically extract content from the Service without
                permission.
              </li>
            </ul>
            <p className="mt-3">
              We reserve the right, at our sole discretion, to remove content, suspend community
              privileges, or terminate accounts that violate these guidelines.
            </p>
          </section>

          {/* 6. DMCA & Copyright */}
          <section>
            <h2 className="text-[24px] leading-[32px] font-normal text-[#1a1a1a] mb-6 flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-[#ff8d49]/60 rounded-lg" />
              6. DMCA &amp; Copyright Infringement
            </h2>
            <p className="mb-3">
              We respect the intellectual property rights of others and expect our users to do the
              same. In accordance with the Digital Millennium Copyright Act (17 U.S.C. &sect; 512),
              we will respond to notices of alleged copyright infringement that comply with the law.
            </p>
            <p className="mb-3">
              If you believe that content on Quilt Studio infringes your copyright, please send a
              written notice to our designated copyright agent including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                A physical or electronic signature of the copyright owner or authorized agent.
              </li>
              <li>Identification of the copyrighted work claimed to have been infringed.</li>
              <li>Identification of the infringing material and its location on the Service.</li>
              <li>
                Your contact information (name, address, telephone number, and email address).
              </li>
              <li>A statement that you have a good-faith belief that the use is not authorized.</li>
              <li>
                A statement, under penalty of perjury, that the information in your notice is
                accurate and that you are authorized to act on behalf of the copyright owner.
              </li>
            </ul>
            <p className="mt-3">
              Send DMCA notices to:{' '}
              <a
                href="mailto:support@quiltcorgi.com"
                className="text-[#1a1a1a] underline underline-offset-4 hover:text-[#ff8d49] transition-colors duration-150"
              >
                support@quiltcorgi.com
              </a>
            </p>
            <p className="mt-3">
              We reserve the right to remove content and terminate the accounts of repeat
              infringers.
            </p>
          </section>

          {/* 7. Disclaimers */}
          <section>
            <h2 className="text-[24px] leading-[32px] font-normal text-[#1a1a1a] mb-6 flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-[#ff8d49]/60 rounded-lg" />7. Disclaimers</h2>
            <p className="mb-3">
              THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT
              WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
              IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
              NON-INFRINGEMENT.
            </p>
            <p className="mb-3">
              We do not warrant that the Service will be uninterrupted, error-free, or completely
              secure. Yardage calculations, cutting charts, and pattern exports are provided as
              design aids only&mdash;always verify measurements and material quantities before
              cutting fabric.
            </p>
            <p>
              We do not guarantee that any quilt design, pattern, or content created using the
              Service will meet your specific requirements or expectations.
            </p>
          </section>

          {/* 8. Limitation of Liability */}
          <section>
            <h2 className="text-[24px] leading-[32px] font-normal text-[#1a1a1a] mb-6 flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-[#ff8d49]/60 rounded-lg" />
              8. Limitation of Liability
            </h2>
            <p className="mb-3">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, QUILTCORGI LLC AND ITS MEMBERS,
              MANAGERS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF
              PROFITS, DATA, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR IN CONNECTION
              WITH YOUR USE OF OR INABILITY TO USE THE SERVICE.
            </p>
            <p>
              IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATING
              TO THESE TERMS OR THE SERVICE EXCEED THE AMOUNT YOU PAID TO QUILTCORGI IN THE TWELVE
              (12) MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM, OR ONE HUNDRED DOLLARS
              ($100), WHICHEVER IS GREATER.
            </p>
          </section>

          {/* 9. Binding Arbitration & Class Action Waiver */}
          <section>
            <h2 className="text-[24px] leading-[32px] font-normal text-[#1a1a1a] mb-6 flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-[#ff8d49]/60 rounded-lg" />
              9. Binding Arbitration &amp; Class Action Waiver
            </h2>
            <p className="mb-3">
              <strong>
                Please read this section carefully&mdash;it affects your legal rights.
              </strong>
            </p>
            <p className="mb-3">
              <strong>Agreement to arbitrate.</strong> You and Quilt Studio agree that any dispute,
              claim, or controversy arising out of or relating to these Terms or the Service will be
              resolved by binding individual arbitration administered by the American Arbitration
              Association (&ldquo;AAA&rdquo;) under its Consumer Arbitration Rules, rather than in
              court. The arbitration will be conducted in the English language. Judgment on the
              arbitration award may be entered in any court of competent jurisdiction.
            </p>
            <p className="mb-3">
              <strong>Class action waiver.</strong> YOU AND QUILTCORGI AGREE THAT EACH MAY BRING
              CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY, AND NOT AS A
              PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS, CONSOLIDATED, OR REPRESENTATIVE
              PROCEEDING.
            </p>
            <p className="mb-3">
              <strong>Exceptions.</strong> Either party may seek injunctive or other equitable
              relief in court to prevent the actual or threatened infringement, misappropriation, or
              violation of intellectual property rights, data security obligations, or confidential
              information. Either party may also bring an individual action in small claims court
              for disputes within that court&rsquo;s jurisdiction.
            </p>
            <p>
              <strong>Opt-out.</strong> You may opt out of this arbitration provision within 30 days
              of first accepting these Terms by sending written notice to{' '}
              <a
                href="mailto:support@quiltcorgi.com"
                className="text-[#1a1a1a] underline underline-offset-4 hover:text-[#ff8d49] transition-colors duration-150"
              >
                support@quiltcorgi.com
              </a>{' '}
              with the subject line &ldquo;Arbitration Opt-Out.&rdquo;
            </p>
          </section>

          {/* 10. Termination */}
          <section>
            <h2 className="text-[24px] leading-[32px] font-normal text-[#1a1a1a] mb-6 flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-[#ff8d49]/60 rounded-lg" />10. Termination</h2>
            <p className="mb-3">
              You may stop using the Service and delete your account at any time. Upon account
              deletion, your personal data will be handled in accordance with our Privacy Policy.
            </p>
            <p>
              We may suspend or terminate your access to the Service at any time, with or without
              cause, and with or without notice. Upon termination, your right to use the Service
              will immediately cease. Sections that by their nature should survive
              termination&mdash;including intellectual property, disclaimers, limitation of
              liability, and arbitration&mdash;will survive.
            </p>
          </section>

          {/* 11. Changes to These Terms */}
          <section>
            <h2 className="text-[24px] leading-[32px] font-normal text-[#1a1a1a] mb-6 flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-[#ff8d49]/60 rounded-lg" />
              11. Changes to These Terms
            </h2>
            <p>
              We may update these Terms from time to time. If we make material changes, we will
              notify you by email or by posting a notice on the Service prior to the change becoming
              effective. Your continued use of the Service after the effective date of revised Terms
              constitutes your acceptance of those changes. If you do not agree to the revised
              Terms, you should stop using the Service.
            </p>
          </section>

          {/* 12. Governing Law */}
          <section>
            <h2 className="text-[24px] leading-[32px] font-normal text-[#1a1a1a] mb-6 flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-[#ff8d49]/60 rounded-lg" />12. Governing Law</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of the State of
              Wyoming, without regard to its conflict-of-law principles. Subject to the arbitration
              provision above, you agree to submit to the exclusive jurisdiction of the state and
              federal courts located in Wyoming for any disputes not subject to arbitration.
            </p>
          </section>

          {/* 13. Miscellaneous */}
          <section>
            <h2 className="text-[24px] leading-[32px] font-normal text-[#1a1a1a] mb-6 flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-[#ff8d49]/60 rounded-lg" />13. Miscellaneous</h2>
            <p className="mb-3">
              <strong>Entire agreement.</strong> These Terms, together with the Privacy Policy,
              constitute the entire agreement between you and Quilt Studio regarding the Service.
            </p>
            <p className="mb-3">
              <strong>Severability.</strong> If any provision of these Terms is found to be
              unenforceable, the remaining provisions will continue in full force and effect.
            </p>
            <p className="mb-3">
              <strong>Waiver.</strong> Our failure to enforce any right or provision of these Terms
              will not be considered a waiver of that right or provision.
            </p>
            <p>
              <strong>Assignment.</strong> You may not assign or transfer these Terms without our
              prior written consent. We may assign these Terms without restriction.
            </p>
          </section>

          {/* 14. Contact */}
          <section>
            <h2 className="text-[24px] leading-[32px] font-normal text-[#1a1a1a] mb-6 flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-[#ff8d49]/60 rounded-lg" />14. Contact Us</h2>
            <p>
              If you have questions about these Terms, please reach out:{' '}
              <a
                href="mailto:support@quiltcorgi.com"
                className="text-[#1a1a1a] underline underline-offset-4 hover:text-[#ff8d49] transition-colors duration-150"
              >
                support@quiltcorgi.com
              </a>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
