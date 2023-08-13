import express from 'express';
//import router from './functions.js';
import { getNames } from './functions.js';

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));

//app.use('/functions', router);

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});

app.get('/', async (req, res) => {
    const names = await getNames();
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

