import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';
import { supabase } from '../lib/supabaseClient'; // Import Supabase
import toast from 'react-hot-toast'; // Import Toast

const Feedback = () => {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState('General');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // 1. Get User
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // 2. Insert into Supabase
      const { error } = await supabase.from('feedback').insert([
        {
          user_id: user.id,
          rating: rating,
          category: category,
          comment: comment
        }
      ]);

      if (error) {
        toast.error('Failed to submit feedback: ' + error.message);
        setIsSubmitting(false);
      } else {
        toast.success('Feedback sent successfully!');
        setIsSubmitting(false);
        setSubmitted(true);
      }
    } else {
      toast.error('You must be logged in');
      navigate('/');
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center animate-fade-in text-center p-6">
        <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <StarIcon className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Thank You!</h2>
        <p className="text-slate-500 max-w-md mb-8">
          Your feedback helps us improve NHS services for everyone. Your response has been recorded anonymously.
        </p>
        <button 
          onClick={() => navigate('/dashboard')}
          className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-slide-up pb-20">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Give Feedback</h1>
        <p className="text-slate-500 text-sm">Rate your experience with MediLink services</p>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-soft border border-slate-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Star Rating */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">How would you rate your experience?</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  {rating >= star ? (
                    <StarIcon className="h-10 w-10 text-yellow-400" />
                  ) : (
                    <StarOutline className="h-10 w-10 text-slate-300 hover:text-yellow-200" />
                  )}
                </button>
              ))}
            </div>
            {rating === 0 && <p className="text-xs text-red-400 mt-2">* Please select a rating</p>}
          </div>

          {/* Category Select */}
          <div>
             <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
               {['General', 'App Usability', 'Booking Process', 'Video Call', 'Staff'].map((cat) => (
                 <button
                   key={cat}
                   type="button"
                   onClick={() => setCategory(cat)}
                   className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                     category === cat 
                       ? 'bg-primary text-white border-primary' 
                       : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                   }`}
                 >
                   {cat}
                 </button>
               ))}
             </div>
          </div>

          {/* Text Area */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Your Comments</label>
            <textarea
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Tell us what went well or what we can improve..."
              className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none text-sm"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={rating === 0 || isSubmitting}
            className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:shadow-xl hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Submit Feedback'
            )}
          </button>

        </form>
      </div>
    </div>
  );
};

export default Feedback;