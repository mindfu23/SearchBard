import { Conference } from '../types/Conference';

export const mockConferences: Conference[] = [
  {
    id: '1',
    title: 'TechCrunch Disrupt 2024',
    subject: 'Technology',
    location: {
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      coordinates: { lat: 37.7749, lng: -122.4194 }
    },
    startDate: '2024-09-15',
    endDate: '2024-09-17',
    description: 'The premier technology conference featuring startup pitches, investor discussions, and the latest in tech innovation.',
    website: 'https://techcrunch.com/events/disrupt-2024/',
    organizer: 'TechCrunch',
    attendeeCount: 10000,
    price: { min: 2500, max: 5000, currency: 'USD' }
  },
  {
    id: '2',
    title: 'World Healthcare Innovation Summit',
    subject: 'Healthcare',
    location: {
      city: 'Boston',
      state: 'MA',
      country: 'USA',
      coordinates: { lat: 42.3601, lng: -71.0589 }
    },
    startDate: '2024-10-22',
    endDate: '2024-10-24',
    description: 'Leading healthcare professionals discuss breakthrough innovations in medical technology and patient care.',
    organizer: 'Healthcare Innovation Institute',
    attendeeCount: 5000,
    price: { min: 1800, max: 3500, currency: 'USD' }
  },
  {
    id: '3',
    title: 'Global Business Leaders Forum',
    subject: 'Business',
    location: {
      city: 'New York',
      state: 'NY',
      country: 'USA',
      coordinates: { lat: 40.7128, lng: -74.0060 }
    },
    startDate: '2024-11-05',
    endDate: '2024-11-07',
    description: 'CEOs and business leaders share insights on global markets, strategy, and leadership.',
    organizer: 'Business Leadership Council',
    attendeeCount: 3000,
    price: { min: 2000, max: 4000, currency: 'USD' }
  },
  {
    id: '4',
    title: 'International Education Technology Conference',
    subject: 'Education',
    location: {
      city: 'Austin',
      state: 'TX',
      country: 'USA',
      coordinates: { lat: 30.2672, lng: -97.7431 }
    },
    startDate: '2024-09-28',
    endDate: '2024-09-30',
    description: 'Educators and technologists explore the future of learning through innovative educational technologies.',
    organizer: 'EdTech Alliance',
    attendeeCount: 4000,
    price: { min: 1200, max: 2500, currency: 'USD' }
  },
  {
    id: '5',
    title: 'National Science Foundation Symposium',
    subject: 'Science',
    location: {
      city: 'Washington',
      state: 'DC',
      country: 'USA',
      coordinates: { lat: 38.9072, lng: -77.0369 }
    },
    startDate: '2024-10-15',
    endDate: '2024-10-17',
    description: 'Scientists present cutting-edge research across multiple disciplines including physics, biology, and chemistry.',
    organizer: 'National Science Foundation',
    attendeeCount: 2500,
    price: { min: 800, max: 1500, currency: 'USD' }
  },
  {
    id: '6',
    title: 'Digital Marketing Expo',
    subject: 'Marketing',
    location: {
      city: 'Las Vegas',
      state: 'NV',
      country: 'USA',
      coordinates: { lat: 36.1699, lng: -115.1398 }
    },
    startDate: '2024-11-12',
    endDate: '2024-11-14',
    description: 'Marketing professionals learn about the latest digital marketing trends, tools, and strategies.',
    organizer: 'Digital Marketing Association',
    attendeeCount: 6000,
    price: { min: 1500, max: 3000, currency: 'USD' }
  },
  {
    id: '7',
    title: 'Financial Technology Summit',
    subject: 'Finance',
    location: {
      city: 'Chicago',
      state: 'IL',
      country: 'USA',
      coordinates: { lat: 41.8781, lng: -87.6298 }
    },
    startDate: '2024-10-08',
    endDate: '2024-10-10',
    description: 'FinTech innovators and financial institutions discuss the future of banking and financial services.',
    organizer: 'FinTech Coalition',
    attendeeCount: 3500,
    price: { min: 2200, max: 4500, currency: 'USD' }
  },
  {
    id: '8',
    title: 'Climate Action Conference',
    subject: 'Environment',
    location: {
      city: 'Seattle',
      state: 'WA',
      country: 'USA',
      coordinates: { lat: 47.6062, lng: -122.3321 }
    },
    startDate: '2024-09-20',
    endDate: '2024-09-22',
    description: 'Environmental scientists and activists collaborate on solutions for climate change and sustainability.',
    organizer: 'Green Future Initiative',
    attendeeCount: 4500,
    price: { min: 1000, max: 2000, currency: 'USD' }
  },
  {
    id: '9',
    title: 'Design Thinking Workshop',
    subject: 'Arts & Design',
    location: {
      city: 'Los Angeles',
      state: 'CA',
      country: 'USA',
      coordinates: { lat: 34.0522, lng: -118.2437 }
    },
    startDate: '2024-11-20',
    endDate: '2024-11-22',
    description: 'Designers and creative professionals explore innovative design methodologies and artistic expression.',
    organizer: 'Creative Arts Foundation',
    attendeeCount: 2000,
    price: { min: 1300, max: 2600, currency: 'USD' }
  },
  {
    id: '10',
    title: 'International Engineering Symposium',
    subject: 'Engineering',
    location: {
      city: 'Denver',
      state: 'CO',
      country: 'USA',
      coordinates: { lat: 39.7392, lng: -104.9903 }
    },
    startDate: '2024-10-30',
    endDate: '2024-11-01',
    description: 'Engineers from various disciplines share innovations in infrastructure, robotics, and sustainable engineering.',
    organizer: 'International Engineering Society',
    attendeeCount: 5500,
    price: { min: 1600, max: 3200, currency: 'USD' }
  },
  {
    id: '11',
    title: 'AI & Machine Learning Conference',
    subject: 'Technology',
    location: {
      city: 'San Jose',
      state: 'CA',
      country: 'USA',
      coordinates: { lat: 37.3382, lng: -121.8863 }
    },
    startDate: '2024-12-03',
    endDate: '2024-12-05',
    description: 'Artificial intelligence researchers and practitioners discuss the latest developments in ML and AI.',
    organizer: 'AI Research Institute',
    attendeeCount: 8000,
    price: { min: 2800, max: 5500, currency: 'USD' }
  },
  {
    id: '12',
    title: 'Telemedicine Innovation Forum',
    subject: 'Healthcare',
    location: {
      city: 'Atlanta',
      state: 'GA',
      country: 'USA',
      coordinates: { lat: 33.7490, lng: -84.3880 }
    },
    startDate: '2024-11-28',
    endDate: '2024-11-29',
    description: 'Healthcare providers explore remote care technologies and digital health solutions.',
    organizer: 'Telemedicine Association',
    attendeeCount: 3200,
    price: { min: 1400, max: 2800, currency: 'USD' }
  }
];