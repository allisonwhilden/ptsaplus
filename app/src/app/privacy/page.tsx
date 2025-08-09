export default function PrivacyPolicy() {
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-6">Effective Date: January 9, 2025</p>

      <div className="prose prose-slate max-w-none space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
          <p>We collect information to provide PTSA services to our members:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Contact information (name, email, phone number)</li>
            <li>Membership details and payment information</li>
            <li>Event registrations and volunteer participation</li>
            <li>Children's information (with parental consent)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. COPPA Notice - Children Under 13</h2>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-4">
            <p className="font-semibold">Important Notice for Parents:</p>
            <p>We comply with the Children's Online Privacy Protection Act (COPPA). For children under 13:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>We require verifiable parental consent before collecting any information</li>
              <li>Parents can review, delete, or refuse further collection of their child's information</li>
              <li>We do not condition participation on disclosure of more information than necessary</li>
              <li>Parents can contact us at privacy@yourptsa.org for any concerns</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. How We Protect Your Information</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Encryption:</strong> All personal information is encrypted using AES-256-GCM encryption</li>
            <li><strong>Access Control:</strong> Role-based access limits who can view your information</li>
            <li><strong>Audit Logging:</strong> All access to personal data is logged and monitored</li>
            <li><strong>Secure Transmission:</strong> All data is transmitted over HTTPS</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Data Retention</h2>
          <table className="min-w-full border-collapse border border-gray-300 my-4">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-2 text-left">Data Type</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Retention Period</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Active Member Data</td>
                <td className="border border-gray-300 px-4 py-2">Duration of membership</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Inactive Member Data</td>
                <td className="border border-gray-300 px-4 py-2">1 year after membership expires</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Financial Records</td>
                <td className="border border-gray-300 px-4 py-2">7 years (legal requirement)</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Event Registrations</td>
                <td className="border border-gray-300 px-4 py-2">2 years</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Audit Logs</td>
                <td className="border border-gray-300 px-4 py-2">3 years</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Correction:</strong> Update incorrect information</li>
            <li><strong>Deletion:</strong> Request deletion of your account and data</li>
            <li><strong>Portability:</strong> Export your data in a standard format</li>
            <li><strong>Opt-out:</strong> Control what information is shared</li>
          </ul>
          <p className="mt-4">To exercise these rights, visit your <a href="/settings/privacy" className="text-blue-600 hover:underline">Privacy Settings</a>.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. FERPA Compliance</h2>
          <p>We comply with the Family Educational Rights and Privacy Act (FERPA) when handling educational records. Parents have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Inspect and review their child's education records</li>
            <li>Request amendment of inaccurate records</li>
            <li>Consent to disclosures of personally identifiable information</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Contact Us</h2>
          <p>For privacy-related questions or concerns, please contact:</p>
          <div className="bg-gray-50 p-4 rounded-lg mt-4">
            <p><strong>Privacy Officer</strong></p>
            <p>Your PTSA Name</p>
            <p>Email: privacy@yourptsa.org</p>
            <p>Phone: (555) 123-4567</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Changes to This Policy</h2>
          <p>We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Effective Date" above. For significant changes, we will provide additional notice via email.</p>
        </section>
      </div>
    </div>
  );
}