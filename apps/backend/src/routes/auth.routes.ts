import express from 'express';
import passport from '../config/passport';
import {
    loginUser,
    logoutUser,
    verifyToken
} from '../controllers/auth.controller';

const router = express.Router();

router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);
router.get(
    '/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/google',
        session: false
    }),
    async (req, res) => {
        await loginUser(req, res);
    }
);
router.post('/logout', logoutUser);
router.post('/verify', verifyToken);

export default router;
