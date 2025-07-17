import { NextAuthOptions, User as NextAuthUser } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getDb } from '@/lib/db'; // Assuming getDb is correctly in @/lib/db
import bcrypt from 'bcrypt';

// Define a type for our application's user structure from the database
interface AppUser {
  id: number;
  username: string;
  pin_hash: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text", placeholder: "John or Jane" },
        pin: { label: "PIN", type: "password", placeholder: "4-digit PIN" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.pin) {
          console.log('Missing username or PIN in credentials');
          return null;
        }

        const db = await getDb();
        try {
          const userFromDb = await db.get<AppUser>('SELECT id, username, pin_hash FROM users WHERE username = ?', credentials.username);

          if (!userFromDb) {
            console.log(`User not found: ${credentials.username}`);
            return null; // User not found
          }

          const pinMatch = await bcrypt.compare(credentials.pin, userFromDb.pin_hash);

          if (pinMatch) {
            console.log(`PIN match for user: ${credentials.username}`);
            // Return user object that NextAuth expects.
            // The 'id' property is essential. 'name' and 'email' are common but optional.
            return {
              id: userFromDb.id.toString(), // Must be a string for NextAuth User type
              name: userFromDb.username,    // Use username as 'name' for NextAuth session
            } as NextAuthUser; // Cast to NextAuthUser type
          } else {
            console.log(`PIN mismatch for user: ${credentials.username}`);
            return null; // PIN doesn't match
          }
        } catch (error) {
          console.error("Error in authorize function:", error);
          return null; // Error during authorization
        } finally {
          await db.close();
        }
      }
    })
  ],
  session: {
    strategy: 'jwt', // Using JSON Web Tokens for session management
  },
  callbacks: {
    async jwt({ token, user }) {
      // This callback is called when a JWT is created (i.e., on sign in)
      // or updated (i.e., on session access in the client).
      // `user` is only passed on sign-in.
      if (user) {
        token.id = user.id; // user.id is from the authorize function
        token.username = user.name; // user.name is from the authorize function (which is our app username)
      }
      return token;
    },
    async session({ session, token }) {
      // This callback is called whenever a session is checked.
      // We want to pass some data from the token to the client-side session object.
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.username as string; // Add username to session.user
      }
      return session;
    }
  },
  pages: {
    signIn: '/login', // Redirect users to our custom login page if they try to access protected content
    // error: '/auth/error', // Optional: A page to display authentication errors
  },
  // You must set a NEXTAUTH_SECRET in your .env.local file for production.
  // It's used to encrypt the JWTs and cookies.
  // secret: process.env.NEXTAUTH_SECRET,
  // debug: process.env.NODE_ENV === 'development', // Optional: For more detailed logs
};
