import React from 'react';
import BookCard from './BookCard';

const BookCardExample: React.FC = () => {
  const sampleSession = {
    image_url: '/centralbark.webp',
    date: 'Wed 30 Oct',
    time: '3:00 PM',
    length: '30 min',
    field: 'Central Bark',
    price: '£5.50'
  };

  const handleBook = () => {
    console.log('Booking session:', sampleSession);
    // Handle booking logic here
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-center mb-6">BookCard Example</h1>
      <BookCard session={sampleSession} onBook={handleBook} />
    </div>
  );
};

export default BookCardExample;
