'use client'

import * as React from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/Icons"
import { toast } from "sonner"

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  isSignUp?: boolean
}

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
})

const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export default function UserAuthForm({
  isSignUp = false,
  className,
  ...props
}: UserAuthFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [isGoogleLoading, setIsGoogleLoading] = React.useState<boolean>(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isSignUp ? signupSchema : loginSchema),
  })

  async function onSubmit(data: any) {
    setIsLoading(true)

    try {
      if (isSignUp) {
        // Handle signup
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error)
        }

        // After successful signup, sign in
        const result = await signIn("credentials", {
          username: data.username,
          password: data.password,
          redirect: false,
        })

        if (result?.error) {
          throw new Error("Failed to sign in")
        }

        router.push("/")
      } else {
        // Handle login
        const result = await signIn("credentials", {
          username: data.username,
          password: data.password,
          redirect: false,
        })

        if (result?.error) {
          throw new Error("Invalid credentials")
        }

        router.push("/")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    try {
      await signIn("google", { callbackUrl: "/" })
    } catch (error) {
      toast.error("Something went wrong with Google sign in")
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className={className} {...props}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-2">
          <div className="grid gap-1">
            <Label htmlFor="username">
              Username {isSignUp && "or Email"}
            </Label>
            <Input
              id="username"
              placeholder={isSignUp ? "johndoe" : "Enter your username"}
              type="text"
              autoCapitalize="none"
              autoComplete="username"
              autoCorrect="off"
              disabled={isLoading || isGoogleLoading}
              {...register("username")}
            />
            {errors?.username && (
              <p className="px-1 text-xs text-red-600">
                {errors.username.message as string}
              </p>
            )}
          </div>
          {isSignUp && (
            <div className="grid gap-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="john@example.com"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                disabled={isLoading || isGoogleLoading}
                {...register("email")}
              />
              {errors?.email && (
                <p className="px-1 text-xs text-red-600">
                  {errors.email.message as string}
                </p>
              )}
            </div>
          )}
          <div className="grid gap-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              placeholder={isSignUp ? "Create a password" : "Enter your password"}
              type="password"
              autoCapitalize="none"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              disabled={isLoading || isGoogleLoading}
              {...register("password")}
            />
            {errors?.password && (
              <p className="px-1 text-xs text-red-600">
                {errors.password.message as string}
              </p>
            )}
          </div>
          <Button disabled={isLoading}>
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isSignUp ? "Sign Up" : "Sign In"}
          </Button>
        </div>
      </form>
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <Button
        variant="outline"
        type="button"
        disabled={isLoading || isGoogleLoading}
        onClick={handleGoogleSignIn}
        className="w-full"
      >
        {isGoogleLoading ? (
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icons.google className="mr-2 h-4 w-4" />
        )}
        Google
      </Button>
    </div>
  )
} 