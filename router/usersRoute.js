const express = require('express');
const userController = require('../controller/userController');
const router = express.Router();

router.get('/users',userController.getAllUsers);
router.post('/users/sign-up',userController.createUser);
router.post('/users/login',userController.loginUser);
router.post('/users/forgot-password',userController.forgetPassword);
router.patch('/users/reset-password/:token',userController.resetPassword);
router.patch('/users/update-password',userController.protect,userController.updatePassword);
router.patch('/users/update-details',userController.protect,userController.updateMe);
router.patch('/users/delete-me',userController.protect,userController.deleteMe);


module.exports = router;
