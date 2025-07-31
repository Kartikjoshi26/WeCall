const express = require('express');
const router = express.Router();
const {getusers,addcontact,searchUser,removeUser} = require('../controllers/UsersController')

router.get('/users',getusers);
router.post('/add',addcontact);
router.post('/searchUser',searchUser);
router.post('/remove',removeUser);

module.exports = router;