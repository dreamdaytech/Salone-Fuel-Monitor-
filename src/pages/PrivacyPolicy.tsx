import React from 'react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  const lastUpdated = 'August 9, 2026';

  return (
    <div className="min-h-screen bg-surface-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 sm:p-12">
          <h1 className="text-3xl font-extrabold text-surface-900 mb-2 tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Effective date: {lastUpdated}</p>

          <div className="space-y-8 text-gray-600 leading-relaxed">

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">1. Introduction</h2>
              <p>
                DreamDay Technology Limited ("we", "us", or "our") operates Salone Fuel Monitor at{' '}
                <a href="https://salonefuelmonitor.com" className="text-blue-600 hover:underline">https://salonefuelmonitor.com</a>.
                We are committed to protecting your personal information and your right to privacy.
              </p>
              <p className="mt-3">
                This Privacy Policy explains what information we collect, how we use it, with whom we share it, and what rights you have in relation to it.
                Please read this policy carefully. If you disagree with its terms, please discontinue use of the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">2. Information We Collect</h2>

              <h3 className="text-base font-semibold text-surface-800 mb-2 mt-4">2.1 Information You Provide Directly</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Account Information:</strong> Full name, email address, phone number, and profile picture when you register or update your profile.</li>
                <li><strong>Station Owner Information:</strong> Business name, station location, operating hours, and fuel type availability when registering as a station owner.</li>
                <li><strong>My Garage Data:</strong> Vehicle details (make, model, year, fuel type, plate number), fuel fill-up logs (date, quantity, cost, odometer), trip records, and maintenance entries that you voluntarily enter.</li>
                <li><strong>User-Generated Content:</strong> Station reviews, ratings, fuel stock reports, and comments you submit on the Platform.</li>
                <li><strong>Support Communications:</strong> Messages you send us via our Contact page or email.</li>
              </ul>

              <h3 className="text-base font-semibold text-surface-800 mb-2 mt-4">2.2 Information Collected Automatically</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Usage Data:</strong> Pages visited, features used, session duration, and interaction patterns, collected via Firebase Analytics.</li>
                <li><strong>Device Information:</strong> Browser type, operating system, device type, and IP address.</li>
                <li><strong>Location Data:</strong> With your explicit permission, we collect your device's geographic location to show you nearby fuel stations. You may deny or revoke this permission at any time via your device or browser settings.</li>
                <li><strong>Cookies and Local Storage:</strong> Authentication tokens, user preferences (e.g., dark mode, selected district), and session data stored locally. See our <Link to="/cookies" className="text-blue-600 hover:underline">Cookie Policy</Link> for full details.</li>
                <li><strong>App Version Data:</strong> We store a version identifier in your browser's local storage to manage app update notifications.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>To create, authenticate, and manage your account securely via Firebase Authentication.</li>
                <li>To provide, operate, and improve all Platform features including the Fuel Station Finder, My Garage, Price Trends, and Regional Comparison tools.</li>
                <li>To display your station information (for station owners) and respond to user reviews.</li>
                <li>To send push notifications about fuel price changes or service updates, only if you have opted in via your notification preferences.</li>
                <li>To understand how users interact with the Platform and improve the user experience using anonymised analytics data.</li>
                <li>To respond to your support requests and feedback.</li>
                <li>To enforce our Terms of Service and protect the Platform from abuse.</li>
                <li>To comply with applicable legal obligations.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">4. Data Shared with Third Parties</h2>
              <p className="mb-3">
                We do not sell, rent, or trade your personal data. We share data only in the following limited circumstances:
              </p>
              <ul className="list-disc pl-5 space-y-3">
                <li>
                  <strong>Google Firebase (Google LLC):</strong> We use Firebase for user authentication, database storage, file storage, push notifications, and analytics.
                  Firebase processes data on our behalf under Google's data processing terms. Data may be stored on Google servers in the United States or other jurisdictions.
                  See <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Firebase Privacy Information</a>.
                </li>
                <li>
                  <strong>OpenStreetMap / Leaflet:</strong> The Fuel Station Finder map uses tile data from OpenStreetMap. No personal data is sent to OpenStreetMap.
                </li>
                <li>
                  <strong>Legal Requirements:</strong> We may disclose your information if required by law, court order, or governmental authority in Sierra Leone or any other applicable jurisdiction.
                </li>
                <li>
                  <strong>Business Transfer:</strong> In the event of a merger, acquisition, or sale of DreamDay Technology Limited, your data may be transferred to the acquiring entity, subject to this Privacy Policy.
                </li>
              </ul>
              <p className="mt-3">
                <strong>Publicly Visible Information:</strong> Station reviews, ratings, and fuel stock reports you submit may be visible to other users of the Platform alongside your display name.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">5. My Garage — Private Data</h2>
              <p>
                Data you enter into My Garage (vehicles, fuel logs, trips, maintenance records) is stored in your private Firestore account and is not visible to other users or station owners.
                This data is linked to your user account and is permanently deleted if you request account deletion. We do not use your garage data for advertising or profiling.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">6. Push Notifications</h2>
              <p>
                If you grant permission, we use Firebase Cloud Messaging (FCM) to send push notifications to your device. Your FCM device token is stored in our database and is used solely for delivering notifications to your device.
                You may withdraw notification consent at any time via your device settings or through your account notification preferences on the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">7. Data Retention</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Account data is retained for as long as your account remains active.</li>
                <li>My Garage records are retained until you delete them manually or request account deletion.</li>
                <li>Station reviews and reports may be retained for archival and platform integrity purposes even after account deletion.</li>
                <li>Analytics data collected by Firebase is retained in accordance with Google's standard retention settings (up to 14 months by default).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">8. Data Security</h2>
              <p>
                We implement appropriate technical and organisational security measures to protect your personal information, including:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-3">
                <li>Firebase Authentication with secure, hashed credential storage.</li>
                <li>Firestore Security Rules enforcing role-based access control — users can only access data they are authorised to view.</li>
                <li>HTTPS encryption for all data in transit.</li>
                <li>Admin and station owner routes are protected by server-side role verification.</li>
              </ul>
              <p className="mt-3">
                Despite our best efforts, no security system is impenetrable. We encourage you to use a strong, unique password and to contact us immediately if you suspect unauthorised access to your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">9. Children's Privacy</h2>
              <p>
                Salone Fuel Monitor is not directed at children under 16 years of age. We do not knowingly collect personal information from children under 16.
                If you believe a child has provided us with personal data, please contact us and we will delete it promptly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">10. Your Rights</h2>
              <p className="mb-3">You have the following rights regarding your personal data:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information via your Profile settings.</li>
                <li><strong>Deletion:</strong> Request deletion of your account and associated personal data.</li>
                <li><strong>Portability:</strong> Request an export of your My Garage data.</li>
                <li><strong>Withdraw Consent:</strong> Opt out of push notifications or location data sharing at any time.</li>
              </ul>
              <p className="mt-3">
                To exercise any of these rights, contact us at{' '}
                <a href="mailto:slfuelmonitor@gmail.com" className="text-blue-600 hover:underline">slfuelmonitor@gmail.com</a>.
                We will respond within 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">11. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page and updating the effective date.
                Your continued use of the Platform after any changes constitutes your acceptance of the revised policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">12. Contact Us</h2>
              <p>If you have questions, concerns, or requests regarding this Privacy Policy, please contact:</p>
              <ul className="mt-3 space-y-1">
                <li><strong>Data Controller:</strong> DreamDay Technology Limited</li>
                <li><strong>Email:</strong> <a href="mailto:slfuelmonitor@gmail.com" className="text-blue-600 hover:underline">slfuelmonitor@gmail.com</a></li>
                <li><strong>Phone:</strong> +232 76 111668</li>
                <li><strong>Address:</strong> Freetown, Sierra Leone</li>
              </ul>
            </section>

            <div className="pt-8 border-t border-gray-100 text-sm text-gray-500">
              Last updated: {lastUpdated} &nbsp;·&nbsp;
              <Link to="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
              &nbsp;·&nbsp;
              <Link to="/cookies" className="text-blue-600 hover:underline">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
