import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

export function Barcode({ value, width = 1, height = 30, fontSize = 12 }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (canvasRef.current && value) {
            try {
                JsBarcode(canvasRef.current, value, {
                    format: "CODE128",
                    width: width,
                    height: height,
                    displayValue: true,
                    fontSize: fontSize,
                    margin: 0,
                    background: "transparent"
                });
            } catch (e) {
                console.warn("Invalid barcode value", value);
            }
        }
    }, [value, width, height, fontSize]);

    return <img ref={canvasRef} style={{ maxWidth: '100%', height: 'auto', display: 'block' }} alt={value} />;
}
