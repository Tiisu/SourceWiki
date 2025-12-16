import { useParams } from 'react-router-dom';
import { references } from '../../lib/references';

export default function CountryPage() {
  const { slug } = useParams<{ slug: string }>();

  if (!slug) return null;

  const countryReferences = references.filter(
    (ref) => ref.country === slug && ref.verified
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-4xl font-bold capitalize mb-6">
        {slug}
      </h1>

      {countryReferences.length === 0 ? (
        <p className="text-gray-500">
          No verified references available for this country yet.
        </p>
      ) : (
        <div className="space-y-4">
          {countryReferences.map((ref) => (
            <div key={ref.id} className="border p-4 rounded">
              <h3 className="font-semibold">{ref.title}</h3>
              <p className="text-sm text-gray-500">{ref.source}</p>
              <a
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 text-sm"
              >
                View source
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
