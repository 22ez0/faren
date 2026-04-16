import { Link } from "wouter";
import { motion } from "framer-motion";
import { useGetTrendingProfiles } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Home() {
  const { data: trendingProfiles, isLoading } = useGetTrendingProfiles({ limit: 4 });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent/20 blur-[120px] rounded-full" />
      </div>

      <header className="container mx-auto px-4 py-6 flex items-center justify-between z-10">
        <div className="text-2xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
          FAREN
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="hover:bg-white/5">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(139,92,246,0.4)]">
              Claim your link
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-20 z-10 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
            Your digital identity,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              amplified.
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            The ultimate personalized profile platform for creators, gamers, and music heads. Dripping in glassmorphism, powered by your data.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 shadow-[0_0_30px_rgba(139,92,246,0.5)]">
                Build your shrine
              </Button>
            </Link>
            <Link href="/discover">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-white/10 hover:bg-white/5">
                Explore trending
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="mt-24 w-full"
        >
          <h2 className="text-2xl font-bold mb-8 text-center">Featured Profiles</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-64 rounded-xl bg-white/5 animate-pulse" />
              ))
            ) : (
              trendingProfiles?.map((profile, i) => (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + (i * 0.1) }}
                >
                  <Link href={`/${profile.username}`}>
                    <div className="group relative block h-64 rounded-xl overflow-hidden bg-card border border-white/10 transition-all hover:border-primary/50 hover:shadow-[0_0_30px_rgba(139,92,246,0.2)]">
                      <div 
                        className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-60 transition-opacity"
                        style={{ backgroundImage: profile.backgroundUrl ? `url(${profile.backgroundUrl})` : 'none' }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                      
                      <div className="absolute bottom-0 left-0 w-full p-6 flex flex-col items-center text-center">
                        <Avatar className="w-16 h-16 border-2 border-background mb-3">
                          <AvatarImage src={profile.avatarUrl || undefined} />
                          <AvatarFallback>{profile.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="font-bold text-lg">{profile.displayName || profile.username}</div>
                        <div className="text-sm text-primary">@{profile.username}</div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
