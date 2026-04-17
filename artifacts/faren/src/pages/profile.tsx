import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useGetUserByUsername, getGetUserByUsernameQueryKey, useRecordProfileView } from "@workspace/api-client-react";
import ProfileView from "@/components/ProfileView";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";

const apiBase = () => (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` });

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const recordView = useRecordProfileView();
  const { isAuthenticated } = useAuth();

  const [isFollowing, setIsFollowing] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  const { data: profile, isLoading, error, refetch } = useGetUserByUsername(username || "", {
    query: {
      queryKey: getGetUserByUsernameQueryKey(username || ""),
      enabled: !!username,
      retry: false,
    }
  });

  useEffect(() => {
    if (username) {
      recordView.mutate({ data: { username } });
    }
  }, [username]);

  useEffect(() => {
    if (profile) {
      setIsFollowing(!!(profile as any).isFollowing);
      setHasLiked(!!(profile as any).hasLiked);
    }
  }, [profile]);

  const handleFollow = async () => {
    if (!isAuthenticated || followLoading || !username) return;
    setFollowLoading(true);
    try {
      const method = isFollowing ? "DELETE" : "POST";
      const res = await fetch(`${apiBase()}/api/users/${username}/follow`, {
        method,
        headers: authHeader(),
      });
      if (res.ok) {
        setIsFollowing(!isFollowing);
        refetch();
      }
    } catch { } finally {
      setFollowLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated || likeLoading || !username) return;
    setLikeLoading(true);
    try {
      const res = await fetch(`${apiBase()}/api/users/${username}/like`, {
        method: "POST",
        headers: authHeader(),
      });
      if (res.ok) {
        setHasLiked(true);
        refetch();
      }
    } catch { } finally {
      setLikeLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="w-32 h-32 rounded-full" />
          <Skeleton className="w-48 h-8" />
          <Skeleton className="w-32 h-4" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-4xl font-bold mb-4">Perfil não encontrado</h1>
        <p className="text-white/50 mb-8">O usuário @{username} não existe ou foi removido.</p>
        <button
          onClick={() => setLocation("/")}
          className="px-6 py-3 bg-white text-black rounded font-medium hover:bg-white/90 transition-colors"
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  return (
    <ProfileView
      profile={profile}
      isOwner={false}
      onFollow={handleFollow}
      onLike={handleLike}
      isFollowing={isFollowing}
      hasLiked={hasLiked}
      username={username}
    />
  );
}
