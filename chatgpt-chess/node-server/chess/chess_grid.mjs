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

export default class grid {
    constructor() {
        this._pawn2grid = {
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
        };

        this._grid2pawn = {};
    }

    init() {
        this.gen_grid2pawn();
    }

    gen_grid2pawn() {
        this._grid2pawn = this._pawn2grid.swapKeyValue();
    }

    gen_pawn2grid() {
        this._pawn2grid = this._grid2pawn.swapKeyValue();
    }

    available_moves(pos,role=null,cha=null) {
        pos = parseInt(pos);

        // enemy or me
        if(!role) {
            role = this.role_by_pos(pos);
        }
        // character, eg: bishop, rook, soldier etc.
        if(!cha) {
            cha = this.cha_by_pos(pos);
        }

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
                        //if pos on top is occupied by other pawn, then skip
                        if(arr1.length>0) {
                            this.scan_1_top_s(pos+1, arr2, role);
                        } 

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
                        var arr2 = [];
                        var arr3 = [];
                        var arr4 = [];
                        // if nothing return means you can move down 1 step, so you should check the next down step.
                        if(!this.scan_1_down_s(pos, arr1, role)) {
                            this.scan_1_down_s(pos-1, arr2, role);
                        }
                        this.scan_1_down_right_s(pos, arr3, role);
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
    }

    // m or e
    role_by_pos(pos) {
        pos = parseInt(pos);
        const pawn = this._grid2pawn[pos];
        var role;
        if(pawn!== undefined) {
            role = pawn.split("_")[2];
            return role;
        }

        return false;
    }

    // s,q,k,n..etc
    cha_by_pos(pos) {
        pos = parseInt(pos);
        const pawn = this._grid2pawn[pos];
        var cha;
        if(pawn!== undefined) {
            cha = pawn.split("_")[0];
            return cha;
        }

        return false;
    }

    _valid_grid(pos) {
        pos = parseInt(pos);
        if(pos % 10 > 7) {
            return false;
        }
        if(pos < 0 || pos > 77) {
            return false;
        }

        return true;
    }

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
    }

    _is_checking(pos, role) {

    }

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
            ret_pos.push(pos);
            return ret_pos;
        }
        else {
            return ret_pos;
        }
    }

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
    }


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
    }

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
    }

    //move 1 grid to top.
    //for soldier
    scan_1_top_s(pos, ret_pos, role) {
        pos = parseInt(pos);
        pos+=1;
        return this.scan_1_s(pos, ret_pos, role);   
    }

    scan_1_top_right_s(pos, ret_pos, role) {
        pos = parseInt(pos);
        pos+=11;
        return this.scan_1_s_c(pos, ret_pos, role);   
    }

    scan_1_top_left_s(pos, ret_pos, role) {
        pos = parseInt(pos);
        pos-=9;
        return this.scan_1_s_c(pos, ret_pos, role);   
    }

    scan_1_down_right_s(pos, ret_pos, role) {
        pos = parseInt(pos);
        pos+=9;
        return this.scan_1_s_c(pos, ret_pos, role);   
    }

    scan_1_down_left_s(pos, ret_pos, role) {
        pos = parseInt(pos);
        pos-=11;
        return this.scan_1_s_c(pos, ret_pos, role);   
    }

    //move 1 grid to down.
    //for soldier
    scan_1_down_s(pos, ret_pos, role) {
        pos = parseInt(pos);
        pos-=1;
        return this.scan_1_s(pos, ret_pos, role);
    }


    //move 1 grid to right.
    //for lord
    scan_1_right(pos, ret_pos, role) {
        pos = parseInt(pos);
        pos+=10;
        return this.scan_1(pos, ret_pos, role);
    }

    //move 1 grid to left.
    //for lord
    scan_1_left(pos, ret_pos, role) {
        pos = parseInt(pos);
        pos-=10;
        return this.scan_1(pos, ret_pos, role);   
    }

    //move 1 grid to top.
    //for lord
    scan_1_top(pos, ret_pos, role) {
        pos = parseInt(pos);
        pos+=1;
        return this.scan_1(pos, ret_pos, role);   
    }

    //move 1 grid to down.
    //for lord
    scan_1_down(pos, ret_pos, role) {
        pos = parseInt(pos);
        pos-=1;
        return this.scan_1(pos, ret_pos, role);
    }

    //for lord
    scan_1_top_right(pos, ret_pos, role) {
        pos = parseInt(pos);
        pos+=11;
        return this.scan_1(pos, ret_pos, role);   
    }

    //for lord
    scan_1_top_left(pos, ret_pos, role) {
        pos = parseInt(pos);
        pos-=9;
        return this.scan_1(pos, ret_pos, role);   
    }

    //for lord
    scan_1_down_right(pos, ret_pos, role) {
        pos = parseInt(pos);
        pos+=9;
        return this.scan_1(pos, ret_pos, role);   
    }

    //for lord
    scan_1_down_left(pos, ret_pos, role) {
        pos = parseInt(pos);
        pos-=11;
        return this.scan_1(pos, ret_pos, role);   
    }

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
    }

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
    }

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
    }

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
    }

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
    }

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
    }

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
    }

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
    }

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
    }
}