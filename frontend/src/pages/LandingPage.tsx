import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  CheckCircle,
  Users,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { useAuth } from "../lib/auth-context";
import { submissionApi, userApi } from "../lib/api";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "../components/ui/tooltip";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0 });
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsResponse, leaderboardResponse] = await Promise.all([
        submissionApi.getStats(),
        userApi.getLeaderboard(undefined, 5),
      ]);

      if (statsResponse.success) setStats(statsResponse.stats);
      if (leaderboardResponse.success) setLeaderboard(leaderboardResponse.users);
    } catch (err) {
      // fail silently
    } finally {
      setLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-100 rounded-full">
              <BookOpen className="h-16 w-16 text-blue-600" />
            </div>
          </div>
          <h1 className="mb-4 text-5xl md:text-7xl font-bold text-gray-900">
            Community-Driven Reference Verification for Wikipedia
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Help maintain the quality and reliability of Wikipedia sources
            through collaborative verification. Join thousands of editors in
            ensuring accurate, trustworthy references.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            {user ? (
              <>
                <Button size="lg" onClick={() => navigate("/submit")} className="flex items-center space-x-2">
                  <span>Submit a Reference</span>
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/directory")}>
                  Browse Directory
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" onClick={() => navigate("/auth")} className="flex items-center space-x-2">
                  <span>Get Started</span>
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/directory")}>
                  Explore Sources
                </Button>
              </>
            )}
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <CardTitle>{loading ? "—" : stats.approved || "—"}</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CardDescription className="cursor-help underline decoration-dotted">
                      Verified Sources
                    </CardDescription>
                  </TooltipTrigger>
                  <TooltipContent>
                    Sources that have passed community and country-level verification.
                  </TooltipContent>
                </Tooltip>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  <Users className="h-10 w-10 text-blue-600" />
                </div>
                <CardTitle>{loading ? "—" : stats.approved || "—"}</CardTitle>
                <CardDescription>Active Contributors</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  <TrendingUp className="h-10 w-10 text-purple-600" />
                </div>
                <CardTitle>{loading ? "—" : stats.approved || "—"}</CardTitle>
                <CardDescription>Total Submissions</CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Remaining sections: How It Works, Features, Leaderboard, CTA */}
          {/* Keep the same structure as your existing code */}
        </div>
      </div>
    </TooltipProvider>
  );
};
