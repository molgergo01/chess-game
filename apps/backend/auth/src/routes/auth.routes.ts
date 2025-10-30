import express, { RequestHandler } from 'express';
import passport from 'chess-game-backend-common/config/passport';
import container from '../config/container';
import AuthController from '../controllers/auth.controller';
import AuthMiddleware from '../middlewares/auth.middleware';

const authController = container.get(AuthController);
const authMiddleware = container.get(AuthMiddleware);
const router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
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
router.post(
    '/logout',
    authMiddleware.authenticate.bind(authMiddleware),
    authController.logoutUser.bind(authController) as RequestHandler
);
router.post('/verify', authController.verifyToken.bind(authController));

export default router;
