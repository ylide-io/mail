import React from 'react';

interface CopyTooltipProps {
    status?: "Copied" | "Hover"
}

const CopyTooltip:React.FC<CopyTooltipProps> = ({status}) => {
    return (
        <>
        {status === "Copied" && <div style={{
            position: "absolute",
            top: 30,
            right: 0,
            padding: 3,
            borderRadius: "5px",
            backgroundColor: "#18a689",
            color: "#ffffff",
        }}>Copied</div>}
            {status === "Hover" && <div style={{
                position: "absolute",
                top: 30,
                right: 0,
                padding: 3,
                borderRadius: "5px",
                backgroundColor: "#18a689",
                color: "#ffffff",
            }}>Click to copy</div>}
        </>
    );
};

export default CopyTooltip;
