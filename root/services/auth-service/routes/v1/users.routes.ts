import { Router } from 'express';
import { UsersController } from '@/auth-service/controllers/users.controller';

const router = Router();

router.post('/', UsersController.createUser);
router.post('/login', UsersController.login);
router.get('/:id', UsersController.getUser);
router.get('/', UsersController.getUserByEmail);
router.put('/:id', UsersController.updateUser);
router.delete('/:id', UsersController.deleteUser);

export default router;
