import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import env from './env';

passport.use(
    new GoogleStrategy(
        {
            clientID: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
            callbackURL: `http://localhost:${env.PORT}/api/auth/google/callback`
        },
        (accessToken, refreshToken, profile, done) => {
            const user = {
                id: profile.id,
                name: profile.displayName,
                email: profile.emails?.[0]?.value
            };
            done(null, user);
        }
    )
);

export default passport;
