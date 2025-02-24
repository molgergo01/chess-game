import { Request, Response } from 'express';
import env from '../config/env';
import jwt from 'jsonwebtoken';
import { User } from '../models/user';
import { createUserIfNotExists } from '../repositories/user.repository';

export async function loginUser(req: Request, res: Response) {
    console.log(`Login request received from ${req.hostname}`);
    const user = new User(req.user?.id, req.user?.name, req.user?.email);
    try {
        await createUserIfNotExists(user);
    } catch (e) {
        console.log(e);
        res.status(500).redirect(`${env.FRONTEND_URL}/login?failedLogin`);
        return;
    }
    const token = jwt.sign(
        { id: user.id, email: user.email },
        env.JWT_SECRET!,
        { expiresIn: '7d' }
    );

    console.log('debug');
    res.status(200)
        .cookie('token', token, {
            httpOnly: true,
            sameSite: 'lax'
        })
        .redirect(`${env.FRONTEND_URL}`);
}

export function logoutUser(req: Request, res: Response) {
    console.log(`Logout request received from ${req.hostname}`);
    res.status(200)
        .clearCookie('token', {
            httpOnly: true,
            sameSite: 'lax'
        })
        .json({ message: 'Logged out' });
}

export function verifyToken(req: Request, res: Response) {
    console.log(`Verify request received from ${req.hostname}`);
    const token = req.cookies.token;
    if (!token) {
        res.status(401).json({ message: 'Unauthorized' });
        console.log('Failed to verify JWT, Token is missing');
        return;
    }

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET!);
        res.status(200).json({ message: 'Authenticated', user: decoded });
        console.log('Successfully verified JWT');
    } catch {
        res.status(401).json({ message: 'Invalid token' });
        console.log('Failed to verify JWT, Invalid Token');
    }
}
