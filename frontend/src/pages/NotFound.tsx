import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { FileQuestion, Home, Search } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../components/ui/card";

export const NotFound: React.FC = () => {
  useEffect(() => {
    document.title = "404 - Page Not Found | SourceWiki";
  }, []);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full text-center shadow-lg border-gray-200">
        <CardHeader className="flex flex-col items-center pb-2">
          <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <FileQuestion className="h-8 w-8" aria-hidden="true" />
          </div>
          <CardTitle className="text-4xl font-extrabold text-gray-900 tracking-tight">
            404
          </CardTitle>
          <CardDescription className="text-base text-gray-600 mt-2">
            Page not found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Sorry, we could not find the page you are looking for. It might have been moved or does not exist.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button asChild variant="default" className="w-full sm:w-auto">
            <Link to="/" className="flex items-center justify-center gap-2">
              <Home className="h-4 w-4" aria-hidden="true" />
              <span>Go to Home</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link to="/directory" className="flex items-center justify-center gap-2">
              <Search className="h-4 w-4" aria-hidden="true" />
              <span>Browse Directory</span>
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
