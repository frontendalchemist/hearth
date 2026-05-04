import { getLocale, getTranslations } from 'next-intl/server'
import { LegalPage } from '@/components/legal/legal-page'

// PLACEHOLDER. The body of this page is structured boilerplate meant to
// hit every section a HIPAA Notice of Privacy Practices and a CCPA
// disclosure page is required to cover. It is NOT counsel-reviewed.
// Replace each section with finalized text from legal counsel before any
// production launch. Section structure here intentionally mirrors the
// statutory checklists so the rewrite is a fill-in exercise, not a
// re-architecture.

const LAST_UPDATED = new Date('2026-05-03T00:00:00Z')

export const metadata = {
  title: 'Privacy Policy — Hearth',
}

export default async function PrivacyPage() {
  const t = await getTranslations('legal')
  const locale = await getLocale()

  return (
    <LegalPage
      title={t('privacyTitle')}
      lastUpdatedAt={LAST_UPDATED}
      locale={locale}
      draftBannerText={t('draftBanner')}
      lastUpdatedLabel={t('lastUpdated')}
      backToHomeLabel={t('backToHome')}
    >
      <section>
        <p>
          This Privacy Policy explains how Hearth (&quot;we,&quot; &quot;us,&quot; or
          &quot;our&quot;) collects, uses, and discloses information in connection with
          the Hearth family-caregiving platform (the &quot;Service&quot;). It also
          serves as our HIPAA Notice of Privacy Practices for protected health
          information (&quot;PHI&quot;) we handle on behalf of the families we serve,
          and our California Consumer Privacy Act (&quot;CCPA&quot;) disclosure for
          California residents.
        </p>
        <p className="mt-3 font-semibold">
          THIS NOTICE DESCRIBES HOW MEDICAL INFORMATION ABOUT YOU OR YOUR FAMILY
          MEMBER MAY BE USED AND DISCLOSED AND HOW YOU CAN GET ACCESS TO THIS
          INFORMATION. PLEASE REVIEW IT CAREFULLY.
        </p>
      </section>

      <section>
        <h2>1. Information we collect</h2>
        <p>We collect the following categories of personal information:</p>
        <ul>
          <li>
            <strong>Identifiers</strong>: name, email address, account ID,
            authentication tokens.
          </li>
          <li>
            <strong>Profile data</strong>: relationship to the care recipient,
            preferred locale, geographic region.
          </li>
          <li>
            <strong>Care-recipient information you provide</strong>: name, date
            of birth, contact information, medical conditions, medications,
            allergies, providers, appointments, screenings, advance directives,
            and documents you upload (PDFs, images).
          </li>
          <li>
            <strong>Care-coordination activity</strong>: tasks, care-log
            entries, AI assistant conversations (with personal identifiers
            stripped before any third-party API call).
          </li>
          <li>
            <strong>Technical data</strong>: device type, browser, IP address,
            session timestamps, error reports.
          </li>
        </ul>
        <p>
          We do not collect categories of sensitive information beyond those
          you provide to us in the course of using the Service.
        </p>
      </section>

      <section>
        <h2>2. How we use your information</h2>
        <p>
          We use the information described above to operate, maintain, and
          improve the Service; to deliver the features you request; to
          communicate with you about your account; to detect and prevent fraud
          or abuse; to comply with legal obligations; and to make limited,
          aggregated product-improvement decisions. We do not sell personal
          information.
        </p>
      </section>

      <section>
        <h2>3. How we share your information</h2>
        <p>
          We share information only with: (a) other members of the same family
          workspace, scoped to their assigned role (Admin, Coordinator, or
          Viewer); (b) service providers who process data on our behalf under
          written agreements (cloud hosting, error tracking, analytics with
          PHI masking enforced); (c) authorities, when legally required; and
          (d) successors, if Hearth is acquired or reorganized, subject to
          this Policy.
        </p>
      </section>

      <section>
        <h2>4. HIPAA — uses and disclosures of PHI</h2>
        <p>
          We may use and disclose PHI for treatment, payment, and health-care
          operations only as directed by family members with administrative
          rights over a workspace. We will not use or disclose PHI for
          marketing or sell PHI without your prior written authorization.
          Other uses and disclosures not described in this Notice will be made
          only with your written authorization, which you may revoke at any
          time except to the extent we have already acted on it.
        </p>
      </section>

      <section>
        <h2>5. Your rights — HIPAA</h2>
        <ul>
          <li>Right to inspect and obtain a copy of PHI we maintain.</li>
          <li>Right to request an amendment to inaccurate PHI.</li>
          <li>
            Right to request an accounting of certain disclosures we have made.
          </li>
          <li>Right to request restrictions on certain uses and disclosures.</li>
          <li>
            Right to request confidential communications by alternative means
            or at alternative locations.
          </li>
          <li>
            Right to a paper copy of this Notice, even if you have agreed to
            receive it electronically.
          </li>
        </ul>
      </section>

      <section>
        <h2>6. Your rights — CCPA (California residents)</h2>
        <ul>
          <li>
            <strong>Right to know</strong>: request the categories and specific
            pieces of personal information we have collected about you. Use
            the &quot;Export my data&quot; option in your account.
          </li>
          <li>
            <strong>Right to delete</strong>: request deletion of personal
            information we hold about you, subject to limited exceptions
            (including HIPAA-mandated audit retention). Use the &quot;Delete my
            account&quot; option in your account.
          </li>
          <li>
            <strong>Right to correct</strong>: request that inaccurate personal
            information be corrected.
          </li>
          <li>
            <strong>Right to non-discrimination</strong>: we will not deny you
            the Service or charge you a different price for exercising any of
            these rights.
          </li>
        </ul>
      </section>

      <section>
        <h2>7. How to exercise your rights</h2>
        <p>
          You may exercise rights described above by using the in-product
          controls in your account settings, by contacting us at the address
          below, or by writing to us. We will verify your identity before
          fulfilling a request and respond within the timelines required by
          applicable law (45 days for CCPA requests, extendable once).
        </p>
      </section>

      <section>
        <h2>8. Children&apos;s privacy</h2>
        <p>
          The Service is not directed to children under 13 and we do not
          knowingly collect personal information directly from children under
          13. Care recipients identified by adult caregivers may be of any age;
          information about minor care recipients is treated with the same
          confidentiality as adult care recipients.
        </p>
      </section>

      <section>
        <h2>9. Security</h2>
        <p>
          We implement administrative, technical, and physical safeguards
          designed to protect personal information against unauthorized access,
          loss, or alteration. No system is perfectly secure; if we become
          aware of a breach affecting your information, we will notify you and
          relevant authorities as required by law.
        </p>
      </section>

      <section>
        <h2>10. Retention</h2>
        <p>
          We retain personal information for as long as your account is active
          and as required to provide the Service. Audit logs may be retained
          for up to seven years to satisfy HIPAA requirements, even after
          account deletion. Anonymized records that no longer identify you may
          be retained indefinitely.
        </p>
      </section>

      <section>
        <h2>11. Changes to this Policy</h2>
        <p>
          We may revise this Policy. The version date appears at the top of
          this page. Material changes will be communicated through the Service
          and, where required by law, you will be asked to consent to the new
          version before continuing to use the Service.
        </p>
      </section>

      <section>
        <h2>12. Contact us</h2>
        <p>
          To ask questions, exercise your rights, or file a complaint, contact:
          <br />
          <span className="block mt-2">
            <strong>Privacy Officer, Hearth</strong>
            <br />
            [Mailing address — to be filled in by counsel]
            <br />
            [Email address — to be filled in by counsel]
          </span>
        </p>
        <p className="mt-3">
          You may also file a complaint with the U.S. Department of Health and
          Human Services Office for Civil Rights, the California Attorney
          General, or another applicable regulator. We will not retaliate
          against you for filing a complaint.
        </p>
      </section>
    </LegalPage>
  )
}
