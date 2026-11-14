import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export const NotFoundPage: React.FC = () => {
  useDocumentTitle('Page not found');

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-3 text-gray-900">Page not found</h1>
      <p className="mb-6 text-gray-600">The page you are looking for does not exist.</p>
      <Button asChild>
        <Link to="/">Return to home</Link>
      </Button>
    </div>
  );
};
