using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class stepClick : MonoBehaviour
{
    private Button btn;
    private ChessSetup chessSetupScript;
    private GameObject canvasObj;

    // Start is called before the first frame update
    void Start()
    {
        canvasObj = GameObject.FindWithTag("Canvas");
        if (canvasObj) 
        {
            chessSetupScript = canvasObj.GetComponent<ChessSetup>();
        }

        btn = GetComponent<Button>();
        btn.onClick.AddListener(OnStepClicked);           
    }

    public void OnStepClicked()
    { 
        //Vector3 stepPosition = this.gameObject.transform.position;
        //float nn = chessSetupScript.vectorToNumber(stepPosition);
        RectTransform rectTransform = GetComponent<RectTransform>();
        Vector2 anchoredPos = rectTransform.anchoredPosition;
        float nn = chessSetupScript.vectorToNumber(anchoredPos);
        chessSetupScript.sendPlay(nn);
    }

    // Update is called once per frame
    void Update()
    {
        
    }
}
