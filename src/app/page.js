'use client';
import { useEffect, useMemo, useState } from 'react';
import { useStoredSession } from './lib/useStoredSession';

const FEATURED_ITEMS = [
  {
    title: 'HP Laptop for Sale',
    price: '₦50,000',
    seller: 'Tunde UI',
    badge: 'Just Listed!',
    image:
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'iPhone 11 Clean',
    price: '₦120,000',
    seller: 'Amaka UNILAG',
    badge: 'Hot Deal',
    image:
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Graphics Design Service',
    price: '₦8,000',
    seller: 'Favour OAU',
    badge: 'Trusted Seller',
    image:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
  },
];

const LATEST_LISTINGS = [
  { emoji: '📱', title: 'iPhone 11', price: '₦120,000', link: '/products?q=iPhone 11' },
  { emoji: '🛠️', title: 'Laptop Repair Service', price: '₦5,000', link: '/services?q=Laptop Repair' },
  { emoji: '📚', title: 'GST101 Textbook', price: '₦3,500', link: '/products?q=GST101 Textbook' },
  { emoji: '🍱', title: 'Jollof Rice Delivery', price: '₦1,500', link: '/services?q=Jollof Rice Delivery' },
  { emoji: '🎨', title: 'Logo Design', price: '₦7,000', link: '/services?q=Logo Design' },
];

const UNIVERSITIES = [
  { abbr: 'UNILAG', name: 'University of Lagos', city: 'Lagos', state: 'Lagos', listings: 3840 },
  { abbr: 'FUTA', name: 'Federal University of Technology Akure', city: 'Akure', state: 'Ondo', listings: 2140 },
  { abbr: 'OAU', name: 'Obafemi Awolowo University', city: 'Ile-Ife', state: 'Osun', listings: 1920 },
  { abbr: 'UI', name: 'University of Ibadan', city: 'Ibadan', state: 'Oyo', listings: 1450 },
  { abbr: 'UNIBEN', name: 'University of Benin', city: 'Benin City', state: 'Edo', listings: 1100 },
  { abbr: 'LASU', name: 'Lagos State University', city: 'Lagos', state: 'Lagos', listings: 930 },
  { abbr: 'ABU', name: 'Ahmadu Bello University', city: 'Zaria', state: 'Kaduna', listings: 980 },
  { abbr: 'BUK', name: 'Bayero University Kano', city: 'Kano', state: 'Kano', listings: 890 },
  { abbr: 'UNIPORT', name: 'University of Port Harcourt', city: 'Port Harcourt', state: 'Rivers', listings: 870 },
  { abbr: 'YABATECH', name: 'Yaba College of Technology', city: 'Lagos', state: 'Lagos', listings: 820 },
  { abbr: 'UNILORIN', name: 'University of Ilorin', city: 'Ilorin', state: 'Kwara', listings: 760 },
  { abbr: 'UNIABUJA', name: 'University of Abuja', city: 'Abuja', state: 'FCT', listings: 720 },
  { abbr: 'LAUTECH', name: 'Ladoke Akintola University of Technology', city: 'Ogbomoso', state: 'Oyo', listings: 710 },
  { abbr: 'FUNAAB', name: 'Federal Univ. of Agriculture Abeokuta', city: 'Abeokuta', state: 'Ogun', listings: 680 },
  { abbr: 'UNIJOS', name: 'University of Jos', city: 'Jos', state: 'Plateau', listings: 640 },
  { abbr: 'UNIZIK', name: 'Nnamdi Azikiwe University', city: 'Awka', state: 'Anambra', listings: 620 },
  { abbr: 'UNIUYO', name: 'University of Uyo', city: 'Uyo', state: 'Akwa Ibom', listings: 590 },
  { abbr: 'FUTMINNA', name: 'Fed. University of Technology Minna', city: 'Minna', state: 'Niger', listings: 520 },
  { abbr: 'UNIABCAL', name: 'University of Calabar', city: 'Calabar', state: 'Cross River', listings: 530 },
  { abbr: 'IMSU', name: 'Imo State University', city: 'Owerri', state: 'Imo', listings: 510 },
  { abbr: 'FUTO', name: 'Fed. University of Technology Owerri', city: 'Owerri', state: 'Imo', listings: 480 },
  { abbr: 'EBSU', name: 'Ebonyi State University', city: 'Abakaliki', state: 'Ebonyi', listings: 430 },
  { abbr: 'RSUST', name: 'Rivers State University', city: 'Port Harcourt', state: 'Rivers', listings: 460 },
  { abbr: 'NOUN', name: 'National Open University of Nigeria', city: 'Nationwide', state: 'FCT', listings: 410 },
  { abbr: 'EKSU', name: 'Ekiti State University', city: 'Ado-Ekiti', state: 'Ekiti', listings: 380 },
  { abbr: 'COOU', name: 'Chukwuemeka Odumegwu Ojukwu University', city: 'Uli', state: 'Anambra', listings: 370 },
  { abbr: 'AAU', name: 'Ambrose Alli University', city: 'Ekpoma', state: 'Edo', listings: 360 },
  { abbr: 'FUPRE', name: 'Fed. Univ. of Petroleum Resources', city: 'Effurun', state: 'Delta', listings: 340 },
  { abbr: 'KASU', name: 'Kaduna State University', city: 'Kaduna', state: 'Kaduna', listings: 330 },
  { abbr: 'DELSU', name: 'Delta State University', city: 'Abraka', state: 'Delta', listings: 300 },
  { abbr: 'UNIMAID', name: 'University of Maiduguri', city: 'Maiduguri', state: 'Borno', listings: 310 },
  { abbr: 'FUOYE', name: 'Federal University Oye-Ekiti', city: 'Oye', state: 'Ekiti', listings: 310 },
  { abbr: 'UDUSOK', name: 'Usmanu Danfodiyo University', city: 'Sokoto', state: 'Sokoto', listings: 280 },
  { abbr: 'KWASU', name: 'Kwara State University', city: 'Malete', state: 'Kwara', listings: 270 },
  { abbr: 'MAPOLY', name: 'Moshood Abiola Polytechnic', city: 'Abeokuta', state: 'Ogun', listings: 240 },
  { abbr: 'ABSU', name: 'Abia State University', city: 'Uturu', state: 'Abia', listings: 250 },
  { abbr: 'NSUK', name: 'Nasarawa State University', city: 'Keffi', state: 'Nasarawa', listings: 230 },
  { abbr: 'KSU', name: 'Kogi State University', city: 'Anyigba', state: 'Kogi', listings: 220 },
  { abbr: 'ANSU', name: 'Anambra State University', city: 'Uli', state: 'Anambra', listings: 200 },
  { abbr: 'IGNATIUS', name: 'Ignatius Ajuru University', city: 'Port Harcourt', state: 'Rivers', listings: 210 },
  { abbr: 'BSU', name: 'Benue State University', city: 'Makurdi', state: 'Benue', listings: 290 },
  { abbr: 'ATBU', name: 'Abubakar Tafawa Balewa University', city: 'Bauchi', state: 'Bauchi', listings: 260 },
  { abbr: 'AAUA', name: 'Adekunle Ajasin University', city: 'Akungba-Akoko', state: 'Ondo', listings: 290 },
  { abbr: 'MOUAU', name: 'Michael Okpara Univ. of Agriculture', city: 'Umudike', state: 'Abia', listings: 280 },
  { abbr: 'FUL', name: 'Federal University Lafia', city: 'Lafia', state: 'Nasarawa', listings: 190 },
  { abbr: 'NDU', name: 'Niger Delta University', city: 'Wilberforce Is.', state: 'Bayelsa', listings: 180 },
  { abbr: 'FUWUKARI', name: 'Federal University Wukari', city: 'Wukari', state: 'Taraba', listings: 170 },
  { abbr: 'GSUBEB', name: 'Gombe State University', city: 'Gombe', state: 'Gombe', listings: 160 },
  { abbr: 'TSUJ', name: 'Taraba State University', city: 'Jalingo', state: 'Taraba', listings: 150 },
  { abbr: 'ADSU', name: 'Adamawa State University', city: 'Mubi', state: 'Adamawa', listings: 140 },
];

const STATES = [
  'All','Lagos','Oyo','Osun','Ondo','Ogun','Edo','Rivers','Kaduna','Kwara','FCT','Kano','Anambra','Imo','Plateau','Borno','Delta','Abia','Ekiti',
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Create Account', desc: 'Sign up with your student details and get access to your campus marketplace.' },
  { step: '02', title: 'Browse or Post', desc: 'Find what you need or upload products and services for other students to discover.' },
  { step: '03', title: 'Connect Safely', desc: 'Chat, agree on terms, and transact with more confidence inside your student network.' },
  { step: '04', title: 'Build Reputation', desc: 'Complete orders, get reviews, and grow your trust on campus.' },
];

const TESTIMONIALS = [
  { name: 'Amaka O.', uni: 'UNILAG', text: 'I sold my textbooks faster than I expected. The homepage already feels like a serious marketplace.' },
  { name: 'Tunde B.', uni: 'OAU', text: 'I got assignment typing help the same day. This is the kind of platform students will actually use.' },
  { name: 'Chisom E.', uni: 'UNIBEN', text: 'The campus feel is strong and the browsing flow is clean. It looks trustworthy already.' },
];

export default function HomePage() {
  const isAuthed = useStoredSession();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [uniSearch, setUniSearch] = useState('');
  const [activeState, setActiveState] = useState('All');
  const [latestProducts, setLatestProducts] = useState([]);
  const [universityCounts, setUniversityCounts] = useState([]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products`);
        const data = await res.json();
        console.log('PRODUCT API DATA:', data);
        setLatestProducts(
          (data.products || []).map((product) => ({
            emoji: '📦',
            title: product.title || product.name || 'Product',
            price: product.price ? `₦${Number(product.price).toLocaleString()}` : 'No price',
            link: `/products/${product._id || product.id}`,
          }))
        );
      } catch (err) {
        console.log('PRODUCT FETCH ERROR:', err);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchUniversityCounts = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/universities`);
        const data = await res.json();
        setUniversityCounts(data.universities || []);
      } catch (err) {
        console.log('UNIVERSITY FETCH ERROR:', err);
      }
    };
    fetchUniversityCounts();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % FEATURED_ITEMS.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  const featured = FEATURED_ITEMS[featuredIndex];

  const filteredUnis = useMemo(() => {
    return UNIVERSITIES.filter((u) => {
      const q = uniSearch.toLowerCase();
      const matchesSearch = !q || u.abbr.toLowerCase().includes(q) || u.name.toLowerCase().includes(q) || u.city.toLowerCase().includes(q);
      const matchesState = activeState === 'All' || u.state === activeState;
      return matchesSearch && matchesState;
    });
  }, [uniSearch, activeState]);

  const visibleUnis = filteredUnis.slice(0, 12);

  const goSearch = () => {
    const q = searchQuery.trim();
    window.location.href = q ? `/products?q=${encodeURIComponent(q)}` : '/products';
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        :root {
          --green: #1f8f43;
          --green-dark: #187536;
          --green-soft: #eaf8ee;
          
          --text: #1f2937;
          --muted: #6b7280;
          --border: #e5e7eb;
          --bg: #f7f7f8;
          --white: #ffffff;
          --dark: #111827;
        }

        html { scroll-behavior: smooth; }

        body {
          font-family: 'Inter', sans-serif;
          color: var(--text);
          background: #ffffff;
          overflow-x: hidden;
        }

        a { color: inherit; text-decoration: none; }
        button, input { font-family: 'Inter', sans-serif; }

        .page-shell { min-height: 100vh; background: #fff; }

        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
          transition: all 0.25s ease;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid transparent;
        }

        .nav.scrolled {
          background: rgba(255, 255, 255, 0.96);
          border-bottom-color: rgba(0, 0, 0, 0.05);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
        }

        .nav-inner {
          max-width: 1220px; margin: 0 auto; height: 86px;
          padding: 0 28px; display: flex; align-items: center;
          justify-content: space-between; gap: 20px;
        }

        /* ── TWO-TONE BRAND ── */
        .brand { font-size: 2rem; font-weight: 900; letter-spacing: -0.04em; color: #1f2937; }
        .brand span { color: var(--green); }

        .nav-links { display: flex; align-items: center; gap: 30px; list-style: none; }
        .nav-links a { font-size: 1.05rem; font-weight: 500; color: #374151; transition: color 0.2s ease; }
        .nav-links a:hover { color: var(--green); }

        .nav-actions { display: flex; align-items: center; gap: 12px; }

        .btn-login {
          padding: 12px 22px; border-radius: 10px;
          background: #f3f4f6; color: #374151; font-weight: 600; border: 1px solid #ececec;
        }

        .btn-signup {
          padding: 12px 24px; border-radius: 10px;
          background: var(--green); color: #fff; font-weight: 700; border: none;
          box-shadow: 0 10px 25px rgba(31, 143, 67, 0.18);
        }

        .btn-signup:hover { background: var(--green-dark); }

        .hamburger {
          display: none; width: 42px; height: 42px; border-radius: 10px;
          border: 1px solid var(--border); background: #fff;
          align-items: center; justify-content: center; flex-direction: column; gap: 4px; cursor: pointer;
        }
        .hamburger span { width: 18px; height: 2px; background: #111827; border-radius: 2px; }
        .mobile-menu { display: none; }

        .hero { position: relative; padding: 122px 24px 0; background: #f8fafc; }

        .hero-wrap {
          max-width: 1360px; margin: 0 auto; min-height: 760px;
          overflow: hidden; position: relative;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.06);
          background:
            linear-gradient(rgba(20, 30, 24, 0.26), rgba(20, 30, 24, 0.26)),
            url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1800&q=80') center/cover no-repeat;
        }

        .hero-blur {
          position: absolute; inset: 0; backdrop-filter: blur(3px);
          background: linear-gradient(90deg, rgba(20,28,22,0.34) 0%, rgba(20,28,22,0.12) 43%, rgba(255,255,255,0.08) 100%);
        }

        .hero-content {
          position: relative; z-index: 2; max-width: 1220px; margin: 0 auto;
          min-height: 760px; padding: 68px 42px 48px;
          display: grid; grid-template-columns: 1.05fr 0.95fr;
          align-items: center; gap: 40px;
        }

        .hero-copy { max-width: 640px; animation: fadeUp 0.8s ease both; }

        .hero-title {
          font-size: clamp(3.4rem, 6vw, 5.7rem);
          line-height: 0.94; letter-spacing: -0.065em;
          font-weight: 900; color: white; margin-bottom: 18px;
          text-shadow: 0 8px 30px rgba(0, 0, 0, 0.18);
        }
        .hero-title .accent { color: #a9e68a; }

        .hero-desc {
          color: rgba(255, 255, 255, 0.88); font-size: 1.02rem;
          line-height: 1.75; max-width: 580px; margin-bottom: 24px;
        }

        .hero-search {
          display: flex; align-items: stretch; max-width: 680px; width: 100%;
          border-radius: 16px; overflow: hidden;
          box-shadow: 0 18px 50px rgba(0, 0, 0, 0.12);
          background: white; margin-bottom: 20px;
        }

        .hero-search input {
          flex: 1; min-width: 0; padding: 22px 22px;
          border: none; outline: none; font-size: 1.05rem; color: #111827; background: white;
        }

        .hero-search button {
          min-width: 150px; padding: 0 22px; border: none;
          background: var(--green); color: white;
          font-size: 1rem; font-weight: 800; cursor: pointer; transition: background 0.2s ease;
        }
        .hero-search button:hover { background: var(--green-dark); }

        .hero-tags { display: flex; flex-wrap: wrap; gap: 10px; }

        .hero-tag {
          padding: 9px 14px; border-radius: 999px;
          background: rgba(255, 255, 255, 0.12); color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.18);
          font-size: 0.85rem; font-weight: 600; backdrop-filter: blur(8px);
        }

        .hero-right { display: flex; justify-content: center; align-items: center; animation: floatIn 0.9s ease both; }

        .featured-card {
          width: min(520px, 100%); background: rgba(255, 255, 255, 0.95);
          border-radius: 24px; overflow: hidden;
          box-shadow: 0 28px 60px rgba(0, 0, 0, 0.16);
          transform: rotate(-2.5deg);
          transition: transform 0.35s ease, box-shadow 0.35s ease;
          border: 1px solid rgba(255, 255, 255, 0.7);
        }
        .featured-card:hover { transform: rotate(-1deg) translateY(-4px); box-shadow: 0 34px 80px rgba(0, 0, 0, 0.2); }

        .featured-image-wrap { position: relative; height: 250px; overflow: hidden; }
        .featured-image { width: 100%; height: 100%; object-fit: cover; display: block; animation: slowZoom 3.2s ease; }

        .featured-badge {
          position: absolute; top: 18px; right: 18px;
          background: var(--green); color: white;
          font-weight: 700; font-size: 0.95rem; padding: 12px 18px;
          border-radius: 0 16px 0 16px;
          box-shadow: 0 10px 24px rgba(31,143,67,0.25);
        }

        .featured-body { padding: 20px 22px 22px; background: rgba(255, 255, 255, 0.98); }
        .featured-title { font-size: 1.05rem; font-weight: 800; color: #1f2937; margin-bottom: 8px; }

        .featured-meta {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; flex-wrap: wrap;
        }
        .featured-price { font-size: 1.15rem; font-weight: 900; color: var(--green); }
        .featured-seller { display: inline-flex; align-items: center; gap: 8px; font-size: 0.96rem; font-weight: 700; color: #374151; }
        .seller-dot {
          width: 20px; height: 20px; border-radius: 50%;
          background: var(--green); color: #fff;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 0.75rem; line-height: 1;
        }

        .stats-strip { background: #fff; border-top: 1px solid rgba(0,0,0,0.05); border-bottom: 1px solid rgba(0,0,0,0.05); }

        .stats-inner {
          max-width: 1220px; margin: 0 auto; padding: 22px 28px;
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;
        }

        .stat-card { display: flex; align-items: center; gap: 14px; justify-content: center; padding: 6px 12px; }
        .stat-icon { width: 48px; height: 48px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; background: #f5f7fa; }
        .stat-card h3 { font-size: 1.1rem; font-weight: 900; color: #111827; margin-bottom: 2px; }
        .stat-card p { color: var(--muted); font-size: 0.95rem; font-weight: 500; }

        .section { padding: 68px 24px; }
        .section-inner { max-width: 1220px; margin: 0 auto; }
        .section-title { font-size: clamp(2rem, 3vw, 2.9rem); line-height: 1; letter-spacing: -0.05em; font-weight: 900; color: #111827; margin-bottom: 10px; }
        .section-subtitle { font-size: 1.05rem; color: var(--muted); margin-bottom: 28px; font-style: italic; }

        .feed-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; }

        .feed-card {
          background: white; border: 1px solid #eceff3; border-radius: 18px;
          padding: 14px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
        }
        .feed-card:hover { transform: translateY(-5px); border-color: #dbe4dd; box-shadow: 0 18px 36px rgba(15, 23, 42, 0.08); }

        .feed-visual {
          height: 138px; border-radius: 14px;
          background: linear-gradient(180deg, #f8fafc, #f1f5f9);
          display: flex; align-items: center; justify-content: center;
          font-size: 3.7rem; margin-bottom: 14px;
        }

        .feed-title { font-size: 0.98rem; font-weight: 800; color: #1f2937; margin-bottom: 10px; min-height: 40px; }
        .feed-price { font-size: 0.96rem; color: var(--green); font-weight: 900; }

        .how-section { background: #f8fafc; }

        .steps-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }

        .step-card {
          background: white; border: 1px solid #eceff3; border-radius: 20px;
          padding: 22px 18px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
        }
        .step-number { font-size: 2rem; font-weight: 900; color: #d1f1dc; margin-bottom: 12px; letter-spacing: -0.05em; }
        .step-card h3 { font-size: 1.02rem; font-weight: 800; color: #111827; margin-bottom: 10px; }
        .step-card p { font-size: 0.92rem; color: var(--muted); line-height: 1.7; }

        .campus-section { background: #fafafa; border-top: 1px solid #f0f0f0; }

        .uni-search {
          width: 100%; padding: 15px 16px; border: 1px solid #dfe3e8;
          border-radius: 14px; outline: none; font-size: 0.96rem;
          margin-bottom: 14px; background: #fff;
        }
        .uni-search:focus { border-color: rgba(31, 143, 67, 0.5); box-shadow: 0 0 0 4px rgba(31, 143, 67, 0.08); }

        .state-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 18px; }
        .state-pill { border: 1px solid #e5e7eb; background: white; color: #4b5563; padding: 9px 14px; border-radius: 999px; cursor: pointer; font-size: 0.85rem; font-weight: 600; }
        .state-pill.active { background: var(--green); color: white; border-color: var(--green); }

        .uni-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }

        .uni-card {
          background: white; border: 1px solid #eceff3; border-radius: 18px;
          padding: 16px; transition: transform 0.22s ease, box-shadow 0.22s ease;
        }
        .uni-card:hover { transform: translateY(-4px); box-shadow: 0 16px 34px rgba(15, 23, 42, 0.07); }

        .uni-top { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; }
        .uni-icon { width: 42px; height: 42px; border-radius: 12px; background: #f6f9f6; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
        .uni-abbr { font-size: 0.96rem; font-weight: 900; color: #111827; }
        .uni-name { font-size: 0.76rem; color: var(--muted); line-height: 1.35; margin-top: 2px; }

        .uni-footer {
          border-top: 1px solid #f1f5f9; padding-top: 10px;
          display: flex; justify-content: space-between; gap: 8px; font-size: 0.76rem;
        }
        .uni-count { color: var(--green); font-weight: 800; }

        .testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }

        .testimonial-card {
          background: white; border: 1px solid #eceff3; border-radius: 18px;
          padding: 22px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
        }
        .stars { color: var(--green); margin-bottom: 14px; font-size: 1rem; }
        .testimonial-text { color: #374151; line-height: 1.75; font-size: 0.95rem; margin-bottom: 16px; }
        .testimonial-user { display: flex; align-items: center; gap: 12px; }
        .testimonial-avatar { width: 42px; height: 42px; border-radius: 50%; background: var(--green-soft); color: var(--green); font-weight: 800; display: flex; align-items: center; justify-content: center; }
        .testimonial-name { font-size: 0.95rem; font-weight: 800; color: #111827; }
        .testimonial-uni { font-size: 0.82rem; color: var(--muted); }

        .cta { padding: 70px 24px 80px; background: linear-gradient(135deg, #15803d, #166534); }
        .cta-inner { max-width: 1100px; margin: 0 auto; text-align: center; }
        .cta h2 { font-size: clamp(2.1rem, 3.2vw, 3.4rem); line-height: 1.02; letter-spacing: -0.05em; color: white; font-weight: 900; margin-bottom: 14px; }
        .cta p { color: rgba(255, 255, 255, 0.82); font-size: 1.04rem; margin-bottom: 26px; }
        .cta-actions { display: flex; justify-content: center; gap: 14px; flex-wrap: wrap; }
        .cta-white, .cta-outline { padding: 15px 24px; border-radius: 12px; font-weight: 800; }
        .cta-white { background: white; color: #14532d; }
        .cta-outline { background: transparent; color: white; border: 2px solid rgba(255,255,255,0.5); border-radius: 12px; }

        .footer { background: #111827; color: rgba(255, 255, 255, 0.65); padding: 50px 24px 26px; }
        .footer-inner { max-width: 1220px; margin: 0 auto; }

        .footer-top {
          display: grid; grid-template-columns: 1.6fr 1fr 1fr 1fr; gap: 28px;
          padding-bottom: 26px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        /* ── TWO-TONE FOOTER BRAND ── */
        .footer-brand { font-size: 1.8rem; font-weight: 900; letter-spacing: -0.04em; color: white; margin-bottom: 10px; }
        .footer-brand span { color: var(--green); }

        .footer-col h4 { color: white; font-size: 0.96rem; margin-bottom: 14px; font-weight: 800; }
        .footer-col a { display: block; margin-bottom: 10px; font-size: 0.92rem; color: rgba(255, 255, 255, 0.66); }
        .footer-bottom { padding-top: 18px; display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; font-size: 0.88rem; }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes floatIn { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slowZoom { from { transform: scale(1.05); } to { transform: scale(1); } }

        @media (max-width: 1100px) {
          .hero-content { grid-template-columns: 1fr; padding-top: 56px; padding-bottom: 56px; }
          .hero-copy { max-width: 100%; }
          .hero-right { justify-content: flex-start; }
          .feed-grid { grid-template-columns: repeat(3, 1fr); }
          .uni-grid { grid-template-columns: repeat(3, 1fr); }
          .steps-grid { grid-template-columns: repeat(2, 1fr); }
          .testimonials-grid { grid-template-columns: 1fr; }
          .footer-top { grid-template-columns: 1fr 1fr; }
        }

        @media (max-width: 780px) {
          .nav-links, .nav-actions { display: none; }
          .hamburger { display: flex; }
          .mobile-menu {
            display: block; position: fixed; top: 88px; left: 16px; right: 16px;
            z-index: 999; background: white; border-radius: 16px;
            border: 1px solid #eceff3; box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12); padding: 14px;
          }
          .mobile-menu a { display: block; padding: 12px 10px; font-weight: 600; color: #374151; border-bottom: 1px solid #f3f4f6; }
          .mobile-menu a:last-child { border-bottom: none; }
          .hero { padding: 80px 0 0; }
          .hero-wrap { border-radius: 0; }
          .hero-content { padding: 36px 20px 36px; gap: 24px; min-height: auto; }
          .hero-title { font-size: 2.6rem; }
          .hero-desc { font-size: 0.95rem; }
          .hero-search { flex-direction: column; border-radius: 14px; overflow: hidden; }
          .hero-search input { padding: 18px 16px; font-size: 1rem; }
          .hero-search button { min-width: 100%; height: 52px; font-size: 1rem; }
          .hero-right { display: none; }
          .hero-tags { gap: 8px; }
          .hero-tag { font-size: 0.78rem; padding: 7px 12px; }
          .stats-inner { grid-template-columns: 1fr 1fr; gap: 10px; padding: 16px; }
          .stat-card { padding: 4px 8px; }
          .stat-card h3 { font-size: 0.95rem; }
          .stat-card p { font-size: 0.8rem; }
          .feed-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
          .uni-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
          .steps-grid { grid-template-columns: 1fr; gap: 12px; }
          .step-card { padding: 18px 16px; }
          .testimonials-grid { grid-template-columns: 1fr; }
          .section { padding: 48px 20px; }
          .section-title { font-size: 1.8rem; }
          .cta { padding: 52px 20px; }
          .cta h2 { font-size: 1.8rem; }
          .cta-actions { flex-direction: column; align-items: center; }
          .cta-white, .cta-outline { width: 100%; max-width: 320px; text-align: center; }
          .footer-top { grid-template-columns: 1fr 1fr; }
        }

        @media (max-width: 520px) {
          .nav-inner { padding: 0 16px; height: 68px; }
          .brand { font-size: 1.5rem; }
          .hero { padding-top: 68px; }
          .hero-title { font-size: 2.1rem; line-height: 1.05; }
          .hero-content { padding: 28px 16px 28px; }
          .section, .cta, .footer { padding-left: 16px; padding-right: 16px; }
          .feed-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
          .uni-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
          .footer-top { grid-template-columns: 1fr; }
          .footer-bottom { flex-direction: column; gap: 6px; }
          .stats-inner { grid-template-columns: 1fr 1fr; }
          .stat-icon { width: 36px; height: 36px; font-size: 1.1rem; }
          .feed-card { padding: 10px; }
          .feed-visual { height: 100px; font-size: 2.8rem; }
          .uni-card { padding: 12px; }
          .testimonial-card { padding: 16px; }
          .featured-image-wrap { height: 190px; }
        }
      `}</style>

      <div className="page-shell">
        <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
          <div className="nav-inner">
            <a href="/" className="brand">Afri<span>Plate</span></a>

            <ul className="nav-links">
              <li><a href="/products">Products</a></li>
              <li><a href="/services">Services</a></li>
              <li><a href="/jobs">Jobs</a></li>
              <li><a href="#how-it-works">How it Works</a></li>
            </ul>

            <div className="nav-actions">
              {isAuthed ? (
                <a href="/dashboard" className="btn-signup">Dashboard</a>
              ) : (
                <>
                  <a href="/login" className="btn-login">Login</a>
                  <a href="/register" className="btn-signup">Sign Up</a>
                </>
              )}
            </div>

            <button className="hamburger" onClick={() => setMenuOpen((v) => !v)} aria-label="Open menu">
              <span></span><span></span><span></span>
            </button>
          </div>
        </nav>

        {menuOpen && (
          <div className="mobile-menu">
            <a href="/products">Products</a>
            <a href="/services">Services</a>
            <a href="/jobs">Jobs</a>
            <a href="#how-it-works">How it Works</a>
            {isAuthed ? (
              <a href="/dashboard">Dashboard</a>
            ) : (
              <>
                <a href="/login">Login</a>
                <a href="/register">Sign Up</a>
              </>
            )}
          </div>
        )}

        <section className="hero">
          <div className="hero-wrap">
            <div className="hero-blur"></div>
            <div className="hero-content">
              <div className="hero-copy">
                <h1 className="hero-title">
                  The Campus<br />
                  <span className="accent">Marketplace</span> for<br />
                  Nigerian Students
                </h1>
                <p className="hero-desc">
                  Buy, sell, and offer services safely within your campus community.
                  From gadgets to textbooks to student services, AfriPlate helps campus commerce feel modern.
                </p>
                <div className="hero-search">
                  <input
                    type="text"
                    placeholder="Search for items or services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && goSearch()}
                  />
                  <button onClick={goSearch}>Search</button>
                </div>
                <div className="hero-tags">
                  <a className="hero-tag" href="/products?q=iPhone 11">iPhone 11</a>
                  <a className="hero-tag" href="/services?q=Assignment Help">Assignment Help</a>
                  <a className="hero-tag" href="/services?q=Logo Design">Logo Design</a>
                  <a className="hero-tag" href="/products?q=Textbooks">Textbooks</a>
                </div>
              </div>

              <div className="hero-right">
                <div className="featured-card" key={featuredIndex}>
                  <div className="featured-image-wrap">
                    <img src={featured.image} alt={featured.title} className="featured-image" />
                    <div className="featured-badge">{featured.badge}</div>
                  </div>
                  <div className="featured-body">
                    <div className="featured-title">{featured.title}</div>
                    <div className="featured-meta">
                      <div className="featured-price">{featured.price}</div>
                      <div className="featured-seller">
                        <span className="seller-dot">✓</span>
                        {featured.seller}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="stats-strip">
          <div className="stats-inner">
            <div className="stat-card"><div className="stat-icon">🎓</div><div><h3>35,000+</h3><p>Students</p></div></div>
            <div className="stat-card"><div className="stat-icon">🛡️</div><div><h3>20+ Campuses</h3><p>Trusted network</p></div></div>
            <div className="stat-card"><div className="stat-icon">📚</div><div><h3>15,000+</h3><p>Listings</p></div></div>
            <div className="stat-card"><div className="stat-icon">⭐</div><div><h3>4.9/5</h3><p>Student rating</p></div></div>
          </div>
        </section>

        <section className="section">
          <div className="section-inner">
            <h2 className="section-title">Active Universities</h2>
            <p className="section-subtitle">Where students are trading</p>
            <div className="feed-grid">
              {universityCounts?.map((u) => (
                <a key={u.university} href={`/university/${encodeURIComponent(u.university)}`} className="feed-card">
                  <div className="feed-title">{u.university}</div>
                  <div className="feed-price">{u.total_listings} listings</div>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-inner">
            <h2 className="section-title">Latest Listings</h2>
            <p className="section-subtitle">Trending on Campus</p>
            <div className="feed-grid">
              {(latestProducts.length ? latestProducts : LATEST_LISTINGS).map((item) => (
                <a key={item.title} href={item.link} className="feed-card">
                  <div className="feed-visual">{item.emoji}</div>
                  <div className="feed-title">{item.title}</div>
                  <div className="feed-price">{item.price}</div>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="section how-section" id="how-it-works">
          <div className="section-inner">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">Simple, safe, student-first</p>
            <div className="steps-grid">
              {HOW_IT_WORKS.map((item) => (
                <div key={item.step} className="step-card">
                  <div className="step-number">{item.step}</div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section campus-section">
          <div className="section-inner">
            <h2 className="section-title">Find Your University</h2>
            <p className="section-subtitle">AfriPlate is growing across Nigerian campuses</p>
            <input
              className="uni-search" type="text"
              placeholder="Search by university, abbreviation or city..."
              value={uniSearch} onChange={(e) => setUniSearch(e.target.value)}
            />
            <div className="state-pills">
              {STATES.map((state) => (
                <button key={state} className={`state-pill ${activeState === state ? 'active' : ''}`} onClick={() => setActiveState(state)}>{state}</button>
              ))}
            </div>
            <div className="uni-grid">
              {visibleUnis.map((u) => (
                <a key={u.abbr} href={`/universities/${u.abbr.toLowerCase()}`} className="uni-card">
                  <div className="uni-top">
                    <div className="uni-icon">🎓</div>
                    <div>
                      <div className="uni-abbr">{u.abbr}</div>
                      <div className="uni-name">{u.name}</div>
                    </div>
                  </div>
                  <div className="uni-footer">
                    <span>{u.city}, {u.state}</span>
                    <span className="uni-count">{u.listings.toLocaleString()} listings</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-inner">
            <h2 className="section-title">Student Reviews</h2>
            <p className="section-subtitle">Real students, real results</p>
            <div className="testimonials-grid">
              {TESTIMONIALS.map((item) => (
                <div key={item.name} className="testimonial-card">
                  <div className="stars">★★★★★</div>
                  <p className="testimonial-text">"{item.text}"</p>
                  <div className="testimonial-user">
                    <div className="testimonial-avatar">{item.name[0]}</div>
                    <div>
                      <div className="testimonial-name">{item.name}</div>
                      <div className="testimonial-uni">{item.uni}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="cta">
          <div className="cta-inner">
            <h2>Start buying, selling and hustling on campus</h2>
            <p>Join students already using AfriPlate to trade safely within their campus community.</p>
            <div className="cta-actions">
              <a href="/register" className="cta-white">Create Free Account</a>
              <a href="/products" className="cta-outline">Browse Listings</a>
            </div>
          </div>
        </section>

        <footer className="footer">
          <div className="footer-inner">
            <div className="footer-top">
              <div>
                <div className="footer-brand">Afri<span>Plate</span></div>
                <p>The trusted campus marketplace for Nigerian students. Buy, sell, and offer services safely.</p>
              </div>
              <div className="footer-col">
                <h4>Marketplace</h4>
                <a href="/products">Products</a>
                <a href="/services">Services</a>
                <a href="/jobs">Jobs</a>
              </div>
              <div className="footer-col">
                <h4>Account</h4>
                <a href="/register">Sign Up</a>
                <a href="/login">Login</a>
                <a href="/dashboard">Dashboard</a>
              </div>
              <div className="footer-col">
                <h4>Company</h4>
                <a href="/about">About</a>
                <a href="/contact">Contact</a>
                <a href="/privacy">Privacy</a>
              </div>
            </div>
            <div className="footer-bottom">
              <span>© 2026 AfriPlate. Made for Nigerian students.</span>
              <span>Campus commerce, simplified.</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
