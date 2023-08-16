import { createClient } from '@supabase/supabase-js';

const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyamhtamRybm1jcmRraXl0cGJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTEyNjI0NzksImV4cCI6MjAwNjgzODQ3OX0.9gqfRHYiXG8h7L2A_ilTN3E0FMPjtd5dBgJ3q07AA1Q';
const SUPABASE_URL = 'https://brjhmjdrnmcrdkiytpbg.supabase.co';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
});

//2
const options = {
    method: 'GET',
    headers: {
        'X-RapidAPI-Key': 'dd9f9158d1mshab03b612af0df37p123b98jsn7fb8d555f0c3',
        'X-RapidAPI-Host': 'steam-market-and-store.p.rapidapi.com'
    }
};

async function getNames() { //не используется
    let { data: steam, error } = await supabase
        .from('steam')
        .select('name');
    //console.log(encodeURIComponent(steam?.[0]?.name));
    let name = steam?.[35]?.name;
    let encoded_name = encodeURIComponent(steam?.[35]?.name);
    return {
        name: name,
        encoded_name: encoded_name,
    };
}

async function updateDate(name) {
    let last_check = new Date();

    const { data, error } = await supabase
        .from('steam')
        .update({ 'last_check': last_check })
        .eq('name', name)
        .select();
    return last_check;
}

async function setPrices(sell_price, buy_price, name) {
    const { data, error } = await supabase
        .from('steam')
        .update({ 'sell_price': sell_price, 'buy_price': buy_price })
        .eq('name', name)
        .select();
    console.log(name + ". Sell price: " + sell_price + ". Buy price: " + buy_price);
    let updatedDate = await updateDate(name);
    return updatedDate;
}

async function concatenate(url) {
    let result = (await getNames()).encoded_name;
    url += result;
    console.log(url);
    return url;
}

async function getPrices(name) {
    let com_url = 'https://steam-market-and-store.p.rapidapi.com/get_orders_hist/730---';
    let url = await concatenate(com_url);

    try {
        const response = await fetch(url, options);
        const resultString = await response.text();
        const result = JSON.parse(resultString);
        //console.log(result);

        let buy_price_str = result.Buy[0]?.Statement; //Строка вида: "172 buy orders at $6.64 or higher"
        let buy_price = await pullOutPrice(buy_price_str); //Цена: 6.64
        console.log("buy price: " + buy_price);

        let sell_price_str = result.Sell[0]?.Statement;
        let sell_price = await pullOutPrice(sell_price_str);
        console.log("sell price: " + sell_price);

        //let name = (await getNames()).name;
        let updatedDate = await setPrices(sell_price, buy_price, name); //name вида "'Blueberries' Buckshot | NSWC SEAL"
        //console.log(result);
        return { sell_price, buy_price, updatedDate };

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

//Заполнение ценами с ТМа
async function setOldSellPrice() { //не используется, разовое заполнение
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
export async function selectRange(greater, less) {
    let { data: steam, error } = await supabase
        .from('steam')
        .select('name, sell_price, buy_price, last_check')
        .gte('sell_price', greater) //заменить на buy_price
        .lt('sell_price', less); //заменить на buy_price
    //console.log(steam);
    let now = new Date();

    const oneDay = 7 * 24 * 60 * 60 * 1000; //Количество миллисекунд в одном дне

    for (let i = 0; i < 3; i++) {
        const lastCheckDate = new Date(steam[i].last_check);
        if ((now - lastCheckDate) >= oneDay) {
            console.log("Прошёл день с момента проверки цены. Обновление цены " + JSON.stringify(steam[i].name));
            let updatedPrices = await getPrices(steam[i].name);
            steam[i].buy_price = updatedPrices.buy_price;
            steam[i].sell_price = updatedPrices.sell_price;
            steam[i].last_check = updatedPrices.updatedDate;
        } else {
            console.log("Цена актуальная " + (now - lastCheckDate) + ((now - lastCheckDate) >= oneDay));
        }
    }
    return steam;
}
