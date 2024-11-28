"use client";

import { useState, useEffect } from "react";
import { AtSign, Lock, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "../reusableCards/alert";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter
} from "../reusableCards/cards";
import { Button } from "../reusableCards/Buttons";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Input } from "../reusableCards/input";
import { Label } from "../reusableCards/lable";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Predefined valid credentials
  const VALID_EMAIL = "oves.altec@omnivoltaic.com";

  useEffect(() => {
    // Check if user is already logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
      // If logged in, try to go back to the previous page or home
      const from = location.state?.from?.pathname || '/home';
      navigate(from, { replace: true });
    }
  }, [location, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setError("");

    // Validate email and password separately
    if (!email) {
      setError("Email is required");
      return;
    }

    if (!password) {
      setError("Password is required");
      return;
    }

    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Invalid email format");
      return;
    }

    // Email-specific validation
    if (email !== VALID_EMAIL) {
      setError("Email not found");
      return;
    }

    // Password-specific validation
    if (password !== "Altec1234") {
      setError("Incorrect password");
      return;
    }

    // If all validations pass
    setError("");
    localStorage.setItem('isLoggedIn', 'true');
    
    // Navigate to the page user was trying to access or home
    const from = location.state?.from?.pathname || '/home';
    navigate(from, { replace: true });
  };

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Link
        to="/"
        className="mb-8 flex items-center text-2xl font-semibold text-primary"
      >
        <img
          src="/images/logo-white.png"
          alt="Omnivoltaic logo"
          width={48}
          height={48}
          className="mr-2"
        />
        Omnivoltaic
      </Link>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full bg-oves-blue text-white">
              Login
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link
            to="/forgot-password"
            className="text-sm text-muted-foreground hover:underline"
          >
            Forgot password?
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}