import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-surface-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 sm:p-12">
          <h1 className="text-3xl font-extrabold text-surface-900 mb-8 tracking-tight">Privacy Policy</h1>
          
          <div className="space-y-8 text-gray-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">1. Introduction</h2>
              <p>
                At SL Fuel Monitor, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">2. Information We Collect</h2>
              <p className="mb-2">We may collect information about you in a variety of ways, including:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Personal Data:</strong> Name, email address, and profile picture when you register for an account using Google Authentication.</li>
                <li><strong>Usage Data:</strong> Information about how you use our platform, including search queries, viewed stations, and interaction with features like polls and petitions.</li>
                <li><strong>Location Data:</strong> With your permission, we may collect device location to show you nearby fuel stations.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>To create and manage your account.</li>
                <li>To provide, operate, and maintain our platform.</li>
                <li>To improve, personalize, and expand our services.</li>
                <li>To communicate with you, including sending price alerts and service updates.</li>
                <li>To process your feedback, reviews, and support requests.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">4. Sharing Your Information</h2>
              <p>
                We do not sell, trade, or rent your personal identification information to others. We may share generic aggregated demographic information not linked to any personal identification information regarding visitors and users with our business partners and trusted affiliates for the purposes outlined above.
              </p>
              <p className="mt-4">
                Public contributions, such as station reviews, poll votes, and petition signatures, may be visible to other users of the platform along with your display name.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">5. Data Security</h2>
              <p>
                We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">6. Your Rights</h2>
              <p>
                You have the right to access, update, or delete the information we have on you. You can manage your personal information through your Profile settings or by contacting our support team.
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
