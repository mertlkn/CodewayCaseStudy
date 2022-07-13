const express = require('express');
const service = require('../services/service');

const router = express.Router();

router.post('/',async (req,res) => {
    const result = await service.saveLog(req.body);
    res.status(result.code);
    return res.send(result.res);
})

router.get('/', async (req,res) => {
    const result = await service.queryLog();
    res.status(result.code);
    return res.send(result.res);
})

module.exports = router;