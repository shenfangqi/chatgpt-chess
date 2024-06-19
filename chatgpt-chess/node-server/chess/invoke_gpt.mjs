//https://github.com/openai/openai-node
//https://github.com/openai/openai-node/discussions/217   //v3->v4
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey:'xxxx',
});

/*
const chatCompletion = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [{"role": "user", "content": "Hello!"}],
});
console.log(chatCompletion.choices[0].message);
*/

async function main() {
    let messages = [
        {role: 'user', content: 'Hi ChatGPT, I’m looking for a chess partner who can challenge me and help me improve my skills. Do you want to play a chess game with me? Please tell me if you want to play as black and use algebraic chess notation to communicate your moves. I’d also appreciate it if you could respond with witty comebacks to each one of my moves. Please return all the info into a Json format.'}
    ];
    let chatCompletion = await openai.chat.completions.create({
        messages: messages,
        model: 'gpt-3.5-turbo',
    });

    console.log(chatCompletion.choices[0].message);

    messages.push({role: 'user', content: 'c4'});

    chatCompletion = await openai.chat.completions.create({
        messages: messages,
        model: 'gpt-3.5-turbo',
    });

    console.log(chatCompletion.choices);


console.log("-----");
console.log(messages);

};

main();



