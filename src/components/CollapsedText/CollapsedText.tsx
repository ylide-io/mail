import { Button } from "antd";
import { useState } from "react";

const CollapsedText = ({ text, collapseCount }: { text: string, collapseCount: number }) => {
    const [isCollapsed, setIsCollapsed] = useState(true);

    if (text.length <= collapseCount) {
        return <p>{text}</p>;
    }

    const actionText = isCollapsed ? 'Show More' : 'Show Less';
    const displayText = isCollapsed ? `${text.slice(0, collapseCount)}...` : text;

    const handleAction = () => {
        setIsCollapsed(!isCollapsed);
    }

    return (
        <p>
            {displayText}
            <Button type="link" style={{ padding: '0 3px' }} onClick={handleAction}>
                {actionText}
            </Button>
        </p>
    );
};

export default CollapsedText;
