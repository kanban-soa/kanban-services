import { Router } from 'express';
import { AuthController } from '@/auth-service/controllers/auth.controller';

const router = Router();

router.post('/', AuthController.createSession);
router.get('/:token', AuthController.getSession);
router.get('/:token/user', AuthController.getSessionWithUser);
router.delete('/:id', AuthController.deleteSession);
router.delete('/user/:userId', AuthController.deleteUserSessions);

router.post('/accounts', AuthController.linkAccount);
router.delete('/accounts/:userId/:providerId', AuthController.unlinkAccount);
router.get('/accounts/:userId', AuthController.getUserAccounts);

router.post('/verifications', AuthController.createVerification);
router.post('/verifications/verify', AuthController.verifyCode);

export default router;
