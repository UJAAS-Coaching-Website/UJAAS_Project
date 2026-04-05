type PolicyKind = 'privacy' | 'terms';

type PolicySection = {
  title: string;
  content: string[];
};

const policyDetails: Record<PolicyKind, {
  eyebrow: string;
  title: string;
  intro: string;
  sections: PolicySection[];
}> = {
  privacy: {
    eyebrow: 'Privacy Policy',
    title: 'How UJAAS handles student and staff data',
    intro:
      'This policy explains what information we collect, why we use it, and how we protect it when you use the UJAAS website and related services.',
    sections: [
      {
        title: 'Information we collect',
        content: [
          'Account and profile details such as name, login ID, email address, phone number, role, batch, course, and profile image where applicable.',
          'Academic and activity data such as test registrations, answers, scores, rankings, performance analytics, attendance-related records, remarks, notices, and uploaded learning material.',
          'Messages and queries you send through the website, including support requests and contact forms.',
        ],
      },
      {
        title: 'How we use the information',
        content: [
          'To create and manage user accounts, authenticate users, and provide access to student, faculty, and admin features.',
          'To conduct classes, tests, DPPs, reviews, rankings, analytics, and related academic operations.',
          'To communicate updates, respond to queries, maintain records, and improve the website and learning experience.',
        ],
      },
      {
        title: 'Sharing and disclosure',
        content: [
          'We do not sell personal information.',
          'We may share data with authorized faculty, admins, and staff who need it to operate the institute and provide support.',
          'We may disclose information if required by law, regulation, court order, or to protect the security and integrity of the platform.',
        ],
      },
      {
        title: 'Storage and security',
        content: [
          'We use reasonable administrative and technical safeguards to protect personal data against unauthorized access, loss, misuse, or alteration.',
          'Authentication tokens and similar session data may be stored in browser storage to keep users signed in. We do not use cookies for advertising or tracking at this time.',
          'No online system is completely secure, so we cannot guarantee absolute security.',
        ],
      },
      {
        title: 'Your choices',
        content: [
          'You may request access, correction, or deletion of your personal information, subject to legitimate institutional and legal requirements.',
          'If you believe your account information is inaccurate, contact us so we can review and update it where appropriate.',
          'You can log out at any time and close your browser to end the active session.',
        ],
      },
      {
        title: 'Children and students',
        content: [
          'Our services are intended for students and staff of the institute and may include minors under the supervision of parents, guardians, or the institute.',
          'Where required, the institute should obtain the necessary consent and follow applicable rules for handling student records.',
        ],
      },
      {
        title: 'Contact',
        content: [
          'For questions or privacy requests, contact us at ujas2.0.nvs@gmail.com.',
        ],
      },
    ],
  },
  terms: {
    eyebrow: 'Terms and Conditions',
    title: 'Rules for using the UJAAS website and services',
    intro:
      'These terms govern your access to the UJAAS website, dashboards, tests, learning material, and related features. By using the site, you agree to follow these terms.',
    sections: [
      {
        title: 'Acceptance of terms',
        content: [
          'By accessing or using the website, you agree to these terms and any additional rules posted for specific features.',
          'If you do not agree, you should not use the website or associated services.',
        ],
      },
      {
        title: 'Account responsibility',
        content: [
          'You are responsible for keeping your login details confidential and for activity that occurs under your account.',
          'You must provide accurate information and notify us if you believe your account has been compromised.',
        ],
      },
      {
        title: 'Acceptable use',
        content: [
          'Do not misuse the site, attempt unauthorized access, interfere with system operation, or upload harmful, illegal, or infringing content.',
          'Do not copy, share, or redistribute test papers, solutions, notes, or other content in ways that violate institute rules or applicable law.',
        ],
      },
      {
        title: 'Content and intellectual property',
        content: [
          'The website, branding, course material, test material, and related content belong to UJAAS or its licensors unless stated otherwise.',
          'You may use the content only for personal educational purposes within the institute context unless you receive written permission otherwise.',
        ],
      },
      {
        title: 'Educational information',
        content: [
          'Scores, rankings, analytics, reviews, and progress indicators are provided for educational and administrative use.',
          'We try to keep information accurate, but occasional delays or errors may occur, and final academic decisions remain with the institute.',
        ],
      },
      {
        title: 'Results and outcomes',
        content: [
          'Results may vary based on student effort, attendance, preparation, and other individual factors.',
          'Any rankings, scores, or performance improvements shown on the website are not a guarantee of future academic outcomes.',
        ],
      },
      {
        title: 'Suspension and termination',
        content: [
          'We may suspend or terminate access if we believe these terms have been violated or if account protection or site stability is at risk.',
          'We may also restrict features for maintenance, security, or operational reasons.',
        ],
      },
      {
        title: 'Warranty disclaimer',
        content: [
          'The website is provided on an as-is and as-available basis to the extent permitted by law.',
          'We do not guarantee uninterrupted availability or that every result, recommendation, or record will be error-free.',
        ],
      },
      {
        title: 'Changes and contact',
        content: [
          'We may update these terms from time to time. Continued use of the website after changes means you accept the revised terms.',
          'For questions about these terms, contact ujas2.0.nvs@gmail.com.',
        ],
      },
    ],
  },
};

export interface LegalPolicyPageProps {
  kind: PolicyKind;
}

export default function LegalPolicyPage({ kind }: LegalPolicyPageProps) {
  const policy = policyDetails[kind];

  return (
    <div className="min-h-screen bg-white px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="mb-6 inline-block text-sm text-teal-700 underline underline-offset-4"
        >
          Back
        </button>

        <div className="space-y-8">
          <header className="space-y-3 border-b border-slate-200 pb-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{policy.eyebrow}</p>
            <h1 className="text-2xl font-bold sm:text-3xl">{policy.title}</h1>
            <p className="text-sm leading-7 text-slate-700 sm:text-base">{policy.intro}</p>
            <p className="text-xs text-slate-500">Last updated: April 5, 2026</p>
          </header>

          <main className="space-y-6">
            {policy.sections.map((section) => (
              <section key={section.title} className="space-y-2">
                <h2 className="text-lg font-semibold">{section.title}</h2>
                <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700 sm:text-base">
                  {section.content.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </section>
            ))}
          </main>

          <footer className="border-t border-slate-200 pt-4 text-xs leading-6 text-slate-500">
            If we ever add cookies, payments, or new data collection, we will update the policies accordingly.
          </footer>
        </div>
      </div>
    </div>
  );
}
