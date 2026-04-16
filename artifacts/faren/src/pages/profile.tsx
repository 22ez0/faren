import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useGetUserByUsername, getGetUserByUsernameQueryKey, useRecordProfileView } from "@workspace/api-client-react";
import ProfileView from "@/components/ProfileView";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const recordView = useRecordProfileView();
  
  const { data: profile, isLoading, error } = useGetUserByUsername(username || "", {
    query: {
      queryKey: [] as any,
      enabled: !!username,
      retry: false,
    }
  });

  useEffect(() => {
    if (username) {
      // Record a view for this profile
      recordView.mutate({ data: { username } });
    }
  }, [username]);

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
        <h1 className="text-4xl font-bold mb-4">Profile not found</h1>
        <p className="text-muted-foreground mb-8">The user @{username} doesn't exist or has been deleted.</p>
        <button 
          onClick={() => setLocation("/")}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Return Home
        </button>
      </div>
    );
  }

  return <ProfileView profile={profile} isOwner={false} />;
}
