import React from 'react';
import { Link } from 'react-router-dom';

export default function TermsOfService() {
  const lastUpdated = 'August 9, 2026';

  return (
    <div className="min-h-screen bg-surface-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 sm:p-12">
          <h1 className="text-3xl font-extrabold text-surface-900 mb-2 tracking-tight">Terms of Service</h1>
          <p className="text-sm text-gray-500 mb-8">Effective date: {lastUpdated}</p>

          <div className="space-y-8 text-gray-600 leading-relaxed">

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing or using Salone Fuel Monitor ("the Platform", "we", "our", or "us") — available at{' '}
                <a href="https://salonefuelmonitor.com" className="text-blue-600 hover:underline">https://salonefuelmonitor.com</a> —
                you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any part of these terms, you must not use our Platform.
              </p>
              <p className="mt-3">
                Salone Fuel Monitor is operated by <strong>DreamDay Technology Limited</strong>, a company registered in Sierra Leone.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">2. Description of Services</h2>
              <p className="mb-3">Salone Fuel Monitor provides the following services to citizens, businesses, and institutions in Sierra Leone:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Real-Time Fuel Prices:</strong> Official pump prices for Petrol (PMS), Diesel (AGO), and Kerosene (DPK).</li>
                <li><strong>Fuel Station Finder:</strong> An interactive map of verified stations with live stock and availability status.</li>
                <li><strong>Price Trends:</strong> Historical charts and analysis of official fuel price changes over time.</li>
                <li><strong>Transport Fare Directory:</strong> Official public transport fares for all routes and districts.</li>
                <li><strong>Regional Fuel Comparison:</strong> Comparison of Sierra Leone's fuel prices against West African neighbours.</li>
                <li><strong>Barrel vs. Pump Tracker:</strong> Correlation between global crude oil prices and local pump prices.</li>
                <li><strong>Exchange Rate Monitor:</strong> Official and parallel exchange rates for major currencies.</li>
                <li><strong>Fuel Calculator:</strong> A tool to estimate journey fuel cost based on live prices.</li>
                <li><strong>My Garage:</strong> A personal fleet management tool to log vehicles, fuel fill-ups, trips, and maintenance records.</li>
                <li><strong>Market Intelligence & Blog:</strong> Data-driven insights and analysis of Sierra Leone's energy sector.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">3. User Accounts & Registration</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>You must be at least 16 years of age to create an account.</li>
                <li>You must provide accurate, current, and complete information during registration.</li>
                <li>You are solely responsible for maintaining the confidentiality of your account credentials.</li>
                <li>You must notify us immediately at <a href="mailto:slfuelmonitor@gmail.com" className="text-blue-600 hover:underline">slfuelmonitor@gmail.com</a> of any unauthorized use of your account.</li>
                <li>Station owners must provide verifiable business information. Submitting false station data is grounds for immediate account termination.</li>
                <li>We reserve the right to suspend or terminate accounts that violate these terms.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">4. User Roles and Responsibilities</h2>
              <p className="mb-3">The Platform has four user roles, each with specific responsibilities:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Public Users:</strong> May access all publicly available data without creating an account.</li>
                <li><strong>Registered Users:</strong> May use My Garage, submit station reviews, save favourites, and receive price alerts.</li>
                <li><strong>Station Owners:</strong> May manage their station profile, update live fuel stock status, and respond to reviews. Station owners are responsible for the accuracy of information they submit.</li>
                <li><strong>Administrators:</strong> Manage platform content, user accounts, fuel price data, and system settings on behalf of DreamDay Technology Limited.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">5. Acceptable Use</h2>
              <p className="mb-2">You agree not to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Submit false, misleading, or fabricated fuel prices, stock statuses, or station information.</li>
                <li>Post reviews or reports that are defamatory, abusive, offensive, or commercially motivated.</li>
                <li>Use the Platform for any unlawful purpose or in violation of any applicable local, national, or international law.</li>
                <li>Attempt to gain unauthorized access to any system, account, or database associated with the Platform.</li>
                <li>Scrape, harvest, or extract data from the Platform using automated tools without written permission.</li>
                <li>Impersonate any person, business, or entity, including any station owner or government body.</li>
                <li>Interfere with or disrupt the performance, availability, or security of the Platform.</li>
                <li>Use the Platform to distribute spam, malware, or unsolicited commercial communications.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">6. My Garage — Personal Data</h2>
              <p>
                The My Garage feature stores your personal vehicle records, fuel logs, trip history, and maintenance data in our secure database.
                This data is private to your account and is not shared with other users. You may delete your garage data at any time from within your account settings.
                DreamDay Technology Limited does not use your personal vehicle data for advertising purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">7. Data Accuracy and Disclaimer</h2>
              <p className="mb-3">
                Salone Fuel Monitor aggregates official government-published fuel prices, station data, and market information. While we strive for accuracy and timeliness:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Official pump prices sourced from the National Petroleum Authority (NPA) or equivalent bodies are published as provided. We are not responsible for government revisions not yet reflected on the Platform.</li>
                <li>Station stock status reports are crowdsourced and may not reflect real-time conditions at the physical station.</li>
                <li>Exchange rate data is provided for reference only and should not be used as the basis for financial transactions.</li>
                <li>Barrel vs. Pump price correlations are analytical in nature and are not financial or investment advice.</li>
                <li>Transport fares reflect officially gazetted rates and may not account for local variations or surcharges.</li>
              </ul>
              <p className="mt-3 font-medium text-gray-700">
                Users rely on all information provided by this Platform at their own risk. DreamDay Technology Limited accepts no liability for any loss or damage arising from reliance on Platform data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">8. Intellectual Property</h2>
              <p>
                All content on the Platform — including but not limited to text, graphics, logos, icons, charts, data visualisations, blog posts, and software — is the property of DreamDay Technology Limited or its content suppliers and is protected by applicable intellectual property laws.
                You may not reproduce, distribute, or create derivative works from any Platform content without express written permission from DreamDay Technology Limited.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">9. Push Notifications</h2>
              <p>
                If you opt in to push notifications, we may send you alerts about significant fuel price changes, station updates, and platform news via Firebase Cloud Messaging (FCM).
                You may withdraw consent for push notifications at any time through your device settings or account preferences.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">10. Third-Party Services</h2>
              <p className="mb-3">The Platform integrates with the following third-party services:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Google Firebase:</strong> Authentication, database, storage, and analytics.</li>
                <li><strong>Leaflet / OpenStreetMap:</strong> Interactive station mapping.</li>
                <li><strong>Google Fonts:</strong> Typography.</li>
              </ul>
              <p className="mt-3">
                These providers have their own terms and privacy policies. DreamDay Technology Limited is not responsible for the practices of third-party service providers.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">11. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law, DreamDay Technology Limited shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, use, goodwill, or other intangible losses, arising from your use of or inability to use the Platform or its data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">12. Modifications to Service and Terms</h2>
              <p>
                We reserve the right to modify or discontinue the Platform, or any part of it, at any time with or without notice.
                We also reserve the right to update these Terms of Service. Material changes will be communicated via a notice on the Platform or by email.
                Your continued use of the Platform after any such changes constitutes your acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">13. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the Republic of Sierra Leone.
                Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of Sierra Leone.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">14. Contact Us</h2>
              <p>If you have any questions about these Terms of Service, please contact us:</p>
              <ul className="mt-3 space-y-1">
                <li><strong>Company:</strong> DreamDay Technology Limited</li>
                <li><strong>Email:</strong> <a href="mailto:slfuelmonitor@gmail.com" className="text-blue-600 hover:underline">slfuelmonitor@gmail.com</a></li>
                <li><strong>Phone:</strong> +232 76 111668</li>
                <li><strong>Website:</strong> <a href="https://salonefuelmonitor.com/contact" className="text-blue-600 hover:underline">salonefuelmonitor.com/contact</a></li>
              </ul>
            </section>

            <div className="pt-8 border-t border-gray-100 text-sm text-gray-500">
              Last updated: {lastUpdated} &nbsp;·&nbsp;
              <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
              &nbsp;·&nbsp;
              <Link to="/cookies" className="text-blue-600 hover:underline">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
