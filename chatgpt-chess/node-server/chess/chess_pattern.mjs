export const classify_chess_move = (move) => {
    // TODO O-O-O+ should be processed.
    const patterns = {
        'Pa_M': /^([a-h][1-8])$/,                            //pawn move    
        'Pa_M1': /^([a-h][1-8])([a-h][1-8])$/,               //pawn move    

        'Pi_M': /^([KQBNR])([a-h][1-8])$/,                   //piece move  
        'Pi_C1': /^([KQBNR])(x)([a-h][1-8])$/,               //piece capture 
        'Pi_C2': /^([KQBNR])([a-h])(x)([a-h][1-8])$/,        //piece capture 

        'Pi_C3': /^([a-h][1-8])(x)([a-h][1-8])$/,            //piece capture 
        'Pa_C': /^([a-h])(x)([a-h][1-8])$/,                  //pawn capture 
        'K_Cast': /^(O-O)\b$/,                               //king casting  -
        'K_Cast1': /^(0-0)\b$/,                               //king casting  -
        'Q_Cast': /^(O-O-O)$/,                               //queen casting  -
        'Q_Cast1': /^(0-0-0)$/,                               //queen casting  -
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
        //'KQ_F': /^([KQ])([a-h][1-8])$/,  
        //'KQ_F_C': /^([KQ])(x)([a-h][1-8])$/,  

        'A_F': /^([QBNR])([a-h][1-8])([a-h][1-8])$/,  
        'A_F_CM': /^([QBNR])([a-h][1-8])([a-h][1-8])(\+)$/,

        'A_F_RM': /^([QBNR])([a-h])([a-h][1-8])(\+)$/,  
        'A_F_M1': /^([QBNR])([a-h])([a-h][1-8])$/, 

        'A_F_C': /^([QBNR])([a-h][1-8])(x)([a-h][1-8])$/,
        'A_F_KC': /^([QBNR])([a-h][1-8])(x)([a-h][1-8])(\+)$/,

        'A_R': /^([QBNR])([1-8])([a-h][1-8])$/,   
        'A_R_CM': /^([QBNR])([1-8])([a-h][1-8])(\+)$/,
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