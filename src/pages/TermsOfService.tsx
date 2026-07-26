import React from 'react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-surface-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 sm:p-12">
          <h1 className="text-3xl font-extrabold text-surface-900 mb-8 tracking-tight">Terms of Service</h1>
          
          <div className="space-y-8 text-gray-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Salone Fuel Monitor ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">2. Description of Service</h2>
              <p>
                Salone Fuel Monitor provides real-time information regarding fuel prices, station availability, and transport costs in Sierra Leone. While we strive for accuracy, the information provided is for general guidance and we do not guarantee its absolute real-time accuracy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">3. User Accounts</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>You must provide accurate and complete information when creating an account.</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                <li>You must immediately notify us of any unauthorized use of your account.</li>
                <li>Station owners must provide verifiable information regarding their business operations.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">4. User Conduct</h2>
              <p className="mb-2">You agree not to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Submit false, misleading, or inaccurate fuel prices or station statuses.</li>
                <li>Use the platform for any unlawful purpose.</li>
                <li>Attempt to gain unauthorized access to our systems or other users' accounts.</li>
                <li>Interfere with or disrupt the integrity or performance of the platform.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">5. Data Accuracy and Liability</h2>
              <p>
                The fuel prices and availability statuses are crowd-sourced and provided by station owners. Salone Fuel Monitor acts as an aggregator and is not liable for any discrepancies between the prices listed on the platform and the actual prices at the physical stations. Users rely on this information at their own risk.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">6. Modifications to Service</h2>
              <p>
                We reserve the right to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice. We shall not be liable to you or to any third party for any modification, suspension, or discontinuance of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">7. Contact Information</h2>
              <p>
                If you have any questions about these Terms, please contact us through our Support page.
              </p>
            </section>
            
            <div className="pt-8 border-t border-gray-100 text-sm text-gray-500">
              Last updated: {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
