import { useAuth } from "@/lib/auth";
import { useGetProfileAnalytics, useGetMyProfile } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, Copy, Eye, Users, Heart, Settings, LogOut, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export default function Dashboard() {
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  const { data: analytics, isLoading: analyticsLoading } = useGetProfileAnalytics({
    query: {
      enabled: isAuthenticated,
    }
  });

  const { data: profile, isLoading: profileLoading } = useGetMyProfile({
    query: {
      enabled: isAuthenticated,
    }
  });

  if (authLoading || !isAuthenticated) return null;

  const copyProfileLink = () => {
    if (user) {
      const url = `${window.location.origin}/${user.username}`;
      navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "Your profile link has been copied to your clipboard.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card/50 backdrop-blur-md p-6 rounded-2xl border border-white/10">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.displayName || user?.username}</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" className="border-white/10" onClick={copyProfileLink}>
              <Copy className="w-4 h-4 mr-2" /> Copy Link
            </Button>
            <Link href={`/${user?.username}`}>
              <Button variant="outline" className="border-white/10">
                <ArrowUpRight className="w-4 h-4 mr-2" /> View Profile
              </Button>
            </Link>
            <Link href="/dashboard/edit">
              <Button className="bg-primary hover:bg-primary/90">
                <Settings className="w-4 h-4 mr-2" /> Edit Profile
              </Button>
            </Link>
            <Button variant="ghost" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => logout()}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Views" 
            value={analytics?.totalViews} 
            icon={<Eye className="w-5 h-5 text-primary" />} 
            loading={analyticsLoading} 
          />
          <StatCard 
            title="Followers" 
            value={analytics?.followers} 
            icon={<Users className="w-5 h-5 text-accent" />} 
            loading={analyticsLoading} 
          />
          <StatCard 
            title="Likes" 
            value={analytics?.likes} 
            icon={<Heart className="w-5 h-5 text-red-500" />} 
            loading={analyticsLoading} 
          />
          <StatCard 
            title="Link Clicks" 
            value={analytics?.linkClicks} 
            icon={<ArrowRight className="w-5 h-5 text-blue-500" />} 
            loading={analyticsLoading} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 bg-card/40 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Chart placeholder (requires a charting library like recharts)
                  <br />
                  Total views this week: {analytics?.viewsThisWeek}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Top Countries</CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full rounded" />
                  <Skeleton className="h-10 w-full rounded" />
                  <Skeleton className="h-10 w-full rounded" />
                </div>
              ) : (
                <div className="space-y-4">
                  {analytics?.topCountries && analytics.topCountries.length > 0 ? (
                    analytics.topCountries.map((country, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <span className="font-medium">{country.country}</span>
                        <span className="text-muted-foreground">{country.count} views</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No location data yet
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, icon, loading }: { title: string, value: number | undefined, icon: React.ReactNode, loading: boolean }) {
  return (
    <Card className="bg-card/40 border-white/10 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-3xl font-bold">{value?.toLocaleString() || 0}</div>
        )}
      </CardContent>
    </Card>
  );
}
