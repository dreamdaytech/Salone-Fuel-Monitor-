import React from 'react';
import { Link } from 'react-router-dom';

export default function CookiePolicy() {
  const lastUpdated = 'August 9, 2026';

  return (
    <div className="min-h-screen bg-surface-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 sm:p-12">
          <h1 className="text-3xl font-extrabold text-surface-900 mb-2 tracking-tight">Cookie Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Effective date: {lastUpdated}</p>

          <div className="space-y-8 text-gray-600 leading-relaxed">

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">1. Introduction</h2>
              <p>
                This Cookie Policy explains how Salone Fuel Monitor, operated by <strong>DreamDay Technology Limited</strong>,
                uses cookies and similar local storage technologies when you visit{' '}
                <a href="https://salonefuelmonitor.com" className="text-blue-600 hover:underline">https://salonefuelmonitor.com</a>.
              </p>
              <p className="mt-3">
                By using our Platform, you consent to our use of cookies and local storage as described in this policy.
                You may withdraw consent at any time by clearing your browser data or adjusting browser settings,
                though this may affect Platform functionality.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">2. What Are Cookies and Local Storage?</h2>
              <p>
                <strong>Cookies</strong> are small text files stored by your browser when you visit a website. They help websites remember information about your visit.
              </p>
              <p className="mt-3">
                <strong>Local Storage</strong> and <strong>Session Storage</strong> are browser-based storage mechanisms similar to cookies but with larger capacity and no automatic expiry. Modern web applications like Salone Fuel Monitor use local storage in addition to cookies to store user preferences and session data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">3. Types of Cookies and Storage We Use</h2>

              <div className="space-y-5 mt-2">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <h3 className="font-bold text-surface-800 mb-2">🔐 Essential / Authentication Cookies</h3>
                  <p className="text-sm mb-1"><strong>Purpose:</strong> Required for the Platform to function. These enable you to log in, stay logged in, and access your account securely.</p>
                  <p className="text-sm mb-1"><strong>Provider:</strong> Google Firebase (Firebase Authentication)</p>
                  <p className="text-sm"><strong>Examples:</strong> Firebase session tokens, auth state persistence tokens</p>
                  <p className="text-sm mt-2 text-blue-700 font-medium">Cannot be disabled — the Platform cannot function without these.</p>
                </div>

                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <h3 className="font-bold text-surface-800 mb-2">⚙️ Functionality / Preference Storage</h3>
                  <p className="text-sm mb-1"><strong>Purpose:</strong> Remembers your preferences to personalise your experience.</p>
                  <p className="text-sm mb-1"><strong>Provider:</strong> Salone Fuel Monitor (stored locally in your browser)</p>
                  <p className="text-sm mb-1"><strong>Examples stored in Local Storage:</strong></p>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    <li><code>sfm_last_seen_version</code> — tracks the last app version you used, to manage update notifications</li>
                    <li>Notification permission state</li>
                    <li>Selected district or region preferences</li>
                    <li>UI preferences (e.g., table vs. card view selections)</li>
                    <li>Cookie consent acknowledgement</li>
                  </ul>
                </div>

                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <h3 className="font-bold text-surface-800 mb-2">📊 Analytical / Performance Cookies</h3>
                  <p className="text-sm mb-1"><strong>Purpose:</strong> Helps us understand how users interact with the Platform so we can improve it.</p>
                  <p className="text-sm mb-1"><strong>Provider:</strong> Google Firebase Analytics (Google LLC)</p>
                  <p className="text-sm mb-1"><strong>Data collected:</strong> Pages visited, features used, session duration, device type, browser, and country. All analytics data is anonymised — we cannot identify individual users from this data.</p>
                  <p className="text-sm mt-2">
                    You can opt out of Firebase Analytics data collection by using browser privacy settings or a tracker-blocking browser extension.
                    See <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google's Firebase Privacy Policy</a>.
                  </p>
                </div>

                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <h3 className="font-bold text-surface-800 mb-2">🔔 Push Notification Token Storage</h3>
                  <p className="text-sm mb-1"><strong>Purpose:</strong> If you opt in to push notifications, we store a Firebase Cloud Messaging (FCM) device token to route notifications to your device.</p>
                  <p className="text-sm mb-1"><strong>Provider:</strong> Google Firebase Cloud Messaging</p>
                  <p className="text-sm">This is only activated if you explicitly grant notification permission. You may revoke this at any time via your device or browser settings.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">4. Third-Party Cookies</h2>
              <p className="mb-3">The following third-party services may set their own cookies or storage when you use the Platform:</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 font-semibold text-surface-800 border-b border-gray-200">Provider</th>
                      <th className="text-left p-3 font-semibold text-surface-800 border-b border-gray-200">Purpose</th>
                      <th className="text-left p-3 font-semibold text-surface-800 border-b border-gray-200">Privacy Policy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="p-3">Google Firebase</td>
                      <td className="p-3">Authentication, Analytics, Push Notifications, Database</td>
                      <td className="p-3"><a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Policy</a></td>
                    </tr>
                    <tr>
                      <td className="p-3">OpenStreetMap</td>
                      <td className="p-3">Map tile data for the Fuel Station Finder</td>
                      <td className="p-3"><a href="https://wiki.osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Policy</a></td>
                    </tr>
                    <tr>
                      <td className="p-3">Google Fonts</td>
                      <td className="p-3">Typography / font delivery</td>
                      <td className="p-3"><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Policy</a></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">5. How to Manage Cookies</h2>
              <p className="mb-3">You can control and manage cookies in the following ways:</p>
              <ul className="list-disc pl-5 space-y-3">
                <li>
                  <strong>Browser Settings:</strong> Most browsers allow you to view, block, or delete cookies. Common browser help pages:
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                    <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Chrome</a></li>
                    <li><a href="https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Mozilla Firefox</a></li>
                    <li><a href="https://support.apple.com/en-gb/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Apple Safari</a></li>
                    <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Microsoft Edge</a></li>
                  </ul>
                </li>
                <li>
                  <strong>Notification Permissions:</strong> Revoke push notification access via your browser settings (Settings → Privacy & Security → Notifications → salonefuelmonitor.com → Block).
                </li>
                <li>
                  <strong>Location Permissions:</strong> Revoke location access via your browser settings at any time.
                </li>
                <li>
                  <strong>Analytics Opt-Out:</strong> Use a browser extension such as{' '}
                  <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Analytics Opt-out Browser Add-on</a>.
                </li>
              </ul>
              <p className="mt-4 text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm">
                ⚠️ Blocking essential cookies or clearing local storage may prevent you from logging into your account and will reset your saved preferences.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">6. Changes to This Policy</h2>
              <p>
                We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons.
                We will post any updates on this page with an updated effective date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">7. Contact Us</h2>
              <p>For questions about this Cookie Policy, please contact:</p>
              <ul className="mt-3 space-y-1">
                <li><strong>DreamDay Technology Limited</strong></li>
                <li><strong>Email:</strong> <a href="mailto:slfuelmonitor@gmail.com" className="text-blue-600 hover:underline">slfuelmonitor@gmail.com</a></li>
                <li><strong>Phone:</strong> +232 76 111668</li>
              </ul>
            </section>

            <div className="pt-8 border-t border-gray-100 text-sm text-gray-500">
              Last updated: {lastUpdated} &nbsp;·&nbsp;
              <Link to="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
              &nbsp;·&nbsp;
              <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
