export default function UniversityPage({ params }) {
  const { name } = params;

  return (
    <div style={{ padding: '40px', fontFamily: 'Inter, sans-serif' }}>
      <h1>University Page</h1>
      <p>Campus: {name}</p>
    </div>
  );
}