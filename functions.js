import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyamhtamRybm1jcmRraXl0cGJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTEyNjI0NzksImV4cCI6MjAwNjgzODQ3OX0.9gqfRHYiXG8h7L2A_ilTN3E0FMPjtd5dBgJ3q07AA1Q';
const SUPABASE_URL = 'https://brjhmjdrnmcrdkiytpbg.supabase.co';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
});

export async function getNames() {
    let { data: steam, error } = await supabase
        .from('steam')
        .select('name');
    //console.log(encodeURIComponent(steam?.[0]?.name));
    let name = steam?.[20]?.name;
    let encoded_name = encodeURIComponent(steam?.[20]?.name);
    return {
        name: name,
        encoded_name: encoded_name,
    };
}

/* router.get('/getNames', async (req, res) => {
    try {
        const names = await getNames();
        res.json(names);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
}); */

async function setBuyPrice(buy_price, name) {
    const { data, error } = await supabase
        .from('steam')
        .update({ 'buy_price': buy_price })
        .eq('name', name)
        .select();
    console.log(name + ". Buy price: " + buy_price);
}

async function setSellPrice(sell_price, name) {
    const { data, error } = await supabase
        .from('steam')
        .update({ 'sell_price': sell_price })
        .eq('name', name)
        .select();
    console.log(name + ". Sell price: " + sell_price);
}

//2
const options = {
    method: 'GET',
    headers: {
        'X-RapidAPI-Key': 'dd9f9158d1mshab03b612af0df37p123b98jsn7fb8d555f0c3',
        'X-RapidAPI-Host': 'steam-market-and-store.p.rapidapi.com'
    }
};

async function concatenate(url) {
    let result = (await getNames()).encoded_name;
    url += result;
    console.log(url);
    return url;
}

async function getPrices() {
    let com_url = 'https://steam-market-and-store.p.rapidapi.com/get_orders_hist/730---';
    let url = await concatenate(com_url);

    try {
        const response = await fetch(url, options);
        const resultString = await response.text();
        const result = JSON.parse(resultString);
        console.log(result);

        let buy_price_str = result.Buy[0]?.Statement; //Строка вида: "172 buy orders at $6.64 or higher"
        console.log("buy_price_str: " + buy_price_str);
        let buy_price = await pullOutPrice(buy_price_str); //Цена: 6.64
        console.log("buy price: " + buy_price);

        let sell_price_str = result.Sell[0]?.Statement;
        console.log("sell_price_str: " + sell_price_str);
        let sell_price = await pullOutPrice(sell_price_str);
        console.log("sell price: " + sell_price);

        let name = (await getNames()).name;
        await setBuyPrice(buy_price, name); //name вида "'Blueberries' Buckshot | NSWC SEAL"
        await setSellPrice(sell_price, name);
        //console.log(result);
    } catch (error) {
        console.error(error);
    }
}
//
//Преобразование строки с ценой в число
async function pullOutPrice(price) {
    const regex = /\d+\.\d+/;
    let match = price.match(regex);

    let result;
    if (match && match.length > 0) { //если найдено число, преобразуем во float
        result = parseFloat(match[0]);
        return result;
    } else {
        console.log("Нет числа");
        return 0;
    }
}

//getPrices();

//Заполнение ценами с ТМа
async function setOldSellPrice() {
    const url = "https://market.csgo.com/api/v2/prices/RUB.json";
    let response = await fetch(url, { cache: "no-store" });
    let result = await response.json();

    try {
        for (let i = 0; i < result.items.length; i++) { //result.items.length
            //console.log(result.items[i]);
            let price = result.items[i].price;
            //console.log(price);
            let name = result.items[i].market_hash_name;
            //console.log(name);

            const { data, error } = await supabase
                .from('steam')
                .update({ 'sell_price': price })
                .eq('name', name);
            console.log(name + ". Sell price: " + price);
        }
    } catch (error) {
        console.error(error);
    }
}
//setOldSellPrice();
async function selectRange(greater, less) {
    let { data: steam, error } = await supabase
        .from('steam')
        .select('name, sell_price, buy_price')
        .gte('sell_price', greater) //заменить на buy_price
        .lt('sell_price', less); //заменить на buy_price
    console.log(steam);
}
//selectRange(20, 30);  

//export default router;