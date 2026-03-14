import { useState } from 'react';

export default function ReviewModal({ orderId, sellerName, onClose, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const labels = ['', 'Terrible', 'Bad', 'Okay', 'Good', 'Excellent'];

  const handleSubmit = async () => {
    if (!rating) return setError('Please select a star rating');
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ orderId, rating, text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onSubmit?.(data.review);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-800">Rate your experience</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <p className="text-sm text-gray-500 mb-4">How was your order from <strong>{sellerName}</strong>?</p>

        {/* Stars */}
        <div className="flex gap-2 justify-center mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="text-4xl transition-transform hover:scale-110">
              <span className={(hovered || rating) >= star ? 'text-yellow-400' : 'text-gray-200'}>★</span>
            </button>
          ))}
        </div>
        <p className="text-center text-sm font-medium text-yellow-600 mb-5 h-5">
          {labels[hovered || rating]}
        </p>

        {/* Text */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tell others about your experience (optional)..."
          maxLength={500}
          rows={4}
          className="w-full border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <p className="text-xs text-gray-400 text-right mt-1">{text.length}/500</p>

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        <div className="flex gap-3 mt-4">
          <button onClick={onClose}
            className="flex-1 py-3 border rounded-xl text-sm font-medium hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading || !rating}
            className="flex-1 py-3 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
}
