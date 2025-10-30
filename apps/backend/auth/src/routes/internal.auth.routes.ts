import express from 'express';
import container from '../config/container';
import InternalAuthController from '../controllers/internal.auth.controller';

const internalAuthController = container.get(InternalAuthController);
const router = express.Router();

router.post('/verify', internalAuthController.verifyToken.bind(internalAuthController));

export default router;
