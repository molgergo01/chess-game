import express from 'express';
import passport from 'chess-game-backend-common/src/config/passport';
import container from '../config/container';
import AuthController from '../controllers/auth.controller';

const authController = container.get(AuthController);
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
    async (req, res, next) => {
        await authController.loginUser(req, res, next);
    }
);
router.post('/logout', authController.logoutUser.bind(authController));
router.post('/verify', authController.verifyToken.bind(authController));

export default router;
