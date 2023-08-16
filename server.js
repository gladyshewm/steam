import express from 'express';
//import router from './functions.js';
import { selectRange } from './functions.js';

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));

//app.use('/functions', router);

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});

app.get('/', async (req, res) => {
    const greater = parseFloat(req.query.greater) || 0;
    const less = parseFloat(req.query.less) || 100;

    const names = await selectRange(greater, less);
    res.render('user', { names });
});

/* (async () => {
    try {
        const names = await getNames();
        console.log('Names:', names);
    } catch (error) {
        console.error('Error calling getNames:', error);
    }
})(); */

/* (async () => {
    try {
        const prices = await getPrices();
    } catch (error) {
        console.error('Error calling getPrices:', error);
    }
})(); */

