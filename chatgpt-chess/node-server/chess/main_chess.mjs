import { Server } from 'socket.io';
import OpenAI from 'openai';
import scene from './chess_scene.mjs';
const io = new Server(3000, {
    pingInterval: 10000, // Ping interval set to 10 seconds
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const openai = new OpenAI({
    apiKey:'xxxx',
});

function extractWordsInBraces(text) {
  const regex = /\{([^{}]+)\}/g;
  const matches = [];
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    matches.push(match[1]);
  }

  return matches;
}

function testNotations(notations) {
    const my_scene = new scene();
    my_scene.init();

    notations.forEach((x=> {
        console.log(x);
        my_scene.process_notation(x[0], "m");
        my_scene.process_notation(x[1], "e");
    }));

    let board = my_scene.generateChessBoard();
    my_scene.displayChessBoard(board);
}

async function ask_ai(messages) {
	console.log("--------start asking ai---------");
    let chatCompletion = await openai.chat.completions.create({
        messages: messages,
        //model: 'gpt-3.5-turbo',
        //model: 'gpt-4',
        model:'gpt-4-1106-preview',
        max_tokens: 150,        // Adjust as needed for response length
        temperature: 1.0,       // A balance between randomness and determinism
        n: 1,                    // Number of completions to generate
        stop: null,              // Token(s) at which the API will stop generating further tokens
        frequency_penalty: 0.0, // Controls the penalty for using frequent tokens
        presence_penalty: 0.0
    });

    console.log(chatCompletion.choices[0].message.content);
    messages.push({role: 'assistant', content: chatCompletion.choices[0].message.content});

    let content = chatCompletion.choices[0].message.content;

    return content;
};

export async function re_prompt_step(this_scene) {
    this_scene.error_tried++;
    if(this_scene.error_tried>0) {
        //emit error to client here.
        return false;
    }
    //messages.push({role: 'user', content: "please revise your last step. and give the notation only"});
    this_scene.messages.push({role: 'user', content: "please revise your last step by moving another piece. and give the notation only"});

    let ret_content = await ask_ai(this_scene.messages);
    console.log("prompt move:" + ret_content);
    let ret =  this_scene.process_notation(ret_content, "e");
    if(ret) {
        console.log("---should send to client:")
        console.log(ret);
        let board = this_scene.generateChessBoard();
        this_scene.socket.emit('grid', JSON.stringify(ret));        
    } else {
        console.log("---re_prompt_step:chatgpt chess notation failed!");
    }
};

io.on('connection', (socket) => {
    console.log('a user connected');
    console.log("--generate chess board--");
    
    const my_scene = new scene();
    my_scene.init(socket);

    let board = my_scene.generateChessBoard();
    let notation_pairs = [];
    let pair = [];
    let my_last_move = "";

    //my_scene.messages = [];
    //my_scene.messages.push({role: "system", content: "I want you to act as a rival chess player as black. I We will say our moves in reciprocal order. and We will use algebraic chess notation to communicate our moves.I will be white, So I will go first. After my first message i will just write my move. so you should wait me after I write my move.  Don't forget to update the state of the board in your mind as we make moves. and make sure only give me your move which is just one single rightful chess notation format.Notice that no any else message such as hint and suggestion should be given out."})

    socket.emit('init', JSON.stringify(board));
    my_scene.displayChessBoard(board);

    //ask_ai(my_scene.messages);

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    socket.on('steps', async (data) => {
        try {
            console.log("----steps----:" + data);
            let moves = my_scene.get_available_moves(data);
            console.log(moves);
            socket.emit('mysteps', JSON.stringify(moves));
        } catch (error) {
            console.error("Error processing steps:", error);
            // You might also want to send a message back to the client to indicate an error
            //socket.emit('error', 'An error occurred while processing your request.');
        }
    });

    socket.on('crazytry', async (data) => {
        console.log("-----gpt crazy, try again-----");
        my_scene.messages = [];

        var current_notations = notation_pairs;
        let crazy_content = "I want you to act as a rival chess player and continue the current play which defined as the array[n][2] in which array[n][0] represent the white move which is my move, array[n][1] represent the black move which is your move, We will say our moves in reciprocal order. and We will use algebraic chess notation to communicate our moves. You should only give out a single move notation without any explanation or hint or any else words.";

        //current_notations.push(pair);
        crazy_content += JSON.stringify(current_notations);

        if(my_scene.repeated_crazy_notations.length>0) {
            let repeated_notations = JSON.stringify(my_scene.repeated_crazy_notations);
            crazy_content += ". and the given single move notation by you shouldn't be one of ";
            crazy_content += repeated_notations;
        }

        console.log(crazy_content);

        my_scene.messages.push({role: "system", content: crazy_content});
        
        let ret_content = await ask_ai(my_scene.messages);
        console.log("your move:" + ret_content);

        let ret = my_scene.process_notation(ret_content, "e");
        if(ret) {
            console.log("---crazytry:should send to client:")
            console.log(ret);
            board = my_scene.generateChessBoard();
            my_scene.displayChessBoard(board);
            socket.emit('grid', JSON.stringify(ret));
            my_scene.error_tried = 0;
            
            notation_pairs[notation_pairs.length-1][1] = ret_content; 
            console.log("-------crazytry:pairs----");
            console.log(notation_pairs);

        } else {
            console.log("---crazytry failed!");
        }

    });

    socket.on('plays', async (data) => {
        try {
            console.log("----plays----:" + data);
            pair = [];
            const dd = data.split("||");
            const d_role = dd[0]
            const d_pos = dd[1];
            const o_pos = dd[2];
            //const coord = my_scene._chessNumberToCoord(d_pos);
            const no = my_scene.gen_notation_for_client(d_role, d_pos, o_pos);
            pair[0] = no;
            
            console.log("my move----:" + no);

            my_scene.process_notation(no, "m");
        
            const is_your_lose = my_scene.white_lose();
            const is_your_win = my_scene.white_win();

            if(is_your_lose) {
                console.log("---YOUR LOSE.----");
                socket.emit('over', "lose");
            } 
            else if(is_your_win) {
                console.log("---YOUR WIN.----");
                socket.emit('over', "win");
            }
            else {
                let my_messages = [];
                let chess_content = "I want you to act as a rival chess player and continue the current play which defined as the array[n][2] in which array[n][0] represent the white move which is my move, array[n][1] represent the black move which is your move, We will say our moves in reciprocal order. and We will use algebraic chess notation to communicate our moves. You should only give out a single move notation without any explanation or hint or any else words.";
                let current_notations = notation_pairs;
                current_notations.push(pair);
                chess_content += JSON.stringify(current_notations);

                my_messages.push({role: "system", content: chess_content});

                let ret_content = await ask_ai(my_messages);

                let ret_notation = ret_content;
                ret_notation = ret_notation.replace(/["']/g, '');
                ret_notation = ret_notation.replace(/\([^)]*\)/g, '');

                console.log("your move:" + ret_notation);

                let ret = my_scene.process_notation(ret_content, "e");
                if(ret) {
                    console.log("---play: should send to client:")
                    console.log(ret);

                    my_scene.repeated_crazy_notations = [];

                    board = my_scene.generateChessBoard();
                    my_scene.displayChessBoard(board);
                    socket.emit('grid', JSON.stringify(ret));
                    my_scene.error_tried = 0;
                    
                    notation_pairs[notation_pairs.length-1][1] = ret_content; 
                    console.log("-------my:pairs----");
                    console.log(notation_pairs);
                } else {
                    console.log("---event plays:chatgpt chess notation failed!");
                    my_scene.repeated_crazy_notations.push(ret_notation);
                    socket.emit('crazy');
                }
            }

        } catch (error) {
            console.error("Error processing plays:", error);
            // You might also want to send a message back to the client to indicate an error
            //socket.emit('error', 'An error occurred while processing your request.');
        }
    });


/*
    socket.on('plays', async (data) => {
        try {
            console.log("----plays----:" + data);
            pair = [];
            const dd = data.split("||");
            const d_role = dd[0]
            const d_pos = dd[1];
            const o_pos = dd[2];
            //const coord = my_scene._chessNumberToCoord(d_pos);
            const no = my_scene.gen_notation_for_client(d_role, d_pos, o_pos);
            pair[0] = no;
            
            console.log("my move----:" + no);

            my_scene.process_notation(no, "m");
            my_scene.messages.push({role: 'user', content: no});
        
            const is_your_lose = my_scene.white_lose();
            const is_your_win = my_scene.white_win();

            if(is_your_lose) {
                console.log("---YOUR LOSE.----");
                socket.emit('over', "lose");
            } 
            else if(is_your_win) {
                console.log("---YOUR WIN.----");
                socket.emit('over', "win");
            }
            else {
                let ret_content = await ask_ai(my_scene.messages);
                console.log("your move:" + ret_content);

                let ret = my_scene.process_notation(ret_content, "e");
                if(ret) {
                    console.log("---play: should send to client:")
                    console.log(ret);

                    board = my_scene.generateChessBoard();
                    my_scene.displayChessBoard(board);
                    socket.emit('grid', JSON.stringify(ret));
                    my_scene.error_tried = 0;
                    
                    pair[1] = ret_content;
                    notation_pairs.push(pair);
                    console.log("-------play:pairs----");
                    console.log(notation_pairs);

                } else {
                    console.log("---event plays:chatgpt chess notation failed!");
                    socket.emit('crazy');
                }
            }

        } catch (error) {
            console.error("Error processing plays:", error);
            // You might also want to send a message back to the client to indicate an error
            //socket.emit('error', 'An error occurred while processing your request.');
        }
    });
*/


});

//const my_scene = new scene();
//var t1 = my_scene.process_notation("Bxc5", "e");
//console.log(t1);
//exit(0);

const test_data = [["d4","Nf6"],["f4","e6"],["c3","b6"],["Qd1a4","Bb7"],["Nb1d2","Be7"],["Ng1f3","O-O"],["e3","c5"],["b4","\"cxb4\""],["cxb4","Bxf3"],["Nd2xf3","\"Qc7\""],["g3","d5"],["Bf1d3","Nc6"],["e4","dxe4"],["h4","a5"],["bxa5","Rxa5"],["Qa4c4","b5"],["Qc4c2","b4"],["a3","\"bxa3\""],["Ra1xa3","Rxa3"],["Bc1xa3","\"Bxa3\""],["Qc2c3","Qb6"],["Qc3xa3","\"Nd5\""],["Nf3g5","h6"],["Ng5xe4","\"Rc8\""],["Qa3a8","Rxa8"],["h5","\"Ra7\""],["Rh1h4","\"Ndb4\""]];

testNotations(test_data);

console.log('Socket.io server running on http://localhost:3000/');
