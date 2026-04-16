import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useGetMyProfile, useUpdateProfile, Profile } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import ProfileView from "@/components/ProfileView";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save } from "lucide-react";

const profileSchema = z.object({
  displayName: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  avatarUrl: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
  bannerUrl: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
  backgroundUrl: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
  accentColor: z.string().optional().nullable(),
  glowColor: z.string().optional().nullable(),
  backgroundOpacity: z.number().min(0).max(100).optional().nullable(),
  cursorStyle: z.string().optional().nullable(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function EditProfile() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: profile, isLoading: profileLoading } = useGetMyProfile({
    query: {
      enabled: isAuthenticated,
    }
  });

  const updateProfile = useUpdateProfile();
  
  const [liveProfile, setLiveProfile] = useState<Partial<Profile>>({});

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      bio: "",
      avatarUrl: "",
      bannerUrl: "",
      backgroundUrl: "",
      accentColor: "hsl(var(--primary))",
      glowColor: "hsl(var(--primary))",
      backgroundOpacity: 50,
      cursorStyle: "default",
    },
  });

  // Watch form values for live preview
  useEffect(() => {
    const subscription = form.watch((value) => {
      setLiveProfile(prev => ({
        ...prev,
        ...value,
      }));
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Init form
  useEffect(() => {
    if (profile) {
      form.reset({
        displayName: profile.displayName || "",
        bio: profile.bio || "",
        avatarUrl: profile.avatarUrl || "",
        bannerUrl: profile.bannerUrl || "",
        backgroundUrl: profile.backgroundUrl || "",
        accentColor: profile.accentColor || "hsl(var(--primary))",
        glowColor: profile.glowColor || "hsl(var(--primary))",
        backgroundOpacity: profile.backgroundOpacity ?? 50,
        cursorStyle: profile.cursorStyle || "default",
      });
      setLiveProfile(profile);
    }
  }, [profile, form]);

  if (authLoading || profileLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  const onSubmit = (data: ProfileFormValues) => {
    updateProfile.mutate(
      { data: data as any },
      {
        onSuccess: () => {
          toast({ title: "Profile updated successfully" });
        },
        onError: (err: any) => {
          toast({
            title: "Failed to update profile",
            description: err.error || "An unexpected error occurred",
            variant: "destructive",
          });
        }
      }
    );
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Editor Panel (Left) */}
      <div className="w-full lg:w-[500px] xl:w-[600px] flex flex-col border-r border-white/10 bg-card/30 backdrop-blur-xl z-20 shadow-2xl relative">
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-4 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div className="font-semibold text-sm">Editor</div>
          <Button 
            size="sm" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={form.handleSubmit(onSubmit)}
            disabled={updateProfile.isPending}
          >
            <Save className="w-4 h-4 mr-2" /> 
            {updateProfile.isPending ? "Saving..." : "Save"}
          </Button>
        </header>

        <ScrollArea className="flex-1">
          <div className="p-6">
            <Form {...form}>
              <form className="space-y-8">
                
                <Tabs defaultValue="basic">
                  <TabsList className="w-full grid grid-cols-3 bg-white/5 mb-6">
                    <TabsTrigger value="basic">Basic</TabsTrigger>
                    <TabsTrigger value="theme">Theme</TabsTrigger>
                    <TabsTrigger value="integrations">Integrations</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="basic" className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium tracking-tight">Personal Info</h3>
                      <FormField control={form.control} name="displayName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Name</FormLabel>
                          <FormControl>
                            <Input className="bg-black/20 border-white/10" {...field} value={field.value || ""} />
                          </FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="bio" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <Textarea className="bg-black/20 border-white/10 resize-none h-24" {...field} value={field.value || ""} />
                          </FormControl>
                        </FormItem>
                      )} />
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/10">
                      <h3 className="text-lg font-medium tracking-tight">Images</h3>
                      <FormField control={form.control} name="avatarUrl" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Avatar URL</FormLabel>
                          <FormControl>
                            <Input className="bg-black/20 border-white/10" placeholder="https://..." {...field} value={field.value || ""} />
                          </FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="bannerUrl" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Banner URL</FormLabel>
                          <FormControl>
                            <Input className="bg-black/20 border-white/10" placeholder="https://..." {...field} value={field.value || ""} />
                          </FormControl>
                        </FormItem>
                      )} />
                    </div>
                  </TabsContent>

                  <TabsContent value="theme" className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium tracking-tight">Colors</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="accentColor" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Accent Color</FormLabel>
                            <FormControl>
                              <div className="flex gap-2">
                                <Input type="color" className="w-12 h-10 p-1 bg-black/20 border-white/10" {...field} value={field.value || "#8b5cf6"} />
                                <Input className="flex-1 bg-black/20 border-white/10" {...field} value={field.value || ""} />
                              </div>
                            </FormControl>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="glowColor" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Glow Color</FormLabel>
                            <FormControl>
                              <div className="flex gap-2">
                                <Input type="color" className="w-12 h-10 p-1 bg-black/20 border-white/10" {...field} value={field.value || "#c026d3"} />
                                <Input className="flex-1 bg-black/20 border-white/10" {...field} value={field.value || ""} />
                              </div>
                            </FormControl>
                          </FormItem>
                        )} />
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/10">
                      <h3 className="text-lg font-medium tracking-tight">Background</h3>
                      <FormField control={form.control} name="backgroundUrl" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Background Image URL</FormLabel>
                          <FormControl>
                            <Input className="bg-black/20 border-white/10" placeholder="https://..." {...field} value={field.value || ""} />
                          </FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="backgroundOpacity" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Background Opacity ({field.value}%)</FormLabel>
                          <FormControl>
                            <Input type="range" min="0" max="100" className="w-full accent-primary" {...field} value={field.value || 50} onChange={e => field.onChange(Number(e.target.value))} />
                          </FormControl>
                        </FormItem>
                      )} />
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/10">
                      <h3 className="text-lg font-medium tracking-tight">Misc</h3>
                      <FormField control={form.control} name="cursorStyle" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cursor Style</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || "default"}>
                            <FormControl>
                              <SelectTrigger className="bg-black/20 border-white/10">
                                <SelectValue placeholder="Select a cursor style" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="default">Default</SelectItem>
                              <SelectItem value="crosshair">Crosshair</SelectItem>
                              <SelectItem value="pointer">Pointer</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                    </div>
                  </TabsContent>

                  <TabsContent value="integrations" className="space-y-6">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center text-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        Discord & Music integrations would be authenticated via OAuth in a real environment.
                        For this Faren demo, data is mocked from the API.
                      </p>
                      <Button variant="outline" className="w-full border-white/10 mb-2">Connect Discord</Button>
                      <Button variant="outline" className="w-full border-white/10">Connect Spotify</Button>
                    </div>
                  </TabsContent>
                </Tabs>

              </form>
            </Form>
          </div>
        </ScrollArea>
      </div>

      {/* Live Preview Panel (Right) */}
      <div className="hidden lg:block flex-1 bg-black relative">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-xs font-medium tracking-wider uppercase text-white/70 shadow-xl pointer-events-none">
          Live Preview
        </div>
        <div className="w-full h-full overflow-y-auto overflow-x-hidden relative scale-[0.9] origin-top rounded-2xl border border-white/10 shadow-2xl mt-12 bg-background">
          <ProfileView profile={liveProfile as any} isOwner={true} />
        </div>
      </div>
    </div>
  );
}
