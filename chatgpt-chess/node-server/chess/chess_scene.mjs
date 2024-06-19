import grid from './chess_grid.mjs';
import { classify_chess_move } from './chess_pattern.mjs';
import { re_prompt_step } from './main_chess.mjs';

export default class scene {
    constructor() {
        this._grid = null;
        this.messages = [];

    }

    init(socket=null) {
        this.socket = socket;
        this._grid = new grid();
        this._grid.init();
        this.error_tried = 0;
        this.repeated_crazy_notations = [];
    }

    // black_lose
    white_win() {
        if(this._grid._pawn2grid["k_0_e"] === undefined) {
            return true;
        }
        return false;
    }

    // black_win
    white_lose() {
        let move = Array();
        let has_threat = false;
        //get current king position
        const pos = this._grid._pawn2grid["k_0_m"];

        //iterator black piece in grid in order to find threating.
        for (let key in this._grid._pawn2grid) {
            let role_of_key = key[4];
            let key_pos = this._grid._pawn2grid[key];

            if (role_of_key == "e" && this._grid.available_moves(key_pos) && this._grid.available_moves(key_pos).includes(pos)) {
                has_threat = true;
                break;
            }
        }

        return has_threat;
    }    

    gen_notation_for_client(info, d_pos, o_pos) {
        let no = "";
        let cha = info[0]; //eg: n_m -> n  s_m -> s
        let role = info[2]; //eg: n_m -> n  s_m -> s

        const d_coord = this._chessNumberToCoord(d_pos);
        const o_coord = this._chessNumberToCoord(o_pos);
        const d_cha = this._grid.cha_by_pos(d_pos);
        const target_king = "k_0_e";

        if(role=="e") {
            target_king = "k_0_m";
        }        

        if(cha=="s") {
            cha="";
            if(d_cha) {
               no+=o_coord[0];
               no+="x";
            }
        }
        else if(cha=="r" || cha=="n" || cha=="b" || cha=="q") {
            cha = cha.toUpperCase();
            no+=cha;
            no+=o_coord;
            if(d_cha) {
               no+="x";
            }
        }
        else if(cha=="k"  ) {
            cha = cha.toUpperCase();
            no+=cha;
            if(d_cha) {
               no+="x";
            }
        }

        no+=d_coord;

        //if current move threat to opponent king.
        cha = info[0];
        if(this._grid._pawn2grid[target_king]) {
            var moves = Array();
            moves = this.get_available_moves(d_pos,role,cha);
            if(moves && moves.includes(this._grid._pawn2grid[target_king])) {
                no+="+";
                console.log("----------------checking:"+no);
            }
        }

        return no;
    }

    _is_checking(pos, role) {
        
    }

    // tranlate notation pos to grid pos, eg: c6->25
    _chessCoordToNumber(coord) {
        // Extract the file (letter) and rank (number) from the coordinate
        const file = coord[0];
        const rank = parseInt(coord[1], 10);

        // Convert the file to a number (0-7)
        const fileNumber = file.charCodeAt(0) - 'a'.charCodeAt(0);

        // Convert the rank to a number (0-7)
        const rankNumber = rank - 1;

        // Combine the two numbers to get a single number between 0 and 63
        return fileNumber*10 + rankNumber;
    }

    _chessNumberToCoord(num) {
        // Convert the number to a file (0-7)
        const rankNumber = Math.floor(num / 10);

        // Convert the number to a rank (0-7)
        const fileNumber = num % 10;

        // Convert the file number to a letter (a-h)
        const rank = String.fromCharCode('a'.charCodeAt(0) + rankNumber);

        // Convert the rank number to a number (1-8)
        const file = fileNumber+1;

        // Combine the file and rank to get the chess coordinate
        return rank + file;
    }

    _update_grid(can_move_to) {
        const _self = this;
        Object.keys(can_move_to).map(function(key,val) {
            const move_to_piece = _self._grid._grid2pawn[can_move_to[key]];
            if(move_to_piece) {
                delete _self._grid._pawn2grid[move_to_piece];
            }

            _self._grid._pawn2grid[key] = can_move_to[key];
        }).filter(Boolean);

        _self._grid.gen_grid2pawn();
    }

    log() {
        console.log(this._grid._pawn2grid);
        console.log(this._grid._grid2pawn);
    }

    get_available_moves(pos) {
        var moves = this._grid.available_moves(pos);
        return moves;
    }

    get_available_moves(pos,role,cha) {
        var moves = this._grid.available_moves(pos,role,cha);
        return moves;
    }

    // process c3, e4..
    process_Pa_M(pa, role) {
        const _self = this;
        const piece_notation_pos = this._chessCoordToNumber(pa.components[0].toLowerCase());
        const scan_arr = this._get_piece_move_arr("s", role);

        var can_move_to = {};
        scan_arr.forEach(function(piece) {
            var moves = Array();
            if(_self._grid._pawn2grid[piece]!== undefined) {
                moves = _self._grid.available_moves(_self._grid._pawn2grid[piece]);
                if(moves.includes(piece_notation_pos)) {
                    can_move_to[piece] = piece_notation_pos;
                }
            } 
        });

        return this.process_result(can_move_to);
    }

    // process e7e5..
    process_Pa_M1(pa, role) {
        const _self = this;
        const piece_notation_pos = this._chessCoordToNumber(pa.components[1].toLowerCase());
        
        //following is the same as process_Pa_M
        const scan_arr = this._get_piece_move_arr("s", role);

        var can_move_to = {};
        scan_arr.forEach(function(piece) {
            var moves = Array();
            if(_self._grid._pawn2grid[piece]!== undefined) {
                moves = _self._grid.available_moves(_self._grid._pawn2grid[piece]);
                console.log(moves);
                if(moves.includes(piece_notation_pos)) {
                    //console.log("-pos:"+piece_notation_pos+ " found for piece "+ piece);
                    can_move_to[piece] = piece_notation_pos;
                }
            } 
        });

        return this.process_result(can_move_to);
    }


    // process e4xf3.
    process_Pi_C3(pa, role) {
        const _self = this;
        const file_rank = this._chessCoordToNumber(pa.components[0].toLowerCase());
        const piece_notation_pos = this._chessCoordToNumber(pa.components[2].toLowerCase());
        
        //following is the same as process_Pa_M
        const scan_arr = this._get_piece_move_arr("s", role);

        var can_move_to = {};
        scan_arr.forEach(function(piece) {
            var moves = Array();
            if(_self._grid._pawn2grid[piece]!== undefined) {
                moves = _self._grid.available_moves(_self._grid._pawn2grid[piece]);
                console.log(moves);

                const piece_num = parseInt(_self._grid._pawn2grid[piece]);
                const file_rank_num = file_rank;

                if(moves.includes(piece_notation_pos) && piece_num == file_rank_num) {
                    can_move_to[piece] = piece_notation_pos;
                }
            } 
        });

        return this.process_result(can_move_to);
    }


    // process cxd8..
    process_Pa_C(pa, role) {
        const _self = this;
        const piece_notation_pos = this._chessCoordToNumber(pa.components[2].toLowerCase());
        const scan_arr = this._get_piece_move_arr("s", role);
        const rank_num = pa.components[0].toLowerCase();

        var can_move_to = {};
        scan_arr.forEach(function(piece) {
            var moves = Array();
            var piece_loc;
            if(_self._grid._pawn2grid[piece]!== undefined) {
                piece_loc = _self._grid._pawn2grid[piece];
                moves = _self._grid.available_moves(piece_loc);
                //console.log(_self._chessNumberToCoord(piece_loc)[0]);

                if(moves.includes(piece_notation_pos) && _self._chessNumberToCoord(piece_loc)[0]==rank_num) {  // && piece_num == rank_num
                    //console.log("-pos:"+piece_notation_pos+ " found for piece "+ piece);
                    can_move_to[piece] = piece_notation_pos;
                }
            } 
        });

        return this.process_result(can_move_to);

    }

    //eg: process Nxc6
    process_Pi_C1(pa, role) {
        const _self = this;
        const piece_cha = pa.components[0].toLowerCase();
        const piece_notation_pos = this._chessCoordToNumber(pa.components[2].toLowerCase());
        const scan_arr = this._get_piece_move_arr(piece_cha, role);

        var can_move_to = {};

        scan_arr.forEach(function(piece) {
            var moves = Array();
            if(_self._grid._pawn2grid[piece]!== undefined) {
                moves = _self._grid.available_moves(_self._grid._pawn2grid[piece]);
                console.log(moves);
                if(moves.includes(piece_notation_pos)) {
                    //console.log("-pos:"+piece_notation_pos+ " found for piece "+ piece);
                    can_move_to[piece] = piece_notation_pos;
                }
            } 
        });

        return this.process_result(can_move_to);
    }

    process_result(can_move_to) {
        let _self = this;
        let uni_ret = [];

        if(Object.keys(can_move_to).length == 1) {
            Object.keys(can_move_to).map(function(key) {
                let ar = [];
                ar[0] = parseInt(_self._grid._pawn2grid[key]);
                ar[1] = parseInt(can_move_to[key]);
                ar[2] = key;
                uni_ret.push(ar);
            });

            this._update_grid(can_move_to);
            return uni_ret;
        } else {
            console.log("---process ng!");
            re_prompt_step(this);
        }        
    }

    process_result_for_0(can_move_to) {
        let _self = this;
        let uni_ret = [];

        Object.keys(can_move_to).map(function(key) {
            let ar = [];
            ar[0] = parseInt(_self._grid._pawn2grid[key]);
            ar[1] = parseInt(can_move_to[key]);
            ar[2] = key;
            uni_ret.push(ar);
        });

        return uni_ret;     
    }

    //eg: process Nbxc6
    process_Pi_C2(pa, role) {
        const _self = this;
        const piece_cha = pa.components[0].toLowerCase();
        const file = pa.components[1];
        const piece_notation_pos = this._chessCoordToNumber(pa.components[3].toLowerCase());
        const scan_arr = this._get_piece_move_arr(piece_cha, role);

        var can_move_to = {};

        scan_arr.forEach(function(piece) {
            var moves = Array();

            if(_self._grid._pawn2grid[piece]!== undefined) {
                moves = _self._grid.available_moves(_self._grid._pawn2grid[piece]);
                console.log(moves);
                var piece_num = parseInt(_self._grid._pawn2grid[piece]/10);
                const file_num = file.charCodeAt(0) - 'a'.charCodeAt(0);

                if(moves.includes(piece_notation_pos) && piece_num == file_num) {
                    can_move_to[piece] = piece_notation_pos;
                }
            } 
        });

        return this.process_result(can_move_to);

    }

    _get_piece_move_arr(cha, role) {        
        const ret_array = Object.keys(this._grid._pawn2grid).map(function(key) {
          const kk = key.split("_");
          if (kk[0] === cha && kk[2] === role) {
            return key;
          }
        }).filter(Boolean); // Use filter to remove undefined values

        return ret_array;
    }

    //Kd3
    process_Pi_M(pa, role) {
        const _self = this;
        const piece_cha = pa.components[0].toLowerCase();
        const piece_notation_pos = this._chessCoordToNumber(pa.components[1].toLowerCase());
        const scan_arr = this._get_piece_move_arr(piece_cha, role);
        let can_move_to = {};

        scan_arr.forEach(function(piece) {
            let moves = Array();
            if(_self._grid._pawn2grid[piece]!== undefined) {
                moves = _self._grid.available_moves(_self._grid._pawn2grid[piece]);

                if(piece_cha == "k" && role == "m") {
                    let k_moves = Array();
                    moves.forEach(function(move_pos) {
                        let has_threat = _self._grid._threated_pos(move_pos, role);
                        if(!has_threat) {
                            k_moves.push(move_pos);
                        }
                        moves = k_moves;
                    });
                    console.log("---king move filter ##---");
                    console.log(moves);
                }

                if(moves.includes(piece_notation_pos)) {
                    //console.log("-pos:"+piece_notation_pos+ " found for piece "+ piece);
                    can_move_to[piece] = piece_notation_pos;
                }
            } 
        });

        return this.process_result(can_move_to);

    }

    //eg: process Nce4
    process_A_F_M(pa, role) {
        const _self = this;
        const piece_cha = pa.components[0].toLowerCase();
        const piece_notation_pos = this._chessCoordToNumber(pa.components[2].toLowerCase());
        const file = pa.components[1];
        const scan_arr = this._get_piece_move_arr(piece_cha, role);
        var can_move_to = {};

        scan_arr.forEach(function(piece) {
            var moves = Array();
            if(_self._grid._pawn2grid[piece]!== undefined) {
                moves = _self._grid.available_moves(_self._grid._pawn2grid[piece]);

                var piece_num = parseInt(_self._grid._pawn2grid[piece]/10);
                const file_num = file.charCodeAt(0) - 'a'.charCodeAt(0);

                if(moves.includes(piece_notation_pos) && piece_num == file_num) {
                    //console.log("-pos:"+piece_notation_pos+ " found for piece "+ piece);
                    can_move_to[piece] = piece_notation_pos;
                }
            } 
        });

        return this.process_result(can_move_to);
    }


    // Nb1a3
    process_A_F(pa, role) {
        const _self = this;
        const piece_cha = pa.components[0].toLowerCase();
        const piece_notation_pos = this._chessCoordToNumber(pa.components[2].toLowerCase());
        const file_num = this._chessCoordToNumber(pa.components[1].toLowerCase());
        const scan_arr = this._get_piece_move_arr(piece_cha, role);
        var can_move_to = {};

        scan_arr.forEach(function(piece) {
            var moves = Array();
            if(_self._grid._pawn2grid[piece]!== undefined) {
                moves = _self._grid.available_moves(_self._grid._pawn2grid[piece]);

                var piece_num = parseInt(_self._grid._pawn2grid[piece]);
                //const file_num = this._chessCoordToNumber(pa.components[2].toLowerCase());

                if(moves.includes(piece_notation_pos) && piece_num == file_num) {
                    //console.log("-pos:"+piece_notation_pos+ " found for piece "+ piece);
                    can_move_to[piece] = piece_notation_pos;
                }
            } 
        });

        return this.process_result(can_move_to);
    }

    //eg: process Nc4xe5
    process_A_F_C(pa, role) {
        const _self = this;
        const piece_cha = pa.components[0].toLowerCase();
        const piece_notation_pos = this._chessCoordToNumber(pa.components[3].toLowerCase());
        const file = pa.components[1];
        const scan_arr = this._get_piece_move_arr(piece_cha, role);
        var can_move_to = {};

        scan_arr.forEach(function(piece) {
            var moves = Array();
            if(_self._grid._pawn2grid[piece]!== undefined) {
                moves = _self._grid.available_moves(_self._grid._pawn2grid[piece]);

                var piece_num = parseInt(_self._grid._pawn2grid[piece]/10);
                const file_num = file.charCodeAt(0) - 'a'.charCodeAt(0);

                if(moves.includes(piece_notation_pos) && piece_num == file_num) {
                    //console.log("-pos:"+piece_notation_pos+ " found for piece "+ piece);
                    can_move_to[piece] = piece_notation_pos;
                }
            } 
        });

        return this.process_result(can_move_to);
    }

    // process N8c6.. 
    process_A_R(pa, role) {
        const _self = this;
        const piece_cha = pa.components[0].toLowerCase();
        const piece_notation_pos = this._chessCoordToNumber(pa.components[2].toLowerCase());
        const rank = pa.components[1];
        const scan_arr = this._get_piece_move_arr(piece_cha, role);

        var can_move_to = {};
        scan_arr.forEach(function(piece) {
            var moves = Array();
            if(_self._grid._pawn2grid[piece]!== undefined) {
                moves = _self._grid.available_moves(_self._grid._pawn2grid[piece]);
                console.log(moves);

                const piece_num = parseInt(_self._grid._pawn2grid[piece]/10);

                //because in notation grid, eg, b8 is 17 in our _pawn2grid system
                const rank_num = rank%10-1;

                if(moves.includes(piece_notation_pos) && piece_num == rank_num) {
                    //console.log("-pos:"+piece_notation_pos+ " found for piece "+ piece);
                    can_move_to[piece] = piece_notation_pos;
                }
            } 
        });

        return this.process_result(can_move_to);
    }

    // process Nb4e7...
    process_A_FR(pa, role) {
        const _self = this;
        const piece_cha = pa.components[0].toLowerCase();
        const piece_notation_pos = this._chessCoordToNumber(pa.components[2].toLowerCase());
        const file_rank = this._chessCoordToNumber(pa.components[1].toLowerCase());
        const scan_arr = this._get_piece_move_arr(piece_cha, role);
        console.log("file_rank:" + file_rank);

        var can_move_to = {};
        scan_arr.forEach(function(piece) {
            var moves = Array();
            if(_self._grid._pawn2grid[piece]!== undefined) {
                moves = _self._grid.available_moves(_self._grid._pawn2grid[piece]);
                console.log(moves);

                const piece_num = parseInt(_self._grid._pawn2grid[piece]);
                const file_rank_num = file_rank;

                if(moves.includes(piece_notation_pos) && piece_num == file_rank_num) {
                    //console.log("-pos:"+piece_notation_pos+ " found for piece "+ piece);
                    can_move_to[piece] = piece_notation_pos;
                }
            } 
        });

        return this.process_result(can_move_to);
    }

    process_O(pa, role) {
        let can_move_to = {};
        let uni_ret = [];

        switch(role) {
            case "m": 
                can_move_to["k_0_m"] = 60;
                can_move_to["r_2_m"] = 50;
                uni_ret = this.process_result_for_0(can_move_to);

                delete this._grid._pawn2grid["k_0_m"];
                delete this._grid._pawn2grid["r_2_m"];
                this._grid._pawn2grid["k_0_m"] = 60;  
                this._grid._pawn2grid["r_2_m"] = 50;

                break;
            case "e": 
                can_move_to["k_0_e"] = 67;
                can_move_to["r_2_e"] = 57;
                uni_ret = this.process_result_for_0(can_move_to);

                delete this._grid._pawn2grid["k_0_e"];
                delete this._grid._pawn2grid["r_2_e"];
                this._grid._pawn2grid["k_0_e"] = 67;
                this._grid._pawn2grid["r_2_e"] = 57;
                break;
            default:
                return false;
        }


        this._grid.gen_grid2pawn();
        return uni_ret;
    }

    process_3O(pa, role) {
        let can_move_to = {};
        let uni_ret = [];

        switch(role) {
            case "m": 
                can_move_to["k_0_m"] = 20;
                can_move_to["r_1_m"] = 30;
                uni_ret = this.process_result_for_0(can_move_to);

                delete this._grid._pawn2grid["k_0_m"];
                delete this._grid._pawn2grid["r_1_m"];
                this._grid._pawn2grid["k_0_m"] = 20;  
                this._grid._pawn2grid["r_1_m"] = 30;

                break;
            case "e": 
                can_move_to["k_0_e"] = 27;
                can_move_to["r_1_e"] = 37;
                uni_ret = this.process_result_for_0(can_move_to);

                delete this._grid._pawn2grid["k_0_e"];
                delete this._grid._pawn2grid["r_1_e"];
                this._grid._pawn2grid["k_0_e"] = 27;  
                this._grid._pawn2grid["r_1_e"] = 37;

                break;
            default:
                return false;
        }

        this._grid.gen_grid2pawn();
        return uni_ret;
    }

    convertToNotation() {
        const _self = this;
        const ar = this._grid._pawn2grid;
        var ret_arr = {};

        Object.keys(ar).map(function(key) {
            ret_arr[key] = _self._chessNumberToCoord(ar[key]);
        });

        return ret_arr;
    }

    generateChessBoard() {
        var grid = this.convertToNotation();

        //var grid = this._grid._pawn2grid;
        const board = Array(8).fill(null).map(() => Array(8).fill('.'));
        const pieceSymbols = {
            s: 's',
            r: 'r',
            n: 'n',
            b: 'b',
            k: 'k',
            q: 'q'
        };
        const colorSymbols = {
            m: 'w',
            e: 'b'
        };

        Object.keys(grid).map(function(key) {
            const piece = key[0];
            const color = key.slice(-1);
            const position = grid[key];

            const col = position.charCodeAt(0) - 97; // 'a' is 97
            const row = 8 - parseInt(position[1]);

            board[row][col] = colorSymbols[color] + pieceSymbols[piece];
        }).filter(Boolean);

        return board;
    }

    displayChessBoard(board) {
        console.log('  +--------------------------------');
        for (let i = 0; i < 8; i++) {
            let rowStr = `${8 - i} |`;
            for (let j = 0; j < 8; j++) {
                //console.log(board[i][j][0]);
                if(board[i][j][0] == "b") {
                    rowStr += ` \x1b[31m${board[i][j][1]}\x1b[0m`;
                } 
                else if(board[i][j][0] == "w"){
                    rowStr += ` ${board[i][j][1]}`;
                } else {
                    rowStr += `  `;
                }
            }
            console.log(rowStr);
        }
        console.log('  +--------------------------------');
        console.log('    a b c d e f g h');
    }

    //process notation such as Nc6, Nxd5
    process_notation(notation, role) {
        notation = notation.replace(/["']/g, '');
        notation = notation.replace(/\([^)]*\)/g, '');
        notation.trim();

        const rr = classify_chess_move(notation);
        let ret = [];

        if(!rr.components.length && rr.components.length==0) {
            console.log("pattern not found2.");
            return false;
        }

        console.log("current pattern:" + rr.patternName);
        switch(rr.patternName) {
            case "Pi_C1":
                 ret = this.process_Pi_C1(rr, role);
                 break;
            case "Pi_C2":
                 ret = this.process_Pi_C2(rr, role);
                 break;
            case "Pi_C3":
                 ret = this.process_Pi_C3(rr, role);
                 break;
            case "Pi_C_Check":
                 ret = this.process_Pi_C1(rr, role);
                 break;
            case "Pi_C_Checkmate":
                 ret = this.process_Pi_C1(rr, role);
                 break;

            case "Pi_M":
                 ret = this.process_Pi_M(rr, role);
                 break;
            case "Pi_M_Check":
                 ret = this.process_Pi_M(rr, role);
                 break;
            case "Pi_M_Checkmate":
                 ret = this.process_Pi_M(rr, role);
                 break;

            case "Pa_M":
                 ret = this.process_Pa_M(rr, role);
                 break;
            case "Pa_M1":
                 ret = this.process_Pa_M1(rr, role);
                 break;

            case "Pa_M_Check":
                 ret = this.process_Pa_M(rr, role);
                 break;
            case "Pa_M_Checkmate":
                 ret = this.process_Pa_M(rr, role);
                 break;

            case "Pa_C":
                 ret = this.process_Pa_C(rr, role);
                 break;
            case "Pa_C_Check":
                 ret = this.process_Pa_C(rr, role);
                 break;
            case "Pa_C_Checkmate":
                 ret = this.process_Pa_C(rr, role);
                 break;

            case "A_F":
                 ret = this.process_A_F(rr, role);
                 break;
            case "A_F_RM":
                 ret = this.process_A_F_M(rr, role);
                 break;                 
            case "A_F_CM":
                 ret = this.process_A_F(rr, role);
                 break;
            case "A_F_C":
                 ret = this.process_A_F_C(rr, role);
                 break;
            case "A_F_KC":
                 ret = this.process_A_F_C(rr, role);
                 break;
            case "A_F_M1":
                 ret = this.process_A_F_M(rr, role);
                 break;
            case "A_R":
                 ret = this.process_A_R(rr, role);
                 break;
            case "A_R_CM":
                 ret = this.process_A_R(rr, role);
                 break;
            case "A_FR":
                 ret = this.process_A_FR(rr, role);
                 break;

            case "K_Cast":
                 ret = this.process_O(rr, role);
                 break;
            case "Q_Cast":
                 ret = this.process_3O(rr, role);
                 break;
            case "K_Cast1":
                 ret = this.process_O(rr, role);
                 break;
            case "Q_Cast1":
                 ret = this.process_3O(rr, role);
                 break;

            default:
                 console.log("ng, no pattern found.");
                 return false;
        }

        return ret;
    }
}