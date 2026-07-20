import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { api, saveToken } from "@/lib/api";
import { useAuthStore } from "@/features/auth/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Mail, Loader2, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setUser } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      api.login(email, password),
    onSuccess: (data: any) => {
      saveToken(data.token);
      setUser({
        id: data.admin.id,
        auth_id: data.admin.id,
        email: data.admin.email,
        full_name: data.admin.full_name,
        role: data.admin.role as import("@/features/auth/store/authStore").AdminRole,
      });
      navigate("/dashboard");
    },
    onError: (error: any) => {
      console.error("Login mutation failed:", error);
      toast({
        title: "Connexion échouée",
        description: error.message || "Email ou mot de passe incorrect.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-sidebar flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div
            className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center shadow-lg"
            style={{ boxShadow: '0 4px 16px rgba(240,48,48,0.4)' }}
          >
            <Zap size={32} color="#fff" fill="#fff" />
          </div>
        </div>
        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">JAHEEZ Admin</CardTitle>
            <CardDescription>
              Connectez-vous pour accéder au panneau de contrôle
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@jaheez.ma"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loginMutation.isPending}
                    data-testid="input-email"
                    autoComplete="email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loginMutation.isPending}
                    data-testid="input-password"
                    autoComplete="current-password"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending || !email || !password}
                data-testid="button-login"
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  "Accéder au dispatch"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-white/50 mt-6">
          JAHEEZ Admin · Accès réservé aux opérateurs
        </p>
      </div>
    </div>
  );
}
