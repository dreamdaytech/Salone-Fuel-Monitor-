import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { db, collection, addDoc, serverTimestamp, OperationType, handleFirestoreError } from '../firebase';
import { Button } from '../components/ui/Button';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'General Inquiry',
    message: '',
    honeypot: '', // Hidden field for bots
    captchaAnswer: ''
  });
  const [captcha, setCaptcha] = useState({ a: 0, b: 0 });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    setCaptcha({
      a: Math.floor(Math.random() * 10) + 1,
      b: Math.floor(Math.random() * 10) + 1
    });
  };

  const categories = [
    'General Inquiry',
    'Technical Support',
    'Station Feedback',
    'Price Discrepancy',
    'Business Partnership',
    'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Honeypot check
    if (formData.honeypot) {
      console.log('Bot detected via honeypot');
      return;
    }

    // Captcha check
    if (parseInt(formData.captchaAnswer) !== captcha.a + captcha.b) {
      setError('Incorrect security answer. Please try again.');
      generateCaptcha();
      setFormData(prev => ({ ...prev, captchaAnswer: '' }));
      return;
    }

    setIsSubmitting(true);
    try {
      // Save to Firestore
      await addDoc(collection(db, 'support_messages'), {
        name: formData.name,
        email: formData.email,
        category: formData.category,
        message: formData.message,
        status: 'new',
        createdAt: serverTimestamp()
      });

      setSubmitted(true);
      setFormData({ 
        name: '', 
        email: '', 
        category: 'General Inquiry', 
        message: '', 
        honeypot: '', 
        captchaAnswer: '' 
      });
      generateCaptcha();
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      console.error('Error submitting message:', err);
      setError('Failed to send message. Please try again later.');
      handleFirestoreError(err, OperationType.CREATE, 'support_messages');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-surface-900 sm:text-5xl tracking-tight">
            Contact Support
          </h1>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Have a question or need assistance? Our team is here to help you with any inquiries about Salone Fuel Monitor.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-surface-900 mb-8">Get in Touch</h2>
              
              <div className="space-y-8">
                <div className="flex items-start gap-4 group">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-blue-200 shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Email Us</p>
                    <p className="text-lg font-bold text-surface-900">support@slfuelmonitor.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Call Us</p>
                    <p className="text-lg font-bold text-surface-900">+232 76 000 000</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-all">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Office</p>
                    <p className="text-lg font-bold text-surface-900">Freetown, Sierra Leone</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-gradient-to-br from-[#0072C6] via-[#005aa0] to-[#1EB53A] p-8 rounded-[2rem] text-white">
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ 
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', 
            backgroundSize: '60px 60px' 
          }} 
        />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <Clock className="w-6 h-6 text-blue-200" />
                  <h3 className="text-xl font-bold">Support Hours</h3>
                </div>
                <ul className="space-y-4 text-blue-100">
                  <li className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-sm font-medium">Monday - Friday</span>
                    <span className="text-sm font-bold text-white">8:00 AM - 6:00 PM</span>
                  </li>
                  <li className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-sm font-medium">Saturday</span>
                    <span className="text-sm font-bold text-white">9:00 AM - 2:00 PM</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-sm font-medium">Sunday</span>
                    <span className="text-sm font-bold text-red-400">Closed</span>
                  </li>
                </ul>
              </div>
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 h-full">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-emerald-50 rounded-xl">
                  <MessageSquare className="w-8 h-8 text-blue-200" />
                </div>
                <h2 className="text-2xl font-bold text-surface-900">Send us a Message</h2>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm animate-in slide-in-from-top-2 duration-300">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="font-medium">{error}</p>
                </div>
              )}

              {submitted ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 animate-in zoom-in-95 duration-500">
                  <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-blue-200 mb-8 shadow-inner">
                    <Send className="w-10 h-10" />
                  </div>
                  <h3 className="text-3xl font-bold text-surface-900 mb-3">Message Sent!</h3>
                  <p className="text-gray-500 max-w-sm mx-auto">Thank you for reaching out. We'll get back to you as soon as possible.</p>
                  <Button 
                    onClick={() => setSubmitted(false)}
                    variant="secondary"
                    className="mt-10 px-8 py-3 font-bold rounded-xl transition-all active:scale-95"
                    showNotification={false}
                  >
                    Send another message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Honeypot field - hidden from users but visible to bots */}
                  <div className="hidden" aria-hidden="true">
                    <input
                      type="text"
                      name="honeypot"
                      value={formData.honeypot}
                      onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                      <input
                        required
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-surface-900 font-medium transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                      <input
                        required
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-surface-900 font-medium transition-all"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                    <div className="relative">
                      <select
                        required
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-surface-900 font-bold transition-all appearance-none cursor-pointer"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <Clock className="w-4 h-4 rotate-90" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Message</label>
                    <textarea
                      required
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-surface-900 font-medium transition-all resize-none"
                      placeholder="Tell us more about your inquiry..."
                    />
                  </div>

                  {/* Math Captcha */}
                  <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
                    <label className="block text-sm font-bold text-blue-200 uppercase tracking-wider mb-3">
                      Security Question: What is {captcha.a} + {captcha.b}?
                    </label>
                    <input
                      required
                      type="number"
                      value={formData.captchaAnswer}
                      onChange={(e) => setFormData({ ...formData, captchaAnswer: e.target.value })}
                      className="w-full md:w-32 px-4 py-3 bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-surface-900 font-bold transition-all"
                      placeholder="Answer"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    variant="primary"
                    className="w-full md:w-auto px-10 py-4 font-bold rounded-xl transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-emerald-500/20 active:scale-95"
                    notificationMessage="Message sent successfully"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
