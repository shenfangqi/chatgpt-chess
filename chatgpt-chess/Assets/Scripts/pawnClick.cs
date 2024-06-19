using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using System;  // Add this line

public class pawnClick : MonoBehaviour
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
        btn.onClick.AddListener(OnPawnClicked);        
    }

    public void OnPawnClicked()
    {
        RectTransform rectTransform = GetComponent<RectTransform>();
        Vector2 anchoredPos = rectTransform.anchoredPosition;

        float nn = chessSetupScript.vectorToNumber(anchoredPos);
        chessSetupScript.sendSteps(tag, nn, anchoredPos);
    }

    // Update is called once per frame
    void Update()
    {
        
    }

    private void OnDestroy()
    {
        try {
            if (btn != null && btn.onClick != null) {
                btn.onClick.RemoveListener(OnPawnClicked);
            }
        } catch (NullReferenceException e) {
            Debug.LogError("Failed to remove listener: " + e.Message);
        }
    }
}
