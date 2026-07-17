import React from 'react';

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-surface-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 sm:p-12">
          <h1 className="text-3xl font-extrabold text-surface-900 mb-8 tracking-tight">Cookie Policy</h1>
          
          <div className="space-y-8 text-gray-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">1. What Are Cookies</h2>
              <p>
                Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work, or work more efficiently, as well as to provide information to the owners of the site.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">2. How We Use Cookies</h2>
              <p className="mb-2">SL Fuel Monitor uses cookies for the following purposes:</p>
              <ul className="list-disc pl-5 space-y-4">
                <li>
                  <strong>Essential Cookies:</strong> These are required for the operation of our platform. They include, for example, cookies that enable you to log into secure areas of our website (such as Firebase Authentication cookies).
                </li>
                <li>
                  <strong>Functionality Cookies:</strong> These are used to recognize you when you return to our platform. This enables us to personalize our content for you and remember your preferences (for example, your choice of region or notification settings).
                </li>
                <li>
                  <strong>Analytical/Performance Cookies:</strong> They allow us to recognize and count the number of visitors and to see how visitors move around our website when they are using it. This helps us to improve the way our website works.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">3. Third-Party Cookies</h2>
              <p>
                In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the Service and deliver authentication features. Specifically, we use Google Firebase for authentication, which sets its own cookies to manage user sessions securely.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">4. Managing Cookies</h2>
              <p>
                Most web browsers allow some control of most cookies through the browser settings. You can set your browser to refuse all or some browser cookies, or to alert you when websites set or access cookies. If you disable or refuse cookies, please note that some parts of this platform may become inaccessible or not function properly (such as logging into your account).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-surface-900 mb-4">5. Changes to This Policy</h2>
              <p>
                We may update our Cookie Policy from time to time. We will notify you of any changes by posting the new Cookie Policy on this page and updating the "Last updated" date.
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
