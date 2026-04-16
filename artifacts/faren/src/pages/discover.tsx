import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useGetTrendingProfiles } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Discover() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: trendingProfiles, isLoading } = useGetTrendingProfiles({ limit: 20 });
  const [, setLocation] = useLocation();

  const filteredProfiles = trendingProfiles?.filter(profile => 
    profile.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (profile.displayName && profile.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden pb-20">
      <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
      
      <header className="container mx-auto px-4 py-8 z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div>
            <Link href="/" className="text-xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent inline-block mb-2">
              FAREN
            </Link>
            <h1 className="text-4xl font-extrabold tracking-tight">Discover</h1>
            <p className="text-muted-foreground mt-2">Find your next favorite creator.</p>
          </div>
          
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search profiles..." 
              className="pl-10 h-12 bg-card/50 border-white/10 backdrop-blur-sm focus-visible:ring-primary rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array(12).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-2xl bg-card border border-white/5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredProfiles?.map((profile, i) => (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                  onClick={() => setLocation(`/${profile.username}`)}
                  className="cursor-pointer"
                >
                  <div className="group relative block h-72 rounded-2xl overflow-hidden bg-card border border-white/10 transition-all hover:border-primary/50 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]">
                    <div 
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                      style={{ 
                        backgroundImage: profile.backgroundUrl ? `url(${profile.backgroundUrl})` : 'none',
                        opacity: (profile.backgroundOpacity || 50) / 100 
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                    
                    <div className="absolute bottom-0 left-0 w-full p-6 flex flex-col items-center text-center">
                      <div className="relative mb-4">
                        <Avatar className="w-20 h-20 border-2 border-background shadow-xl">
                          <AvatarImage src={profile.avatarUrl || undefined} />
                          <AvatarFallback className="bg-primary/20 text-primary text-xl">
                            {profile.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {profile.discordConnected && profile.discordStatus === 'online' && (
                          <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 border-2 border-background rounded-full" />
                        )}
                      </div>
                      <div className="font-bold text-xl truncate w-full">{profile.displayName || profile.username}</div>
                      <div className="text-sm text-primary/80 mb-3 truncate w-full">@{profile.username}</div>
                      
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span><strong className="text-foreground">{profile.followersCount}</strong> followers</span>
                        <span><strong className="text-foreground">{profile.likesCount}</strong> likes</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {filteredProfiles?.length === 0 && (
              <div className="col-span-full py-20 text-center text-muted-foreground">
                No profiles found matching "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </header>
    </div>
  );
}
