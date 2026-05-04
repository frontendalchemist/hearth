import { getLocale, getTranslations } from 'next-intl/server'
import { LegalPage } from '@/components/legal/legal-page'

// PLACEHOLDER. The body of this page is structured boilerplate meant to
// hit every section a typical SaaS Terms of Service is expected to cover.
// It is NOT counsel-reviewed. Replace each section with finalized text
// from legal counsel before any production launch. Section structure
// here is conventional so the rewrite is a fill-in exercise.

const LAST_UPDATED = new Date('2026-05-03T00:00:00Z')

export const metadata = {
  title: 'Terms of Service — Hearth',
}

export default async function TermsPage() {
  const t = await getTranslations('legal')
  const locale = await getLocale()

  return (
    <LegalPage
      title={t('termsTitle')}
      lastUpdatedAt={LAST_UPDATED}
      locale={locale}
      draftBannerText={t('draftBanner')}
      lastUpdatedLabel={t('lastUpdated')}
      backToHomeLabel={t('backToHome')}
    >
      <section>
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your access to and use
          of the Hearth family-caregiving platform (the &quot;Service&quot;)
          provided by Hearth (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
          By creating an account or using the Service, you agree to be bound by
          these Terms.
        </p>
      </section>

      <section>
        <h2>1. Eligibility and accounts</h2>
        <p>
          You must be at least 18 years old to create a Hearth account. You are
          responsible for maintaining the confidentiality of your account
          credentials and for all activity that occurs under your account.
          Notify us immediately of any unauthorized use.
        </p>
      </section>

      <section>
        <h2>2. Family workspaces and roles</h2>
        <p>
          Each care recipient&apos;s information lives in a family workspace
          shared with members you invite. Workspaces use three roles:
          <strong> Admin</strong> (full control, can invite and remove
          members), <strong>Coordinator</strong> (can read and edit), and
          <strong> Viewer</strong> (read-only). Admins are responsible for
          managing access; Hearth is not responsible for disputes between
          family members about role assignments or visibility settings.
        </p>
      </section>

      <section>
        <h2>3. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>
            Use the Service to upload information about a person without that
            person&apos;s knowledge, where their consent is required by law.
          </li>
          <li>
            Attempt to gain unauthorized access to any other family workspace
            or to any portion of the Service.
          </li>
          <li>
            Use the Service to send unsolicited messages, store malware, or
            interfere with other users&apos; ability to use the Service.
          </li>
          <li>
            Reverse-engineer, decompile, or attempt to extract source code
            from the Service except to the extent that law expressly permits.
          </li>
          <li>
            Use the Service in violation of any applicable law, including
            HIPAA, CCPA, or other privacy and health-information laws.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Your content</h2>
        <p>
          You retain ownership of any content you submit to the Service
          (documents, notes, photos, care-log entries, etc.). You grant Hearth
          a limited, worldwide, royalty-free license to host, copy, transmit,
          and display that content solely for the purpose of operating the
          Service for you and the other members of your family workspaces. We
          will not use your content for advertising or train third-party AI
          models on it.
        </p>
      </section>

      <section>
        <h2>5. Hearth&apos;s intellectual property</h2>
        <p>
          The Service, including the Hearth name, logo, software, and
          documentation, is owned by Hearth and licensed to you under a
          limited, non-exclusive, non-transferable license to use the Service
          in accordance with these Terms. Nothing in these Terms transfers
          ownership of any intellectual property to you.
        </p>
      </section>

      <section>
        <h2>6. Health-information disclaimer</h2>
        <p>
          Hearth is a coordination tool, not a medical service. Information
          presented in the Service is for informational and organizational
          purposes only and is not medical advice, diagnosis, or treatment.
          Always consult a qualified health-care professional for medical
          questions. Hearth does not provide emergency services; if you or a
          loved one is experiencing an emergency, call 911 or your local
          equivalent.
        </p>
      </section>

      <section>
        <h2>7. Privacy</h2>
        <p>
          Our collection, use, and disclosure of personal information is
          governed by our{' '}
          <a
            href="/privacy"
            className="text-primary underline-offset-4 hover:underline"
          >
            Privacy Policy
          </a>
          , which is incorporated into these Terms by reference.
        </p>
      </section>

      <section>
        <h2>8. Disclaimers</h2>
        <p>
          THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS
          AVAILABLE&quot; BASIS, WITHOUT WARRANTIES OF ANY KIND, WHETHER
          EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY,
          FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT, TO THE
          MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW. WE DO NOT WARRANT THAT
          THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE FROM
          UNAUTHORIZED ACCESS.
        </p>
      </section>

      <section>
        <h2>9. Limitation of liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, HEARTH AND ITS
          OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS WILL NOT BE LIABLE FOR
          ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
          DAMAGES, OR ANY LOSS OF PROFITS, REVENUES, DATA, OR GOODWILL,
          ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE. OUR
          AGGREGATE LIABILITY FOR ALL CLAIMS RELATING TO THE SERVICE WILL NOT
          EXCEED THE GREATER OF THE AMOUNTS YOU HAVE PAID US IN THE TWELVE
          MONTHS PRECEDING THE EVENT GIVING RISE TO LIABILITY OR ONE HUNDRED
          U.S. DOLLARS.
        </p>
      </section>

      <section>
        <h2>10. Indemnification</h2>
        <p>
          You agree to indemnify and hold harmless Hearth from any claim or
          demand, including reasonable attorneys&apos; fees, made by any third
          party arising out of your breach of these Terms, your violation of
          law, or the content you submit to the Service.
        </p>
      </section>

      <section>
        <h2>11. Termination</h2>
        <p>
          You may stop using the Service at any time by deleting your account
          from your account settings. We may suspend or terminate your access
          if you breach these Terms or if we are required to do so by law.
          Sections that by their nature should survive termination (including
          intellectual-property ownership, disclaimers, and limitation of
          liability) will survive.
        </p>
      </section>

      <section>
        <h2>12. Governing law and disputes</h2>
        <p>
          These Terms are governed by the laws of [governing-law jurisdiction
          — to be filled in by counsel], without regard to conflict-of-laws
          principles. Any dispute arising out of or relating to these Terms
          will be resolved as set forth in [dispute-resolution clause — to be
          filled in by counsel].
        </p>
      </section>

      <section>
        <h2>13. Changes to these Terms</h2>
        <p>
          We may revise these Terms. The version date appears at the top of
          this page. Material changes will be communicated through the Service
          and, where required, you will be asked to consent to the new
          version before continuing to use the Service.
        </p>
      </section>

      <section>
        <h2>14. Contact us</h2>
        <p>
          Questions about these Terms? Contact:
          <br />
          <span className="block mt-2">
            <strong>Hearth, Inc.</strong>
            <br />
            [Mailing address — to be filled in by counsel]
            <br />
            [Email address — to be filled in by counsel]
          </span>
        </p>
      </section>
    </LegalPage>
  )
}
