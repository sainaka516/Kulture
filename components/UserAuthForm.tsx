'use client'

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

interface FormData {
  username: string
  password: string
  email?: string
  confirmPassword?: string
}

export default function UserAuthForm({
  isSignUp = false,
  className,
  ...props
}: UserAuthFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/explore'
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [isGoogleLoading, setIsGoogleLoading] = React.useState<boolean>(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(isSignUp ? signupSchema : loginSchema),
  })

  async function onSubmit(data: FormData) {
    setIsLoading(true)

    try {
      if (isSignUp) {
        // Handle signup
        console.log('[AUTH] Starting signup process')
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: data.username.toLowerCase(),
            email: (data as z.infer<typeof signupSchema>).email.toLowerCase(),
            password: data.password,
            confirmPassword: (data as z.infer<typeof signupSchema>).confirmPassword,
          }),
        })

        const result = await response.json()
        console.log('result', result)
        console.log('[AUTH] Signup response:', { status: response.status, ...result })

        if (!response.ok) {
          if (response.status === 409) {
            const errorMessage = result.error.toLowerCase()
            if (errorMessage.includes('email')) {
              setError('email', { 
                type: 'manual',
                message: 'This email is already registered'
              })
              throw new Error('This email is already registered')
            } else if (errorMessage.includes('username')) {
              setError('username', {
                type: 'manual',
                message: 'This username is already taken'
              })
              throw new Error('This username is already taken')
            }
          }
          throw new Error(result.error || 'Failed to create account')
        }

        toast.success('Account created successfully! Signing you in...')

        // After successful signup, sign in
        console.log('[AUTH] Attempting sign in after signup')
        const signInResult = await signIn("credentials", {
          username: data.username.toLowerCase(),
          password: data.password,
          redirect: false,
        })

        console.log('[AUTH] Sign in result after signup:', signInResult)

        if (signInResult?.error) {
          throw new Error("Failed to sign in after signup")
        }

        toast.success('Signed in successfully!')
        
        // Wait a moment for the session to be established
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        router.push(callbackUrl)
      } else {
        // Handle login
        console.log('[AUTH] Starting login process:', { 
          username: data.username.toLowerCase()
        })
        
        const result = await signIn("credentials", {
          username: data.username.toLowerCase(),
          password: data.password,
          redirect: false,
          callbackUrl: callbackUrl
        })

        console.log('[AUTH] Login result:', result)

        if (result?.error) {
          if (result.error === "CredentialsSignin") {
            throw new Error("Invalid username or password")
          } else {
            console.error('[AUTH] Unexpected login error:', result.error)
            throw new Error(result.error)
          }
        }

        // Check if we have a session after login
        console.log('[AUTH] Login successful, checking session...')
        
        // Force a session refresh
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        toast.success('Signed in successfully!')
        
        // Wait a moment for the session to be established
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        console.log('[AUTH] Redirecting to:', callbackUrl)
        router.push(callbackUrl)
      }
    } catch (error) {
      console.error('[AUTH] Authentication error:', error)
      toast.error(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    try {
      await signIn("google", { callbackUrl })
    } catch (error) {
      console.error('[AUTH] Google sign in error:', error)
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
              {isSignUp ? "Username" : "Username or Email"}
            </Label>
            <Input
              id="username"
              placeholder={isSignUp ? "Choose a username" : "Enter your username or email"}
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
                placeholder="Enter your email"
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
          {isSignUp && (
            <div className="grid gap-1">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                placeholder="Confirm your password"
                type="password"
                autoCapitalize="none"
                autoComplete="new-password"
                disabled={isLoading || isGoogleLoading}
                {...register("confirmPassword")}
              />
              {errors?.confirmPassword && (
                <p className="px-1 text-xs text-red-600">
                  {errors.confirmPassword.message as string}
                </p>
              )}
            </div>
          )}
          <Button type="submit" disabled={isLoading || isGoogleLoading}>
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
        )}{" "}
        Google
      </Button>
    </div>
  )
} 