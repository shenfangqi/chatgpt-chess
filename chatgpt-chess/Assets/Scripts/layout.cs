using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using SocketIOClient;
using SocketIOClient.Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;
using TMPro;

public class ChessSetup : MonoBehaviour
{
    public string[][] board;
    public SocketIOUnity socket;

    public GameObject bbPrefab; 
    public GameObject wbPrefab; 
    public GameObject bsPrefab; 
    public GameObject wrPrefab; 
    public GameObject brPrefab; 
    public GameObject wqPrefab; 
    public GameObject bqPrefab; 
    public GameObject wnPrefab; 
    public GameObject bnPrefab; 
    public GameObject wkPrefab; 
    public GameObject bkPrefab;
    public GameObject wsPrefab;
    public GameObject pointerPrefab;

    private float totalGridSize = 1080f;
    private float leftMargin = 84f;  // Adjust based on your actual margin
    private float rightMargin = 84f; // Adjust based on your actual margin
    private float topMargin = 84f;   // Adjust based on your actual margin
    private float bottomMargin = 85f;   // Adjust based on your actual margin
    private float effectiveGridWidth;
    
    public float squareSize;
    public float initPawnLeftPos;
    public float initPawnBottomPos;
    public string selected_tag;
    public float selected_nn;

    public bool isMyStep = true;
    private string overTextInfo;

    private void Start()
    {
    }

    public void StartGame() {
        Debug.Log("--start new game--");
        effectiveGridWidth = totalGridSize - leftMargin - rightMargin;
        squareSize = effectiveGridWidth / 8f;  

        Transform gridBackgroundTransform = transform.Find("gridBackground");
        GameObject step = Instantiate(pointerPrefab, gridBackgroundTransform);
        step.tag = "tag_test";

        RectTransform stepRectTransform = step.GetComponent<RectTransform>();
        float posX = leftMargin + (0 * squareSize) + (squareSize / 2) - 1080/2;
        float posY = topMargin + (0 * squareSize) + (squareSize / 2) - 1080/2;
        stepRectTransform.anchoredPosition = new Vector2(posX, posY);

        initPawnLeftPos = posX;
        initPawnBottomPos = posY;

        SetupSocket();
        SwithUi(true);
    }

    public void StopGame() {
        Debug.Log("--stop game--");
        SwithUi(false);
        socket.Disconnect();

        Transform canvasTransform = transform.Find("gridBackground");

        // Iterate through each child of the Canvas
        for (int i = canvasTransform.childCount - 1; i >= 0; i--) // iterating backwards because we're modifying the collection by destroying children
        {
            Transform child = canvasTransform.GetChild(i);
            if(!child.gameObject.tag.StartsWith("sys_")) {
                Destroy(child.gameObject);
            }
        }
    }

    public void DispOverUI(bool isDisp) {
        Transform textTransform = transform.Find("overPanel/overText");
        TextMeshProUGUI textComponent = textTransform.GetComponent<TextMeshProUGUI>();
        textComponent.text = overTextInfo;
   
        Transform sysBgTransform = transform.Find("overPanel");
        sysBgTransform.gameObject.SetActive(isDisp);
    }

    public void CloseOverUi() {
        DispOverUI(false);
        StopGame();
    }

    private void SwithUi(bool isStarted) {
        Transform sysBgTransform = transform.Find("start");
        if (sysBgTransform != null)
        {
            // Deactivate the GameObject
            sysBgTransform.gameObject.SetActive(!isStarted);
        }

        sysBgTransform = transform.Find("stop");
        if (sysBgTransform != null)
        {
            // Deactivate the GameObject
            sysBgTransform.gameObject.SetActive(isStarted);
        }
    }

    private void SetupSocket() {
        Uri uri = new Uri("http://localhost:3000");
　　　   string ReceivedText = "";

        Debug.Log(uri);
        socket = new SocketIOUnity(uri, new SocketIOOptions
        {
            Query = new Dictionary<string, string>
                {
                    {"token", "UNITY" }
                }
            ,
            EIO = 4
            ,
            Transport = SocketIOClient.Transport.TransportProtocol.WebSocket
        });
        socket.JsonSerializer = new NewtonsoftJsonSerializer();

        ///// reserved socketio events
        socket.OnConnected += (sender, e) =>
        {
            Debug.Log("socket.OnConnected");
        };
        socket.OnDisconnected += (sender, e) =>
        {
            Debug.Log("socket.OnDisconnected");
        };
        socket.OnPing += (sender, e) =>
        {
            Debug.Log("Ping");
        };
        socket.OnPong += (sender, e) =>
        {
            Debug.Log("Pong: " + e.TotalMilliseconds);
        };
        socket.OnDisconnected += (sender, e) =>
        {
            Debug.Log("disconnect: " + e);
        };
        socket.OnReconnectAttempt += (sender, e) =>
        {
            Debug.Log($"{DateTime.Now} Reconnecting: attempt = {e}");
        };

        Debug.Log("Connecting...");
        socket.Connect();  

        socket.OnUnityThread("spin", (data) =>
        {
            //rotateAngle = 0;
        });

        socket.OnAnyInUnityThread((name, response) =>
        {
            Debug.Log("name:"+name);
            if(name == "over") {
                ReceivedText = response.GetValue<string>();
                Debug.Log("over:" + ReceivedText);
                if(ReceivedText=="lose") {
                    overTextInfo = "You lose";
                    DispOverUI(true);
                }
                else if(ReceivedText=="win") {
                    overTextInfo = "You win";
                    DispOverUI(true);
                }                
            }
            else if(name == "grid") {
                Transform canvasTransform = transform.Find("gridBackground");

                // Iterate through each child of the Canvas
                for (int i = canvasTransform.childCount - 1; i >= 0; i--) // iterating backwards because we're modifying the collection by destroying children
                {
                    Transform child = canvasTransform.GetChild(i);
                    //if (!child.CompareTag("sys_bg_grid")) {
                    if(!child.gameObject.tag.StartsWith("sys_")) {
                        Destroy(child.gameObject);
                    }
                }

                ReceivedText = response.GetValue<string>();
                board = JsonConvert.DeserializeObject<string[][]>(ReceivedText);
                System.Array.Reverse(board);
                SetupPawns(board);

                isMyStep = true;
            }
            else if(name == "mysteps") {
                ReceivedText = response.GetValue<string>();
                int[] steps = JsonConvert.DeserializeObject<int[]>(ReceivedText);
                putStepsPointer(steps);
            }
        });
    }

    private void putStepsPointer(int[] steps) {
        List<Vector2> stepsPointer = new List<Vector2>();
        int nx, ny;

        for(int i=0;i<steps.Length;i++) {
            nx = steps[i]/10;
            ny = steps[i]%10;
            Vector2 pt = new Vector2(nx,ny);
            stepsPointer.Add(pt);
        }

        // Directly get the transform of the Canvas since this script is attached to it
        Transform canvasTransform = transform.Find("gridBackground");

        // Iterate through each child of the Canvas
        for (int i = canvasTransform.childCount - 1; i >= 0; i--) // iterating backwards because we're modifying the collection by destroying children
        {
            Transform child = canvasTransform.GetChild(i);
            if (child.CompareTag("Pointer"))
            {
                Destroy(child.gameObject);
            }
        }

        foreach (Vector2 step in stepsPointer)
        {
            putSteps(step);
        }
    }

    private void putSteps(Vector3 pos) {
        Transform gridBackgroundTransform = transform.Find("gridBackground");
        GameObject step = Instantiate(pointerPrefab, gridBackgroundTransform);

        //float posX = pos.x * squareSize + initPawnLeftPos;
        //float posY = pos.y * squareSize + initPawnBottomPos;
        //step.transform.position = new Vector3(posX, posY, 0);

        Debug.Log("-------------");
        Debug.Log(pos);

        RectTransform stepRectTransform = step.GetComponent<RectTransform>();
        float posX = leftMargin + (pos.x * squareSize) + (squareSize / 2) - 1080/2;
        float posY = topMargin + (pos.y * squareSize) + (squareSize / 2) - 1080/2;
        Debug.Log(posX +":"+ posY);
        stepRectTransform.anchoredPosition = new Vector2(posX, posY);
    }

    public void setSelectedPawn(string sel, float nn) {
        Debug.Log("sele:" + sel);
        selected_tag = sel;
        selected_nn = nn;
    }

    private void numberToVector(int posNum) {
        int nx = posNum/10;
        int ny = posNum%10-1;

        Debug.Log("nx:" + nx);
        Debug.Log("ny:" + ny);
    }

    private void SetupPawns(string[][] boardData) {
        Transform gridBackgroundTransform = transform.Find("gridBackground");

        //GameObject step = Instantiate(pointerPrefab, gridBackgroundTransform);
        //RectTransform stepRectTransform = step.GetComponent<RectTransform>();
        //stepRectTransform.anchoredPosition = new Vector2(0, 0);



/*
        for (int i = 0; i < 8; i++) // for each column
        {
            for (int j = 0; j < 8; j++)
            {
                if(boardData[j][i] != ".") {
                    GameObject pawnObj = GetPawnPrefab(boardData[j][i]);
                    GameObject pawn = Instantiate(pawnObj, transform);

                    float posX = leftMargin + (i * squareSize) + (squareSize / 2);
                    float posY = totalGridSize - topMargin - ((j*-1+1) * squareSize) - (squareSize / 2);
                    pawn.transform.position = new Vector3(posX, posY-50, 0);
                    pawn.transform.SetSiblingIndex(2);
                }
            }
        }
*/

        for (int i = 0; i < 8; i++) // for each column
        {
            for (int j = 0; j < 8; j++)
            {
                if(boardData[j][i] != ".") {
                    GameObject pawnObj = GetPawnPrefab(boardData[j][i]);
                    GameObject pawn = Instantiate(pawnObj, gridBackgroundTransform);
                    pawn.transform.SetSiblingIndex(2);
                    RectTransform pawnRectTransform = pawn.GetComponent<RectTransform>();

                    //float posX = leftMargin + (i * squareSize) + (squareSize / 2);
                    //float posY = totalGridSize - topMargin - ((j*-1+1) * squareSize) - (squareSize / 2);
                    //pawn.transform.position = new Vector3(posX, posY-50, 0);
                    
                    float posX = leftMargin + (i * squareSize) + (squareSize / 2) - 1080/2;
                    float posY = topMargin + (j * squareSize) + (squareSize / 2) - 1080/2;
                    
                    pawnRectTransform.anchoredPosition = new Vector2(posX, posY);
                }
            }
        }
    }

    public float vectorToNumber(Vector3 pos) {
        float nx = (pos.x - initPawnLeftPos) / squareSize;
        float ny = (pos.y - initPawnBottomPos) / squareSize;

        float nn = nx*10 + ny;
        return nn;
    }

    public void sendSteps(string ptag, float nn, Vector2 pos) {
        Transform textTransform = transform.Find("log");
        TextMeshProUGUI textComponent = textTransform.GetComponent<TextMeshProUGUI>();
        textComponent.text = pos.x.ToString() +":"+ pos.y.ToString();

        if(isMyStep) {
            socket.Emit("steps", nn);
            setSelectedPawn(ptag, nn);            
        }
    }

    public void sendPlay(float nn) {
        if(isMyStep) {
            string toSend = selected_tag +"||"+ nn +"||"+ selected_nn;
            socket.Emit("plays", toSend);
            isMyStep = false;            
        }
    }

    private GameObject GetPawnPrefab(string pawn) {
        switch (pawn)
        {
            case "bb":
                return bbPrefab;
            case "wb":
                return wbPrefab;
            case "ws":
                return wsPrefab;
            case "bs":
                return bsPrefab;
            case "wr":
                return wrPrefab;
            case "br":
                return brPrefab;
            case "wq":
                return wqPrefab;
            case "bq":
                return bqPrefab;
            case "wn":
                return wnPrefab;
            case "bn":
                return bnPrefab;
            case "wk":
                return wkPrefab;
            case "bk":
                return bkPrefab;
            default:
                return null;
        }        
    }

    // Update is called once per frame
    void Update()
    {
        
    }
}
