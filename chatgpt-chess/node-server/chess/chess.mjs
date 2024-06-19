import { Server } from 'socket.io';
const io = new Server(3000, {
    pingInterval: 10000 // Ping interval set to 10 seconds
});

// Define a prototype method for objects
Object.prototype.swapKeyValue = function () {
  const swapped = {};
  for (const key in this) {
    if (this.hasOwnProperty(key)) {
      swapped[this[key]] = key;
    }
  }
  return swapped;
};

const classifyChessMove = (move) => {
    const patterns = {
        'Pa_M': /^([a-h][1-8])$/,                            //pawn move    
        'Pi_M': /^([KQBNR])([a-h][1-8])$/,                   //piece move  
        'Pi_C': /^([KQBNR])(x)([a-h][1-8])$/,                //piece capture 
        'Pa_C': /^([a-h])(x)([a-h][1-8])$/,                  //pawn capture 
        'K_Cast': /^(O-O)\b$/,                               //king casting  -
        'Q_Cast': /^(O-O-O)$/,                               //queen casting  -
        'Pa_P': /^([a-h][18])=([KQBNR])$/,                   //pawn prompting  -
        'Pa_M_Check': /^([a-h][1-8])(\+)$/,                  //pawn move checking  
        'Pi_M_Check': /^([KQBNR])([a-h][1-8])(\+)$/,         //piece move checking 
        'Pa_M_Checkmate': /^([a-h][1-8])(#)$/,               //pawn move Checkmating 
        'Pi_M_Checkmate': /^([KQBNR])([a-h][1-8])(#)$/,      //piece move checkmating 
        'Pa_C_Check': /^([a-h])(x)([a-h][1-8])(\+)$/,        //Pawn Capture Checking
        'Pi_C_Check': /^([KQBNR])(x)([a-h][1-8])(\+)$/,      //piece capture checking
        'Pa_C_Checkmate': /^([a-h])(x)([a-h][1-8])(#)$/,     //pawn capture checkmating
        'Pi_C_Checkmate': /^([KQBNR])(x)([a-h][1-8])(#)$/,   //piece capture checkmating

         //eg R_A_FR : Rook Ambiguous  (File & Rank)
        'A_F': /^([QBNR])([a-h])([a-h][1-8])$/,   
        'A_R': /^([QBNR])([1-8])([a-h][1-8])$/,   
        'A_FR': /^([QBNR])([a-h][1-8])([a-h][1-8])$/,
    };

    for (let [name, pattern] of Object.entries(patterns)) {
        const match = move.match(pattern);
        if (match) {
            return {
                patternName: name,
                components: match.slice(1) // Return only the capturing groups, excluding the full match
            };
        }
    }

    return {
        patternName: 'Unknown Move',
        components: []
    };
}

var chess = chess || {};
chess.grid = {
    _pawn2grid: {
        "s_1_m": 1,
        "s_2_m": 11,
        "s_3_m": 21,
        "s_4_m": 31,
        "s_5_m": 41,
        "s_6_m": 51,
        "s_7_m": 61,
        "s_8_m": 71,
        "r_1_m": 0,
        "r_2_m": 70,
        "n_1_m": 10,
        "n_2_m": 60,
        "b_1_m": 20,
        "b_2_m": 50,
        "k_0_m": 40,
        "q_0_m": 30,
        "s_1_e": 6,
        "s_2_e": 16,
        "s_3_e": 26,
        "s_4_e": 36,
        "s_5_e": 46,
        "s_6_e": 56,
        "s_7_e": 66,
        "s_8_e": 76,
        "r_1_e": 7,
        "r_2_e": 77,
        "n_1_e": 17,
        "n_2_e": 67,
        "b_1_e": 27,
        "b_2_e": 57,
        "k_0_e": 47,
        "q_0_e": 37
    },

    _grid2pawn: {},

    init: function () {
        this.gen_grid2pawn();
    },

    gen_grid2pawn() {
        this._grid2pawn = this._pawn2grid.swapKeyValue();
    },

    gen_pawn2grid() {
        this._pawn2grid = this._grid2pawn.swapKeyValue();
    },

    available_moves(pos) {
        pos = parseInt(pos);

        // enemy or me
        const role = this.role_by_pos(pos);
        // character, eg: bishop, rook, soldier etc.
        const cha = this.role_by_pos(pos);
        if(!role || !cha) {
            return false;
        }
        
        var ret_pos = Array();

        switch(cha) {
            case "s":
                // soldier
                // me
                if(role=="m") {
                    // me in the initial grid

                    if(pos%10 == 1) {
                        var arr1 = [];
                        this.scan_1_top_s(pos, arr1, role);
                        var arr2 = [];
                        this.scan_1_top_s(pos+1, arr2, role);
                        var arr3 = [];
                        this.scan_1_top_right_s(pos, arr3, role);
                        var arr4 = [];
                        this.scan_1_top_left_s(pos, arr4, role);

                        ret_pos = [...arr1, ...arr2, ...arr3, ...arr4];
                    } 
                    // me not in the initial grid
                    else {
                        var arr1 = [];
                        this.scan_1_top_s(pos, arr1, role);
                        var arr2 = [];
                        this.scan_1_top_right_s(pos, arr2, role);
                        var arr3 = [];
                        this.scan_1_top_left_s(pos, arr3, role);

                        ret_pos = [...arr1, ...arr2, ...arr3];
                    }
                }
                // enemy
                else if(role=="e") {
                    // emeny in the initial grid
                    if(pos%10 == 6) {
                        var arr1 = [];
                        this.scan_1_down_s(pos, arr1, role);
                        var arr2 = [];
                        this.scan_1_down_s(pos-1, arr2, role);
                        var arr3 = [];
                        this.scan_1_down_right_s(pos, arr3, role);
                        var arr4 = [];
                        this.scan_1_down_left_s(pos, arr4, role);

                        ret_pos = [...arr1, ...arr2, ...arr3, ...arr4];
                    } 
                    // emeny not in the initial grid
                    else {
                        var arr1 = [];
                        this.scan_1_down_s(pos, arr1, role);
                        var arr2 = [];
                        this.scan_1_down_right_s(pos, arr2, role);
                        var arr3 = [];
                        this.scan_1_down_left_s(pos, arr3, role);

                        ret_pos = [...arr1, ...arr2, ...arr3];
                    }                    
                }

                break;

            case "r":
                // rook
                var arr1 = [];
                this.scan_right(pos, arr1, role);
                var arr2 = [];
                this.scan_left(pos, arr2, role);
                var arr3 = [];
                this.scan_top(pos, arr3, role);
                var arr4 = [];
                this.scan_down(pos, arr4, role);
                ret_pos = [...arr1, ...arr2, ...arr3, ...arr4];
                break;

            case "n":
                // knight
                this.scan_knight(pos, ret_pos, role);
                break;

            case "b":
                // bishop
                var arr1 = [];
                this.scan_right_top(pos, arr1, role);
                var arr2 = [];
                this.scan_left_down(pos, arr2, role);
                var arr3 = [];
                this.scan_left_top(pos, arr3, role);
                var arr4 = [];
                this.scan_right_down(pos, arr4, role);
                ret_pos = [...arr1, ...arr2, ...arr3, ...arr4];
                break;

            case "k":
                // lord
                var arr1 = [];
                this.scan_1_right(pos, arr1, role);
                var arr2 = [];
                this.scan_1_left(pos, arr2, role);
                var arr3 = [];
                this.scan_1_top(pos, arr3, role);
                var arr4 = [];
                this.scan_1_down(pos, arr4, role);
                var arr5 = [];
                this.scan_1_top_right(pos, arr5, role);
                var arr6 = [];
                this.scan_1_top_left(pos, arr6, role);
                var arr7 = [];
                this.scan_1_down_right(pos, arr7, role);
                var arr8 = [];
                this.scan_1_down_left(pos, arr8, role);

                ret_pos = [...arr1, ...arr2, ...arr3, ...arr4, ...arr5, ...arr6, ...arr7, ...arr8];

                break;

            case "q":
                // queen
                var arr1 = [];
                this.scan_right(pos, arr1, role);
                var arr2 = [];
                this.scan_left(pos, arr2, role);
                var arr3 = [];
                this.scan_top(pos, arr3, role);
                var arr4 = [];
                this.scan_down(pos, arr4, role);
                var arr5 = [];
                this.scan_right_top(pos, arr5, role);
                var arr6 = [];
                this.scan_left_down(pos, arr6, role);
                var arr7 = [];
                this.scan_left_top(pos, arr7, role);
                var arr8 = [];
                this.scan_right_down(pos, arr8, role);
                ret_pos = [...arr1, ...arr2, ...arr3, ...arr4, ...arr5, ...arr6, ...arr7, ...arr8];
                break;

            default:
                // code to be executed if expression doesn't match any cases
                ret_pos = [];
        }

        return ret_pos;
    },


    role_by_pos(pos) {
        pos = parseInt(pos);
        const pawn = this._grid2pawn[pos];
        var role;
        if(pawn!== undefined) {
            role = pawn.split("_")[2];
            return role;
        }

        return false;
    },

    role_by_pos(pos) {
        pos = parseInt(pos);
        const pawn = this._grid2pawn[pos];
        var cha;
        if(pawn!== undefined) {
            cha = pawn.split("_")[0];
            return cha;
        }

        return false;
    },

    _valid_grid(pos) {
        pos = parseInt(pos);
        if(pos % 10 > 7) {
            return false;
        }
        if(pos < 0 || pos > 77) {
            return false;
        }

        return true;
    },

    //for lord
    _threated_pos(pos, role) {
        let has_threat = false;
        for (let key in this._pawn2grid) {
            let role_of_key = key[4];
            let key_pos = this._pawn2grid[key];

            if (role_of_key !== role && this.available_moves(key_pos) && this.available_moves(key_pos).includes(pos)) {
                has_threat = true;
                break;
            }
        }

        return has_threat
    },

    // for lord
    scan_1(pos, ret_pos, role) {
        //this._threated_pos(pos, role);
        pos = parseInt(pos);

        // valid grid && not occupied
        if(this._valid_grid(pos) && this._grid2pawn[pos] === undefined) {
            ret_pos.push(pos);
        } 
        // occupied && occupied pawn is not the same side as role
        else if(this._grid2pawn[pos]!== undefined && this._grid2pawn[pos].split("_")[2] != role) {
            console.log("22:" + pos);
            ret_pos.push(pos);
            return ret_pos;
        }
        else {
            return ret_pos;
        }
    },

    // 8 dir for knight, pos1 is left_top, then go clockwise.
    scan_knight(pos, ret_pos, role) {
        pos = parseInt(pos);

        var pos_tobe = Array();
        pos_tobe[0] = pos + 10 + 2;
        pos_tobe[1] = pos + 20 + 1;
        pos_tobe[2] = pos + 20 - 1;
        pos_tobe[3] = pos + 10 - 2;
        pos_tobe[4] = pos - 10 - 2;
        pos_tobe[5] = pos - 20 - 1;
        pos_tobe[6] = pos - 20 + 1;
        pos_tobe[7] = pos - 10 + 2;

        var _self = this;
        pos_tobe.map(function(target_pos) {
            // valid grid && not occupied
            if(_self._valid_grid(target_pos) && _self._grid2pawn[target_pos]=== undefined) {
                ret_pos.push(target_pos);
                //return target_pos;
            } 
            // occupied && occupied pawn is not the same side as role
            else if(_self._grid2pawn[target_pos]!== undefined && _self._grid2pawn[target_pos].split("_")[2] != role) {
                ret_pos.push(target_pos);
                //return target_pos;
            }
        });

        return ret_pos;
    },


    // for soldier move
    scan_1_s(pos, ret_pos, role) {
        pos = parseInt(pos);

        // valid grid && not occupied
        if(this._valid_grid(pos) && this._grid2pawn[pos]=== undefined) {
            ret_pos.push(pos);
        } 
        else {
            return ret_pos;
        }
    },

    // for soldier capture
    scan_1_s_c(pos, ret_pos, role) {
        const _self = this;
        pos = parseInt(pos);

        // valid grid && occupied && occupied by enemy
        if(this._valid_grid(pos) && this._grid2pawn[pos]!== undefined && _self._grid2pawn[pos].split("_")[2] != role) {
            ret_pos.push(pos);
        } 
        else {
            return ret_pos;
        }
    },

    //move 1 grid to top.
    //for soldier
    scan_1_top_s(pos, ret_pos, role) {
        pos = parseInt(pos);
        pos+=1;
        return this.scan_1_s(pos, ret_pos, role);   
    },

    scan_1_top_right_s(pos, ret_pos, role) {
        pos = parseInt(pos);
        pos+=11;
        return this.scan_1_s_c(pos, ret_pos, role);   
    },

    scan_1_top_left_s(pos, ret_pos, role) {
        pos = parseInt(pos);
        pos-=9;
        return this.scan_1_s_c(pos, ret_pos, role);   
    },

    scan_1_down_right_s(pos, ret_pos, role) {
        pos = parseInt(pos);
        pos+=9;
        return this.scan_1_s_c(pos, ret_pos, role);   
    },

    scan_1_down_left_s(pos, ret_pos, role) {
        pos = parseInt(pos);
        pos-=11;
        return this.scan_1_s_c(pos, ret_pos, role);   
    },

    //move 1 grid to down.
    //for soldier
    scan_1_down_s(pos, ret_pos, role) {
        pos = parseInt(pos);
        pos-=1;
        return this.scan_1_s(pos, ret_pos, role);
    },


    //move 1 grid to right.
    //for lord
    scan_1_right(pos, ret_pos, role) {
        pos = parseInt(pos);
        pos+=10;
        return this.scan_1(pos, ret_pos, role);
    },

    //move 1 grid to left.
    //for lord
    scan_1_left(pos, ret_pos, role) {
        pos = parseInt(pos);
        pos-=10;
        return this.scan_1(pos, ret_pos, role);   
    },

    //move 1 grid to top.
    //for lord
    scan_1_top(pos, ret_pos, role) {
        pos = parseInt(pos);
        pos+=1;
        return this.scan_1(pos, ret_pos, role);   
    },

    //move 1 grid to down.
    //for lord
    scan_1_down(pos, ret_pos, role) {
        pos = parseInt(pos);
        pos-=1;
        return this.scan_1(pos, ret_pos, role);
    },

    //for lord
    scan_1_top_right(pos, ret_pos, role) {
        pos = parseInt(pos);
        pos+=11;
        return this.scan_1(pos, ret_pos, role);   
    },

    //for lord
    scan_1_top_left(pos, ret_pos, role) {
        pos = parseInt(pos);
        pos-=9;
        return this.scan_1(pos, ret_pos, role);   
    },

    //for lord
    scan_1_down_right(pos, ret_pos, role) {
        pos = parseInt(pos);
        pos+=9;
        return this.scan_1(pos, ret_pos, role);   
    },

    //for lord
    scan_1_down_left(pos, ret_pos, role) {
        pos = parseInt(pos);
        pos-=11;
        return this.scan_1(pos, ret_pos, role);   
    },

    // 3 dir should be considered.
    // for pawn only
    scan_pawn(pos, ret_pos, role) {
        var f_pos,r_pos,l_pos;

        // if role is me, then should move top, else should move down.
        if(role == "m") {
            f_pos = pos + 1;
            r_pos = pos + 11;
            l_pos = pos - 9;
        } else {
            f_pos = pos - 1;
            l_pos = pos - 11;
            r_pos = pos + 9;    
        }

        // when forward, the target cannot be occupied.
        if(this._valid_grid(f_pos) && this._grid2pawn[f_pos]=== undefined) {
            ret_pos.push(f_pos);
        } 

        // when oblique, the target should be occupied by enemy.
        if(this._valid_grid(r_pos) && this._grid2pawn[r_pos]!== undefined && this._grid2pawn[r_pos].split("_")[2] != role) {
            ret_pos.push(r_pos);
        } 

        if(this._valid_grid(l_pos) && this._grid2pawn[l_pos]!== undefined && this._grid2pawn[l_pos].split("_")[2] != role) {
            ret_pos.push(l_pos);
        } 

        return ret_pos;
    },

    scan_right(pos, ret_pos, role) {
        pos = parseInt(pos);
        pos+=10;

        // valid grid && not occupied
        if(this._valid_grid(pos) && this._grid2pawn[pos]=== undefined) {            
            ret_pos.push(pos);
            this.scan_right(pos, ret_pos, role);
        } 
        // occupied && occupied pawn is not the same side as role
        else if(this._grid2pawn[pos]!== undefined && this._grid2pawn[pos].split("_")[2] != role) {
            ret_pos.push(pos);
            return ret_pos;
        }
        else {
            return ret_pos;
        }
    },

    scan_left(pos, ret_pos, role) {
        pos = parseInt(pos);
        pos-=10;

        // valid grid && not occupied
        if(this._valid_grid(pos) && this._grid2pawn[pos]=== undefined) {
            ret_pos.push(pos);
            this.scan_left(pos, ret_pos, role);
        } 
        // occupied && occupied pawn is not the same side as role
        else if(this._grid2pawn[pos]!== undefined && this._grid2pawn[pos].split("_")[2] != role) {
            ret_pos.push(pos);
            return ret_pos;
        }
        else {
            return ret_pos;
        }
    },

    scan_top(pos, ret_pos, role) {
        pos = parseInt(pos);
        pos+=1;

        // valid grid && not occupied
        if(this._valid_grid(pos) && this._grid2pawn[pos]=== undefined) {
            ret_pos.push(pos);
            this.scan_top(pos, ret_pos, role);
        } 
        // occupied && occupied pawn is not the same side as role
        else if(this._grid2pawn[pos]!== undefined && this._grid2pawn[pos].split("_")[2] != role) {
            ret_pos.push(pos);
            return ret_pos;
        }
        else {
            return ret_pos;
        }
    },

    scan_down(pos, ret_pos, role) {
        pos = parseInt(pos);
        pos-=1;

        // valid grid && not occupied
        if(this._valid_grid(pos) && this._grid2pawn[pos]=== undefined) {
            ret_pos.push(pos);
            this.scan_down(pos, ret_pos, role);
        } 
        // occupied && occupied pawn is not the same side as role
        else if(this._grid2pawn[pos]!== undefined && this._grid2pawn[pos].split("_")[2] != role) {
            ret_pos.push(pos);
            return ret_pos;
        }
        else {
            return ret_pos;
        }
    },

    scan_right_top(pos, ret_pos, role) {
        pos = parseInt(pos);
        pos+=11;

        // valid grid && not occupied
        if(this._valid_grid(pos) && this._grid2pawn[pos]=== undefined) {
            ret_pos.push(pos);
            this.scan_right_top(pos, ret_pos, role);
        } 
        // occupied && occupied pawn is not the same side as role
        else if(this._grid2pawn[pos]!== undefined && this._grid2pawn[pos].split("_")[2] != role) {
            ret_pos.push(pos);
            return ret_pos;
        }
        else {
            return ret_pos;
        }
    },

    scan_left_down(pos, ret_pos, role) {
        pos = parseInt(pos);
        pos-=11;

        if(this._valid_grid(pos) && this._grid2pawn[pos]=== undefined) {
            ret_pos.push(pos);
            this.scan_left_down(pos, ret_pos, role);
        } 
        // occupied && occupied pawn is not the same side as role
        else if(this._grid2pawn[pos]!== undefined && this._grid2pawn[pos].split("_")[2] != role) {
            ret_pos.push(pos);
            return ret_pos;
        }
        else {
            return ret_pos;
        }
    },

    scan_left_top(pos, ret_pos, role) {
        pos = parseInt(pos);
        pos-=9;

        if(this._valid_grid(pos) && this._grid2pawn[pos]=== undefined) {
            ret_pos.push(pos);
            this.scan_left_top(pos, ret_pos, role);
        } 
        // occupied && occupied pawn is not the same side as role
        else if(this._grid2pawn[pos]!== undefined && this._grid2pawn[pos].split("_")[2] != role) {
            ret_pos.push(pos);
            return ret_pos;
       }
        else {
            return ret_pos;
        }
    },

    scan_right_down(pos, ret_pos, role) {
        pos = parseInt(pos);
        pos+=9;

        if(this._valid_grid(pos) && this._grid2pawn[pos]=== undefined) {
            ret_pos.push(pos);
            this.scan_right_down(pos, ret_pos, role);
        } 
        // occupied && occupied pawn is not the same side as role
        else if(this._grid2pawn[pos]!== undefined && this._grid2pawn[pos].split("_")[2] != role) {
            ret_pos.push(pos);
            return ret_pos;
        }
        else {
            return ret_pos;
        }
    },

}


chess.scene = {
    _grid:null,

    init() {
        this._grid = Object.create(chess.grid);
        this._grid.init();
    },

    gen_notation() {
    },

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
    },

    _chessNumberToCoord(num) {
        //num = 70;

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
    },

    _update_grid(can_move_to) {
        const _self = this;
        Object.keys(can_move_to).map(function(key,val) {
            console.log(key +":move to:"+ can_move_to[key]);
            const move_to_piece = _self._grid._grid2pawn[can_move_to[key]];
            console.log(move_to_piece);
            //if(_self._grid._pawn2grid[key]) {
            //    delete _self._grid._pawn2grid[key];
            //}

            if(move_to_piece) {
                delete _self._grid._pawn2grid[move_to_piece];
            }

            _self._grid._pawn2grid[key] = can_move_to[key];
        }).filter(Boolean);

        _self._grid.gen_grid2pawn();
    },

    log() {
        console.log(this._grid._pawn2grid);
        console.log(this._grid._grid2pawn);
    },


    process_Pa_M(pa, role) {
        const _self = this;
        const piece_notation_pos = this._chessCoordToNumber(pa.components[0].toLowerCase());
        const scan_arr = this._get_piece_move_arr("s", role);

console.log(pa);

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

        if(Object.keys(can_move_to).length == 1) {
            //console.log("---ok, you should move as following:");
            //console.log(can_move_to);
            this._update_grid(can_move_to);
        } else {
            console.log("---ng, there shouldn't be more than 1 piece which can move to " + piece_notation_pos);
            console.log(can_move_to);
        }
    },


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

        console.log("matching moves length:" + Object.keys(can_move_to).length);

        if(Object.keys(can_move_to).length == 1) {
            console.log("---ok, you should move as following:");
            //console.log(can_move_to);
            this._update_grid(can_move_to);
        } else {
            console.log("---ng, there shouldn't be more than 1 piece which can move to " + piece_notation_pos);
            console.log(can_move_to);
        }
    },

    process_Pi_C(pa, role) {
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

        console.log("move length for pi_c:" + Object.keys(can_move_to).length);
        if(Object.keys(can_move_to).length == 1) {
            console.log("---ok, you should move as following:");
            this._update_grid(can_move_to);
        } else {
            console.log("---ng, there shouldn't be more than 1 piece which can move to " + piece_notation_pos);
            console.log(can_move_to);
        }

    },

    _get_piece_move_arr(cha, role) {        
        const ret_array = Object.keys(this._grid._pawn2grid).map(function(key) {
          const kk = key.split("_");
          if (kk[0] === cha && kk[2] === role) {
            return key;
          }
        }).filter(Boolean); // Use filter to remove undefined values

        return ret_array;
    },

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

                if(piece_cha == "k") {
                    let k_moves = Array();
                    moves.forEach(function(move_pos) {
                        let has_threat = _self._grid._threated_pos(move_pos, role);
                        if(!has_threat) {
                            k_moves.push(move_pos);
                        }
                        moves = k_moves;
                        console.log("---king move filter ##---");
                        console.log(moves);
                    });
                }

                if(moves.includes(piece_notation_pos)) {
                    //console.log("-pos:"+piece_notation_pos+ " found for piece "+ piece);
                    can_move_to[piece] = piece_notation_pos;
                }
            } 
        });

        if(Object.keys(can_move_to).length == 1) {
            console.log("---ok, you should move as following:");
            this._update_grid(can_move_to);
        } else {
            console.log("---ng, there shouldn't be more than 1 piece which can move to " + piece_notation_pos);
            console.log(can_move_to);
        }
    },

    process_A_F(pa, role) {
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
                console.log("--11---");
                console.log(moves);

                var piece_num = parseInt(_self._grid._pawn2grid[piece]/10);
                const file_num = file.charCodeAt(0) - 'a'.charCodeAt(0);

console.log("ff:" + file_num);
console.log("pp:" + piece_num);

                if(moves.includes(piece_notation_pos) && piece_num == file_num) {
                    //console.log("-pos:"+piece_notation_pos+ " found for piece "+ piece);
                    can_move_to[piece] = piece_notation_pos;
                }
            } 
        });

        console.log(Object.keys(can_move_to).length);

        if(Object.keys(can_move_to).length == 1) {
            console.log("---ok, you should move as following:");
            this._update_grid(can_move_to);
        } else {
            console.log("---ng, there shouldn't be more than 1 piece which can move to " + piece_notation_pos);
            console.log(can_move_to);
        }
    },

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
                const rank_num = rank%10;

                if(moves.includes(piece_notation_pos) && piece_num == rank_num) {
                    //console.log("-pos:"+piece_notation_pos+ " found for piece "+ piece);
                    can_move_to[piece] = piece_notation_pos;
                }
            } 
        });

        console.log(Object.keys(can_move_to).length);
        if(Object.keys(can_move_to).length == 1) {
            console.log("---ok, you should move as following:");
            this._update_grid(can_move_to);
        } else {
            console.log("---ng, there shouldn't be more than 1 piece which can move to " + piece_notation_pos);
            console.log(can_move_to);
        }
    },

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

        if(Object.keys(can_move_to).length == 1) {
            console.log("---ok, you should move as following:");
            this._update_grid(can_move_to);
        } else {
            console.log("---ng, there shouldn't be more than 1 piece which can move to " + piece_notation_pos);
            console.log(can_move_to);
        }
    },

    process_O(pa, role) {
        switch(role) {
            case "m": 
                delete this._grid._pawn2grid["k_0_m"];
                delete this._grid._pawn2grid["r_2_m"];
                this._grid._pawn2grid["k_0_m"] = 60;  
                this._grid._pawn2grid["r_2_m"] = 50;
                break;
            case "e": 
                delete this._grid._pawn2grid["k_0_e"];
                delete this._grid._pawn2grid["r_2_e"];
                this._grid._pawn2grid["k_0_e"] = 67;
                this._grid._pawn2grid["r_2_e"] = 57;
                break;
            default:
                break;    
        }

        this._grid.gen_grid2pawn();
        console.log(this._grid._grid2pawn);
    },

    process_3O(pa, role) {
        switch(role) {
            case "m": 
                delete this._grid._pawn2grid["k_0_m"];
                delete this._grid._pawn2grid["r_1_m"];
                this._grid._pawn2grid["k_0_m"] = 20;  
                this._grid._pawn2grid["r_1_m"] = 30;
                break;
            case "e": 
                delete this._grid._pawn2grid["k_0_e"];
                delete this._grid._pawn2grid["r_1_e"];
                this._grid._pawn2grid["k_0_e"] = 27;  
                this._grid._pawn2grid["r_1_e"] = 37;
                break;
            default:
                break;    
        }
        this._grid.gen_grid2pawn();
    },

    convertToNotation() {
        const _self = this;
        const ar = this._grid._pawn2grid;
        var ret_arr = {};

        Object.keys(ar).map(function(key) {
            ret_arr[key] = _self._chessNumberToCoord(ar[key]);
        });

        return ret_arr;
    },

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
    },

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
    },

    //process notation such as Nc6, Nxd5
    process_notation(notation, role) {
        const rr = classifyChessMove(notation);
        var scan_arr = Array();

        if(!rr.components.length) {
            console.log("pattern not found1.");
            return false;
        }
        console.log("current pattern:" + rr.patternName);
        switch(rr.patternName) {
            case "Pi_C":
                 this.process_Pi_C(rr, role);
                 break;
            case "Pi_C_Check":
                 this.process_Pi_C(rr, role);
                 break;
            case "Pi_C_Checkmate":
                 this.process_Pi_C(rr, role);
                 break;

            case "Pi_M":
                 this.process_Pi_M(rr, role);
                 break;
            case "Pi_M_Check":
                 this.process_Pi_M(rr, role);
                 break;
            case "Pi_M_Checkmate":
                 this.process_Pi_M(rr, role);
                 break;

            case "Pa_M":
                 this.process_Pa_M(rr, role);
                 break;
            case "Pa_M_Check":
                 this.process_Pa_M(rr, role);
                 break;
            case "Pa_M_Checkmate":
                 this.process_Pa_M(rr, role);
                 break;

            case "Pa_C":
                 this.process_Pa_C(rr, role);
                 break;
            case "Pa_C_Check":
                 this.process_Pa_C(rr, role);
                 break;
            case "Pa_C_Checkmate":
                 this.process_Pa_C(rr, role);
                 break;
            
            case "A_F":
                 this.process_A_F(rr, role);
                 break;
            case "A_R":
                 this.process_A_R(rr, role);
                 break;
            case "A_FR":
                 this.process_A_FR(rr, role);
                 break;

            case "K_Cast":
                 this.process_O(rr, role);
                 break;
            case "Q_Cast":
                 this.process_3O(rr, role);
                 break;

            default:
                 console.log("ng, no pattern found.");
                 break;
        }
    },
}

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    // Handle custom events, for example:
    socket.on('message', (data) => {
        console.log('Received message:', data);
        socket.broadcast.emit('message', data); // Send to all other connected clients
    });
});

console.log('Socket.io server running on http://localhost:3000/');



var main = chess.scene;
main.init();

main.process_notation("b4", "m");
main.process_notation("e5", "e");

main.process_notation("Nc3", "m");
main.process_notation("Nf6", "e");

main.process_notation("f3", "m");
main.process_notation("d5", "e");

main.process_notation("d3", "m");
main.process_notation("Bb4", "e");


//main.convertToNotation();


//main.log();

const board = main.generateChessBoard();
main.displayChessBoard(board);




/*
console.log(classifyChessMove('e4'));      // Pawn Move
console.log(classifyChessMove('Nc6'));     // Piece Move
console.log(classifyChessMove('Nxd5'));    // Piece Capture
console.log(classifyChessMove('O-O'));     // Kingside Castling
console.log(classifyChessMove('O-O-O'));   // Queenside Castling
console.log(classifyChessMove('cxd5'));    // Pawn Capture
console.log(classifyChessMove('e8=Q'));    // Pawn Promotion
console.log(classifyChessMove('R7d1'));    // Ambiguous Move (Rook example)
console.log(classifyChessMove('e4+'));     // Checking Move
console.log(classifyChessMove('e4#'));     // Checkmating Move

const rr = classifyChessMove("Nc1ui96");
console.log(rr.patternName); // Outputs: "Pawn Promotion"
console.log(rr.components);  // Outputs: [ 'e8', '=', 'Q' ]

const testMoves = [
    { move: "Nhf3", expected: "N_A_F" },
    { move: "Bdf5", expected: "B_A_F" },
    { move: "B7f5", expected: "B_A_R" },
    { move: "Bd7f5", expected: "B_A_FR" },
    { move: "Qhf4", expected: "Q_A_F" },
    { move: "Q1f4", expected: "Q_A_R" },
    { move: "Qh1f4", expected: "Q_A_FR" },
    { move: "Rhf6", expected: "R_A_F" },
    { move: "R3f6", expected: "R_A_R" },
    { move: "Rh3f6", expected: "R_A_FR" }
];

// Testing
testMoves.forEach(test => {
    const rr = classifyChessMove(test.move);
    if (rr.patternName === test.expected) {
        console.log(`Move: ${test.move} - Passed`);
        console.log(rr.components);  // Outputs: [ 'e8', '=', 'Q' ]
    } else {
        console.log(`Move: ${test.move} - Failed (Expected: ${test.expected}, Got: ${rr.patternName})`);
    }
});
*/

