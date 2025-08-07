import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Building2, Shield, BarChart3 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { loginSchema } from "@shared/schema";
import { z } from "zod";

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("login");

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const onLogin = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  if (user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex">
      {/* Left side - Login/Register Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">UtamaHR</h1>
            <p className="text-gray-600">Sistem Pengurusan Pekerja Terpadu</p>
          </div>

          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
                  <TabsTrigger value="register" data-testid="tab-register">Daftar</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-6 mt-6">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                data-testid="input-username"
                                className="h-12"
                                disabled={loginMutation.isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="password"
                                data-testid="input-password"
                                className="h-12"
                                disabled={loginMutation.isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {loginMutation.error && (
                        <Alert variant="destructive">
                          <AlertDescription data-testid="error-login">
                            {loginMutation.error.message}
                          </AlertDescription>
                        </Alert>
                      )}

                      <Button 
                        type="submit" 
                        className="w-full h-12"
                        disabled={loginMutation.isPending}
                        data-testid="button-login"
                      >
                        {loginMutation.isPending ? "Signing In..." : "Sign In"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="register" className="space-y-6 mt-6">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                data-testid="input-register-username"
                                className="h-12"
                                disabled={registerMutation.isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="password"
                                data-testid="input-register-password"
                                className="h-12"
                                disabled={registerMutation.isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {registerMutation.error && (
                        <Alert variant="destructive">
                          <AlertDescription data-testid="error-register">
                            {registerMutation.error.message}
                          </AlertDescription>
                        </Alert>
                      )}

                      <Button 
                        type="submit" 
                        className="w-full h-12"
                        disabled={registerMutation.isPending}
                        data-testid="button-register"
                      >
                        {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Hero Section */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-800 text-white p-12 items-center justify-center">
        <div className="max-w-lg text-center">
          <div className="mb-8">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <Users className="w-8 h-8 mb-2" />
                <div className="text-sm font-medium">Pengurusan Pekerja</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <Shield className="w-8 h-8 mb-2" />
                <div className="text-sm font-medium">Keselamatan Terjamin</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <BarChart3 className="w-8 h-8 mb-2" />
                <div className="text-sm font-medium">Analisis Lanjutan</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <Building2 className="w-8 h-8 mb-2" />
                <div className="text-sm font-medium">Pengurusan Syarikat</div>
              </div>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold mb-4">
            Sistem Pengurusan HR yang Komprehensif
          </h2>
          <p className="text-blue-100 text-lg leading-relaxed">
            Uruskan pekerja, kehadiran, gaji dan laporan dengan mudah. 
            Platform yang selamat dan mudah digunakan untuk keperluan HR organisasi anda.
          </p>
        </div>
      </div>
    </div>
  );
}